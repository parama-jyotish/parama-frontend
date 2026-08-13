/**
 * 出生地解決の回帰検証（実ネットワークを使う）。
 *
 *   node scripts/verify-birth-place.mjs
 *
 * resolveBirthPlace() が返した送信値を、バックエンドと同じ経路
 * （jyoti-app/utils.py の get_coordinates() ＝ geopy Nominatim.geocode() ＝ /search?q=...）へ
 * 実際に通し、意図した場所に解決することを確かめる。
 *
 * Nominatim の利用ポリシーに従い、1リクエストあたり1.2秒の間隔を空け、
 * 連絡先を含む User-Agent を送る。全件で2分ほどかかる。
 *
 * 単体テスト（npm test）は辞書の照合だけを見る。こちらは「送った文字列が
 * 本当に解決するか」を見るもので、目的が違う。
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

const { resolveBirthPlace } = await import("../src/lib/birth-place.ts");

/**
 * [入力, 期待する種別, 期待する結果]
 *
 * 期待する結果は3通り:
 *   [緯度, 経度] … Nominatim が返した座標がこの点の近傍（TOLERANCE_KM 以内）であること。
 *                  廃止された市区町村のように、返る地名が入力と一致しないものに使う。
 *   "文字列"      … Nominatim が返した地名にこの語が含まれること。
 *                  離島や広域の自治体では Nominatim が区域の中心へ寄せるため、
 *                  距離ではなく「意図した自治体の中か」で見るほうが正しい。
 *   null         … 解決できさえすればよい（辞書外を素通しする経路の確認）。
 */
const CORPUS = [
  // ── docs/30 §0 が挙げた「誤った座標を黙って返す」2件 ──
  ["北区赤羽1-1-1", "ambiguous", null],
  ["東京都北区赤羽1-1-1", "coords", [35.762, 139.73]],
  ["東京都保谷市東町1-1", "coords", [35.742, 139.559]],
  // ── 東京都の島嶼部 ──
  ["東京都利島村", "coords", "利島村"],
  ["東京都八丈町", "coords", "八丈町"],
  ["東京都小笠原村", "coords", "小笠原村"],
  ["東京都御蔵島村", "coords", "御蔵島村"],
  ["東京都青ヶ島村", "coords", "青ヶ島村"],
  ["東京都三宅村", "coords", "三宅村"],
  ["東京都新島村", "coords", "新島村"],
  ["東京都神津島村", "coords", "神津島村"],
  ["東京都大島町", "coords", "大島町"],
  // ── 全国のエッジ（離島・北端・西端）。旧方式では十島村・三島村が解決できなかった ──
  ["沖縄県与那国町", "coords", "与那国町"],
  ["北海道稚内市", "coords", "稚内市"],
  ["長崎県対馬市", "coords", "対馬市"],
  ["島根県隠岐の島町", "coords", "隠岐の島町"],
  ["新潟県佐渡市", "coords", "佐渡市"],
  ["北海道奥尻町", "coords", "奥尻町"],
  ["鹿児島県十島村", "coords", "十島村"],
  ["鹿児島県三島村", "coords", "三島村"],
  ["沖縄県竹富町", "coords", "竹富町"],
  // ── 政令市 ──
  ["仙台市", "coords", "仙台市"],
  ["浜松市", "coords", "浜松市"],
  ["宮城県仙台市青葉区中央1丁目1-1", "coords", "青葉区"],
  // ── 廃止された市区町村 ──
  ["保谷市", "coords", [35.742, 139.559]],
  ["田無市", "coords", [35.725, 139.538]],
  ["埼玉県浦和市", "coords", [35.862, 139.646]],
  ["大宮市", "coords", [35.925, 139.58]],
  ["静岡県浜松市浜北区", "coords", [34.793, 137.79]],
  // ── 表記ゆれ・入力のくせ ──
  ["〒130-0011 東京都墨田区石原1-1-1", "coords", "墨田区"],
  ["　東京都渋谷区　", "coords", "渋谷区"],
  ["袖ヶ浦市", "coords", "袖ケ浦市"],
  ["竜ヶ崎市", "coords", "龍ケ崎市"],
  ["高知県檮原町", "coords", "原町"],
  ["せたがやく", "coords", "世田谷区"],
  ["北海道札幌市中央区北1条西2丁目", "coords", "中央区"],
  // ── 座標入力（南半球・西半球を含む）──
  ["35.68, 139.76", "coords", [35.68, 139.76]],
  ["S33.8688 E151.2093", "coords", [-33.869, 151.209]],
  ["-34.6037,-58.3816", "coords", [-34.604, -58.382]],
  // ── 辞書外（従来どおり文字列で送り Nominatim に委ねる）──
  ["Paris", "fallback", null],
  ["シドニー", "fallback", null],
  ["ブエノスアイレス", "fallback", null],
  ["仙台", "fallback", null],
  // ── 送信せずにエラーにするもの ──
  ["東京都せたがや区", "unknown", null],
  ["架空県架空市", "unknown", null],
];

/** 許容するずれ。代表点（役所・町字中央値）と Nominatim の行政区画ノードの差を見込む。 */
const TOLERANCE_KM = 8;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function distanceKm(a, b) {
  const dy = (a[0] - b[0]) * 111.32;
  const dx = (a[1] - b[1]) * 111.32 * Math.cos((a[0] * Math.PI) / 180);
  return Math.hypot(dx, dy);
}

async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&limit=1`;
  const res = await httpFetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return { error: `HTTP ${res.status}` };
  const body = await res.json();
  if (!body.length) return { error: "解決できない（バックエンドは 400 を返す）" };
  return { lat: Number(body[0].lat), lng: Number(body[0].lon), name: body[0].display_name };
}

const failures = [];
let checked = 0;

for (const [input, expectedKind, expected] of CORPUS) {
  const r = await resolveBirthPlace(input);
  const summary =
    r.kind === "coords" ? r.label
    : r.kind === "ambiguous" ? `候補${r.candidates.length}件`
    : r.kind === "fallback" ? `文字列「${r.value}」を送る`
    : `エラー(${r.reason})`;

  if (r.kind !== expectedKind) {
    failures.push(`${input}: 種別が ${expectedKind} ではなく ${r.kind}（${summary}）`);
    console.log(`✖ ${input.padEnd(30)} ${r.kind}: ${summary}`);
    continue;
  }
  // 候補提示・エラーは送信しないので、ここで確定
  if (r.kind === "ambiguous" || r.kind === "unknown") {
    checked++;
    console.log(`✔ ${input.padEnd(30)} ${summary}（送信しない）`);
    continue;
  }

  await sleep(1200);
  const got = await geocode(r.value);
  if (got.error) {
    failures.push(`${input}: 送信値「${r.value}」を Nominatim が解決できない（${got.error}）`);
    console.log(`✖ ${input.padEnd(30)} 送信「${r.value}」→ ${got.error}`);
    continue;
  }

  let ok;
  let detail;
  if (Array.isArray(expected)) {
    const km = distanceKm([got.lat, got.lng], expected);
    ok = km < TOLERANCE_KM;
    detail = `${km.toFixed(2)}km`;
  } else if (typeof expected === "string") {
    ok = got.name.includes(expected);
    detail = ok ? `「${expected}」を含む` : `「${expected}」を含まない`;
  } else {
    ok = true;
    detail = "解決した";
  }

  if (ok) checked++;
  else failures.push(`${input}: 送信値「${r.value}」が ${got.name} に解決した（${detail}）`);
  console.log(`${ok ? "✔" : "✖"} ${input.padEnd(30)} ${summary} → 「${r.value}」→ ${detail}  ${got.name.slice(0, 42)}`);
}

console.log(`\n${checked}/${CORPUS.length} 合格`);
for (const f of failures) console.log(`  - ${f}`);
process.exitCode = failures.length ? 1 : 0;
