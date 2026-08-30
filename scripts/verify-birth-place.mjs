/**
 * 辞書外の出生地（fallback 経路）の回帰検証。実ネットワークを使う。
 *
 *   node scripts/verify-birth-place.mjs
 *
 * 市区町村マスターで解決できた入力は、緯度経度を `/api/start` へ直接渡すようになったため
 * （StartRequest.latitude/longitude）、Nominatim を通らない。したがってその経路を
 * ここで叩いても意味がなく、検証は `npm test` の単体テストが担っている。
 *
 * **Nominatim に依存が残るのは、マスターに無い地名（主に海外）だけ**である。
 * このスクリプトはその経路だけを実際に投げて、解決できるかを確かめる。
 *
 * Nominatim の利用ポリシーに従い、1リクエストあたり1.2秒の間隔を空け、
 * 連絡先を含む User-Agent を送る。全件で40秒ほどかかる。
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const UA = "PARAMA-birthplace-verification/1.0 (info@parama-jyotish.jp)";

// 廃止された市区町村のマスターはブラウザでは fetch で取る。ここではファイルから読ませる
const httpFetch = globalThis.fetch;
const historical = readFileSync(join(ROOT, "public/data/municipalities-historical.json"), "utf8");
globalThis.fetch = async (url, init) =>
  String(url) === "/data/municipalities-historical.json"
    ? { ok: true, status: 200, json: async () => JSON.parse(historical) }
    : httpFetch(url, init);

const { resolveBirthPlace, birthPlacePayload } = await import("../src/lib/birth-place.ts");

/**
 * [入力, Nominatim が解決できることを期待するか]
 *
 * いずれもマスターに無い＝ fallback になる入力。false のものは解決できないのが正しい挙動で、
 * 利用者にはバックエンドの 400 がインラインエラーとして見える（黙った誤答にはならない）。
 */
const CORPUS = [
  // 欧文・カナの海外地名
  ["Paris", true],
  ["Sydney, Australia", true],
  ["シドニー", true],
  ["ブエノスアイレス", true],
  ["ニューヨーク市", true],
  ["ホーチミン市", true],
  ["セブ市", true],
  // 漢字圏の海外地名。日本の住所と字面で見分けられないため素通しする（docs/32 Step 2）
  ["韓国釜山市", true],
  ["中国北京市朝陽区", true],
  ["台湾台北市", true],
  ["ソウル特別市", true],
  // 市区町村を特定しない日本語入力
  ["仙台", true],
  ["東京", true],
  ["沖縄県", true],
  // 町字だけの入力は Nominatim が解決できない。400 になるのが正しい（docs/32 §3-1）
  ["西新宿2-8-1", false],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&limit=1`;
  const res = await httpFetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return { error: `HTTP ${res.status}` };
  const body = await res.json();
  return body.length ? { name: body[0].display_name } : { error: "解決できない" };
}

const failures = [];

for (const [input, shouldResolve] of CORPUS) {
  const resolution = await resolveBirthPlace(input);

  // まずフロント側の契約。これらは緯度経度を付けずに地名だけを送る経路のはず
  if (resolution.kind !== "fallback") {
    failures.push(`${input}: fallback ではなく ${resolution.kind} になった`);
    console.log(`✖ ${input.padEnd(20)} 種別が fallback ではない（${resolution.kind}）`);
    continue;
  }
  const payload = birthPlacePayload(resolution, null);
  if (payload?.latitude !== undefined || payload?.longitude !== undefined) {
    failures.push(`${input}: fallback なのに緯度経度が付いている`);
    console.log(`✖ ${input.padEnd(20)} 緯度経度が付いている`);
    continue;
  }

  // 次にバックエンド側。この地名で Nominatim が解決できるか
  await sleep(1200);
  const got = await geocode(payload.birth_place);
  const resolved = !got.error;
  const ok = resolved === shouldResolve;
  if (!ok) {
    failures.push(
      resolved
        ? `${input}: 解決できないはずが ${got.name} に解決した`
        : `${input}: 解決できるはずが ${got.error}`
    );
  }
  const detail = resolved ? got.name.slice(0, 46) : `${got.error}（バックエンドは 400 を返す）`;
  console.log(`${ok ? "✔" : "✖"} ${input.padEnd(20)} 「${payload.birth_place}」→ ${detail}`);
}

console.log(`\n${CORPUS.length - failures.length}/${CORPUS.length} 合格`);
for (const f of failures) console.log(`  - ${f}`);
process.exitCode = failures.length ? 1 : 0;
