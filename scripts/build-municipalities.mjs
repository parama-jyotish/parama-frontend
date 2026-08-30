/**
 * 市区町村マスターを生成する（ビルド時・オフライン）。
 *
 *   node scripts/build-municipalities.mjs
 *
 * 出力（いずれもリポジトリにコミットする。実行時に外部取得はしない）:
 *   src/data/municipalities.ts                  現行の市区町村。/start のバンドルに載る
 *   public/data/municipalities-historical.json  1920年以降に廃止された市区町村。照合が外れたときだけ遅延取得する
 *
 * 入力（初回のみ取得し scripts/.cache/ に置く。再実行はキャッシュを使う）:
 *   Geolonia 住所データ latest.csv        町字レベル27万件。市区町村へ集約して代表点を作る
 *   総務省 全国地方公共団体コード (xlsx)   現行団体の突合基準
 *   CODH 歴史的行政区域データセットβ版    1889年以降の市区町村と代表点
 *
 * 出典表示（いずれも CC BY 4.0。src/app/legal/ の表示と対応させること）:
 *   『Geolonia 住所データ』（株式会社Geolonia）
 *   『Geoshape市区町村IDデータセット』（CODH作成）
 */

import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { inflateRawSync, gzipSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { placeKey } from "../src/lib/place-key.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = join(ROOT, "scripts/.cache");

/**
 * version は生成物へ記録する版の表示名。**URL を差し替えるときは必ず一緒に直すこと。**
 * Geolonia は毎月更新される単一 URL で版が名乗られていないため、SHA-256 だけで識別する。
 */
const SOURCES = {
  geolonia: {
    url: "https://raw.githubusercontent.com/geolonia/japanese-addresses/master/data/latest.csv",
    file: "latest.csv",
    version: "",
  },
  soumu: {
    url: "https://www.soumu.go.jp/main_content/000925835.xlsx",
    file: "soumu-city-codes.xlsx",
    version: "R6.1.1",
  },
  codh: {
    url: "https://geonlp.ex.nii.ac.jp/dictionary/geoshape-city/geoshape-city-geolod.csv",
    file: "geoshape-city-geolod.csv",
    version: "2023-10-18",
  },
};

// Nominatim 以外への取得だが、出所を名乗る方針は揃えておく。
const USER_AGENT = "PARAMA-municipality-build/1.0 (info@parama-jyotish.jp)";

const problems = [];
const note = (msg) => problems.push(msg);

// ── 取得 ────────────────────────────────────────────────
async function load(key) {
  const { url, file } = SOURCES[key];
  const path = join(CACHE, file);
  if (!existsSync(path)) {
    process.stderr.write(`fetch ${url}\n`);
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
    mkdirSync(CACHE, { recursive: true });
    writeFileSync(path, Buffer.from(await res.arrayBuffer()));
  }
  return readFileSync(path);
}

// ── CSV ─────────────────────────────────────────────────
/** RFC4180 相当の最小パーサ。Geolonia・CODH とも引用符付きフィールドを含む。 */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c !== '"') field += c;
      else if (text[i + 1] === '"') { field += '"'; i++; }
      else quoted = false;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  const head = rows[0];
  return rows.slice(1)
    .filter((r) => r.length >= head.length)
    .map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

// ── xlsx ────────────────────────────────────────────────
/** zip の中央ディレクトリを辿って各エントリを取り出す（xlsx は zip）。 */
function unzip(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("xlsx: End of Central Directory が見つからない");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  // ZIP64 では件数・オフセットが 0xFFFF / 0xFFFFFFFF の番兵になる。総務省の xlsx は
  // 100KB 程度なので該当しないが、黙って壊れた値で読み進めないよう弾いておく
  if (count === 0xffff || p === 0xffffffff) throw new Error("xlsx: ZIP64 形式には対応していない");
  const files = new Map();
  for (let n = 0; n < count; n++) {
    const method = buf.readUInt16LE(p + 10);
    const compressedSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localHeader = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    // ローカルヘッダ側の可変長は中央ディレクトリの値と一致しないことがあるので読み直す
    const localNameLen = buf.readUInt16LE(localHeader + 26);
    const localExtraLen = buf.readUInt16LE(localHeader + 28);
    const start = localHeader + 30 + localNameLen + localExtraLen;
    const raw = buf.subarray(start, start + compressedSize);
    // 0=無圧縮 / 8=deflate のみ扱う。未知の方式を inflateRawSync へ渡すと
    // 意味の無いデータか例外になるので、方式そのものを弾く
    if (method !== 0 && method !== 8) {
      throw new Error(`xlsx: 未対応の圧縮方式 ${method}（${name}）`);
    }
    files.set(name, method === 0 ? raw : inflateRawSync(raw));
    p += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

const unescapeXml = (s) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, "&");

/** xlsx の指定シートを { A: 値, B: 値, ... } の配列で返す（ヘッダ行は落とす）。 */
function readSheet(files, sheetNo) {
  const sharedXml = files.get("xl/sharedStrings.xml").toString("utf8");
  // <rPh> はふりがな。除かないと「浜松市浜名区ナ」のようにルビが名前へ混入する
  const shared = [...sharedXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    unescapeXml(
      [...m[1].replace(/<rPh[\s\S]*?<\/rPh>/g, "").matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
        .map((t) => t[1]).join("")
    )
  );
  const xml = files.get(`xl/worksheets/sheet${sheetNo}.xml`).toString("utf8");
  const rows = [...xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map((m) => {
    const cells = {};
    // 空セルは <c r="C2" s="3"/> と自己終了するため、そちらを先に判定する
    for (const c of m[1].matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const v = (c[3] ?? "").match(/<v>([\s\S]*?)<\/v>/);
      cells[c[1]] = !v ? "" : c[2].includes('t="s"') ? shared[Number(v[1])] : unescapeXml(v[1]);
    }
    return cells;
  });
  return rows.slice(1);
}

// ── 集計ヘルパ ──────────────────────────────────────────
/** 代表点は町字座標の中央値。平均は飛び地・離島に引っ張られる。 */
function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** 送信値と同じ丸め（src/lib/birth-place.ts の round5）。 */
const round5 = (n) => parseFloat(n.toFixed(5));

/** 2点間の概算距離（km）。代表点のずれを報告するためだけに使う。 */
function distanceKm(aLat, aLng, bLat, bLng) {
  const dy = (aLat - bLat) * 111.32;
  const dx = (aLng - bLng) * 111.32 * Math.cos((aLat * Math.PI) / 180);
  return Math.hypot(dx, dy);
}

/** 半角カナ → 全角カナ（総務省コード表のカナ列がこの形）。 */
const HALFWIDTH_KANA = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝｧｨｩｪｫｬｭｮｯｰ";
const FULLWIDTH_KANA = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンァィゥェォャュョッー";

function toFullWidthKana(input) {
  return input
    .replace(/([ｶ-ﾄﾊ-ﾎ])ﾞ/g, (_, c) => String.fromCharCode(FULLWIDTH_KANA.charCodeAt(HALFWIDTH_KANA.indexOf(c)) + 1))
    .replace(/([ﾊ-ﾎ])ﾟ/g, (_, c) => String.fromCharCode(FULLWIDTH_KANA.charCodeAt(HALFWIDTH_KANA.indexOf(c)) + 2))
    .replace(/[ｱ-ﾝｧ-ｯｰｦ]/g, (c) => FULLWIDTH_KANA[HALFWIDTH_KANA.indexOf(c)] ?? c);
}

/** 政令市のカナは、配下の区の共通接頭辞から取る（「サッポロシチュウオウク」等の共通部）。 */
function commonPrefix(values) {
  if (!values.length) return "";
  let prefix = values[0];
  for (const v of values.slice(1)) {
    let i = 0;
    while (i < prefix.length && i < v.length && prefix[i] === v[i]) i++;
    prefix = prefix.slice(0, i);
  }
  return prefix;
}

// ── 1. Geolonia を市区町村へ集約 ────────────────────────
async function buildFromGeolonia() {
  const rows = parseCsv((await load("geolonia")).toString("utf8"));
  const byCode = new Map();
  for (const r of rows) {
    const code = r["市区町村コード"];
    if (!code) continue;
    let entry = byCode.get(code);
    if (!entry) {
      entry = {
        code,
        pref: r["都道府県名"],
        // 郡部は「石狩郡当別町」のように郡を含む。郡は別に持ち、名前は町村名だけにする
        fullName: r["市区町村名"],
        kana: r["市区町村名カナ"],
        lats: [],
        lngs: [],
      };
      byCode.set(code, entry);
    }
    const lat = parseFloat(r["緯度"]);
    const lng = parseFloat(r["経度"]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) { entry.lats.push(lat); entry.lngs.push(lng); }
  }
  const out = [];
  const offCenter = [];
  for (const e of byCode.values()) {
    if (!e.lats.length) { note(`座標を持つ町字が無い: ${e.pref}${e.fullName}（${e.code}）`); continue; }
    // 郡に属するのは町村だけ。末尾を町/村に限らないと「蒲郡市」の郡を郡名と誤認し、
    // county="蒲郡" / name="市" のように壊れる（大和郡山市・小郡市も同様）。
    const gun = e.fullName.match(/^(.+郡)(.+[町村])$/);
    const point = representativePoint(e.lats, e.lngs);
    if (point.shifted > REPORT_OFF_CENTER_KM) {
      offCenter.push(`${e.pref}${e.fullName} ${point.shifted.toFixed(1)}km`);
    }
    out.push({
      code: e.code,
      pref: e.pref,
      county: gun ? gun[1] : "",
      name: gun ? gun[2] : e.fullName,
      kana: e.kana,
      lat: round5(point.lat),
      lng: round5(point.lng),
    });
  }
  if (offCenter.length) {
    // 誤りではないが、単一の点で代表しにくい形の自治体。データ更新で増減を見るために出す
    offCenter.sort();
    process.stderr.write(
      `  中央から離れた町字を代表点にした自治体（凹形・飛地・細長い形）: ${offCenter.length}件\n` +
      `    ${offCenter.join(" / ")}\n`
    );
  }
  return out;
}

/** 中央値がこれ以上ずれて実在の町字へ寄った場合に報告する。 */
const REPORT_OFF_CENTER_KM = 3;

/**
 * 代表点を選ぶ。**中央値そのものは使わず、中央値に最も近い実在の町字を採る（メドイド）。**
 *
 * 緯度と経度を独立に中央値化した点は、どの町字とも一致しない架空の位置になりうる。
 * 凹形・飛地・細長い形の自治体では、その点が**区域の外**に落ちる。全1,912件を
 * Nominatim の逆引きで検証して実際に5件見つかった（2026-08-18）:
 *
 *   北海道沙流郡日高町       中央値が平取町の中（52km四方に分断された飛地の隙間）
 *   山梨県南都留郡富士河口湖町 中央値が鳴沢村の中（鳴沢村を囲む凹形）
 *   岐阜県本巣市            中央値が大野町の中（南北37km×東西13kmの細長い形）
 *   愛知県愛西市            中央値が津島市の中（津島市を囲む形）
 *   東京都小笠原村          中央値が母島側（父島と母島に分かれる。別途 CODH で上書き）
 *
 * 実在の町字を採れば、区域の外に出ることは原理的に無くなる。
 */
function representativePoint(lats, lngs) {
  const centerLat = median(lats);
  const centerLng = median(lngs);
  let best = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < lats.length; i++) {
    const d = distanceKm(centerLat, centerLng, lats[i], lngs[i]);
    // 等距離のときは座標で決める（町字の並び順で代表点が変わらないようにする）
    if (d < bestDistance || (d === bestDistance && (lats[i] - lats[best] || lngs[i] - lngs[best]) < 0)) {
      bestDistance = d;
      best = i;
    }
  }
  return { lat: lats[best], lng: lngs[best], shifted: bestDistance };
}

// ── 2. 総務省コード表 ───────────────────────────────────
async function readSoumu() {
  const files = unzip(await load("soumu"));
  const cell = (r) => ({ code: r.A.slice(0, 5), pref: r.B, name: r.C, kana: toFullWidthKana(r.E || "") });
  const plain = readSheet(files, 1).filter((r) => r.C).map(cell);
  const sheet2 = readSheet(files, 2).filter((r) => r.C);
  // sheet2 は「政令市そのもの」と「その区」が混在する
  const cities = sheet2.filter((r) => !/.区$/.test(r.C)).map(cell);
  const wards = sheet2.filter((r) => /.区$/.test(r.C)).map(cell);
  const cityNames = new Set(cities.map((c) => c.name));
  // Geolonia と同じ粒度（政令市は区へ展開したもの）
  const municipalities = [...plain.filter((r) => !cityNames.has(r.name)), ...wards];
  reportDuplicateCodes(municipalities, "総務省 市区町村");
  reportDuplicateCodes(cities, "総務省 政令市");
  return { municipalities, designatedCities: cities };
}

/**
 * 同じ団体コードが2件以上ないか見る。
 * この後の突合はコードで Map を作るため、重複していると後勝ちで黙って上書きされる。
 */
function reportDuplicateCodes(rows, label) {
  const seen = new Map();
  for (const r of rows) {
    const first = seen.get(r.code);
    if (first) note(`${label} に同じコードが2件: ${r.code}「${first.pref}${first.name}」「${r.pref}${r.name}」`);
    else seen.set(r.code, r);
  }
}

// ── 3. 浜松市の区再編（2024-01-01、7区→3区） ────────────
/**
 * Geolonia・CODH とも 2023年時点のため旧7区のまま。総務省 R6.1.1 版の新3区へ寄せる。
 * 中央区 ← 中区・東区・西区・南区、浜名区 ← 北区・浜北区、天竜区は据え置き。
 * 実際には旧北区の三方原地区だけが中央区へ移っているが、代表点は区内の中央値なので影響しない。
 */
const HAMAMATSU_MERGES = [
  { code: "22138", name: "浜松市中央区", kana: "ハママツシチュウオウク", from: ["22131", "22132", "22133", "22134"] },
  { code: "22139", name: "浜松市浜名区", kana: "ハママツシハマナク", from: ["22135", "22136"] },
];
/** 天竜区は区域も名称も変わらないが、再編にあわせてコードだけ 22137 → 22140 へ振り直された。 */
const HAMAMATSU_RENUMBER = { "22137": "22140" };

function reorganizeHamamatsu(items) {
  const byCode = new Map(items.map((m) => [m.code, m]));
  const removed = new Set();
  for (const merge of HAMAMATSU_MERGES) {
    const sources = merge.from.map((c) => byCode.get(c)).filter(Boolean);
    if (sources.length !== merge.from.length) {
      note(`浜松市の再編: 統合元が揃わない ${merge.name}（期待 ${merge.from.join(",")}）`);
      continue;
    }
    items.push({
      code: merge.code,
      pref: "静岡県",
      county: "",
      name: merge.name,
      kana: merge.kana,
      lat: round5(median(sources.map((s) => s.lat))),
      lng: round5(median(sources.map((s) => s.lng))),
    });
    for (const c of merge.from) removed.add(c);
  }
  for (const m of items) {
    if (HAMAMATSU_RENUMBER[m.code]) m.code = HAMAMATSU_RENUMBER[m.code];
  }
  return items.filter((m) => !removed.has(m.code));
}

// ── 4. Geolonia の欠落を CODH の代表点で補う ────────────
/**
 * Geolonia は町字を集約して作るため、町字が1件も登録されていない自治体が落ちる
 * （2026-08-14 時点で 東京都利島村・熊本県湯前町 の2件。東京都が61件になるのはこれが原因）。
 * CODH は全自治体に代表点を持っているので、総務省にあってマスターに無いものをそこから補う。
 */
function fillGapsFromCodh(items, soumu, codh) {
  const have = new Set(items.map((m) => m.code));
  const codhCurrent = new Map(codh.filter((r) => !r.valid_to).map((r) => [r.code, r]));
  for (const s of soumu) {
    if (have.has(s.code) || KURIL.has(s.code)) continue;
    const source = codhCurrent.get(s.code);
    if (!source) { note(`Geolonia にも CODH にも無い: ${s.code} ${s.pref}${s.name}`); continue; }
    const gun = (source.address.split("/")[0].slice(s.pref.length)).match(/^(.+?郡)/);
    items.push({
      code: s.code,
      pref: s.pref,
      county: gun ? gun[1] : "",
      name: s.name,
      kana: s.kana,
      lat: round5(Number(source.latitude)),
      lng: round5(Number(source.longitude)),
    });
    process.stderr.write(`  Geolonia の欠落を CODH で補完: ${s.code} ${s.pref}${s.name}\n`);
  }
  return items;
}

// ── 5. 政令市そのものを引けるようにする ─────────────────
/**
 * Geolonia は政令市を区単位でしか持たないため「仙台市」が引けない。
 * 代表点は CODH（市役所の位置）を使う。区の代表点の中央値だと、区の面積差に引かれて
 * 市街地から外れる（浜松市で約11km北へずれた）。
 */
function addDesignatedCities(items, designated, codh) {
  const codhByCode = new Map(codh.filter((r) => !r.valid_to).map((r) => [r.code, r]));
  for (const city of designated) {
    const wards = items.filter((m) => m.pref === city.pref && m.name.startsWith(city.name) && m.name !== city.name);
    if (!wards.length) { note(`政令市の区が見つからない: ${city.pref}${city.name}`); continue; }
    const source = codhByCode.get(city.code);
    if (!source) { note(`政令市の代表点が CODH に無い: ${city.code} ${city.pref}${city.name}`); continue; }
    items.push({
      code: city.code,
      pref: city.pref,
      county: "",
      name: city.name,
      kana: commonPrefix(wards.map((w) => w.kana)) || city.kana,
      lat: round5(Number(source.latitude)),
      lng: round5(Number(source.longitude)),
    });
  }
  return items;
}

// ── 5-2. 代表点の個別補正 ───────────────────────────────
/**
 * 町字座標の中央値が実態から外れる自治体を、CODH の代表点（役場の位置）で上書きする。
 *
 * 緯度と経度を独立に中央値化する方式は、二峰分布（複数の島に分かれた自治体）では
 * どちらか一方へ寄る。小笠原村は父島・母島に分かれており中央値が母島側へ落ちるが、
 * 人口の中心は父島にある（約48km差）。
 *
 * 全体を役場基準に変えることはしない。離島では役場が区域外にあることがあり
 * （十島村の村役場は鹿児島市内で235kmずれる。docs/31 §2 の実測）、中央値のほうが安全。
 * ここは実害が確認できた自治体だけを名指しで直す。
 */
const REPRESENTATIVE_POINT_OVERRIDES = {
  "13421": "小笠原村。中央値は母島側だが人口の中心は父島（村役場）",
};

function applyRepresentativePointOverrides(items, codh) {
  const codhCurrent = new Map(codh.filter((r) => !r.valid_to).map((r) => [r.code, r]));
  for (const [code, reason] of Object.entries(REPRESENTATIVE_POINT_OVERRIDES)) {
    const target = items.find((m) => m.code === code);
    const source = codhCurrent.get(code);
    if (!target || !source) { note(`代表点を補正できない: ${code}（${reason}）`); continue; }
    const lat = round5(Number(source.latitude));
    const lng = round5(Number(source.longitude));
    const moved = distanceKm(target.lat, target.lng, lat, lng);
    process.stderr.write(
      `  代表点を補正: ${target.pref}${target.name} ${target.lat},${target.lng} → ${lat},${lng}（${moved.toFixed(1)}km / ${reason}）\n`
    );
    target.lat = lat;
    target.lng = lng;
  }
  return items;
}

// ── 6. 総務省との突合 ───────────────────────────────────
/** 北方領土の6村。総務省の表にはあるが出生地としては扱わない。 */
const KURIL = new Set(["01695", "01696", "01697", "01698", "01699", "01700"]);

/**
 * 総務省と突合し、差分を報告する。あわせて表示名を総務省の表記に揃える。
 *
 * Geolonia と総務省は「袖ヶ浦市／袖ケ浦市」「龍ヶ崎市／龍ケ崎市」「檮原町／梼原町」のように
 * 表記が食い違う。照合は placeKey が吸収するので実害は無いが、利用者に見せる名前は
 * 正式な表記（総務省）に従う。
 */
function crossCheck(items, soumu) {
  reportDuplicateCodes(items, "マスター");
  const ours = new Map(items.map((m) => [m.code, m]));
  const theirs = new Map(soumu.map((m) => [m.code, m]));
  const renamed = [];
  for (const [code, s] of theirs) {
    if (KURIL.has(code)) continue;
    const mine = ours.get(code);
    if (!mine) { note(`総務省にあってマスターに無い: ${code} ${s.pref}${s.name}`); continue; }
    // コードが合っていても都道府県が食い違うなら、集計のどこかで取り違えている
    if (mine.pref !== s.pref) {
      note(`都道府県が総務省と一致しない: ${code} 総務省「${s.pref}」/ マスター「${mine.pref}」`);
      continue;
    }
    const theirKey = placeKey(s.name);
    if (theirKey !== placeKey(mine.county + mine.name) && theirKey !== placeKey(mine.name)) {
      note(`名称が総務省と一致しない: ${code} 総務省「${s.pref}${s.name}」/ マスター「${mine.pref}${mine.county}${mine.name}」`);
      continue;
    }
    // 総務省は郡を名前に含めない（「当別町」）。郡はマスター側の値を残す
    const official = s.name.startsWith(mine.county) ? s.name.slice(mine.county.length) : s.name;
    if (official !== mine.name) {
      renamed.push(`${mine.name}→${official}`);
      mine.name = official;
    }
  }
  for (const [code, m] of ours) {
    if (!theirs.has(code)) note(`マスターにあって総務省に無い: ${code} ${m.pref}${m.county}${m.name}`);
  }
  if (renamed.length) {
    process.stderr.write(`  表示名を総務省の表記へ統一: ${renamed.length}件 ${renamed.join(" ")}\n`);
  }
}

// ── 7. CODH から廃止済み市区町村 ────────────────────────
/** これ以内なら同じ場所とみなす。村→町→市の昇格は代表点が動かないため。 */
const SAME_PLACE_KM = 1;

/**
 * 代表点が SAME_PLACE_KM 以内で connect している点どうしを、同じ場所としてまとめる。
 *
 * 総当たりで結び、連結成分を取る（union-find 相当）。逐次に「各クラスタの先頭とだけ
 * 比べて入れる」方式だと、A-B と B-C が近く A-C が遠いときに**入力順で結果が変わり**、
 * CSV の並びが変わるだけで生成物が変わってしまう。ここは順序に依存させない。
 *
 * 1グループの件数は多くて数件なので総当たりで十分。
 */
function clusterByProximity(entries) {
  const parent = entries.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i];
      const b = entries[j];
      if (distanceKm(a.lat, a.lng, b.lat, b.lng) > SAME_PLACE_KM) continue;
      const [ra, rb] = [find(i), find(j)];
      // 常に小さい添字へ寄せる。どちらへ寄せるかで結果が変わらないようにする
      if (ra !== rb) parent[Math.max(ra, rb)] = Math.min(ra, rb);
    }
  }
  const byRoot = new Map();
  entries.forEach((e, i) => {
    const root = find(i);
    if (!byRoot.has(root)) byRoot.set(root, []);
    byRoot.get(root).push(e);
  });
  // 添字順に返す（クラスタの並びも入力順に依存させない）
  return [...byRoot.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v);
}

/**
 * valid_to が入っているものを廃止済みとして採る。1920年より前に廃止された区域は
 * フォームの生年（1920年以降）では選びようがないので落とす。
 *
 * CODH は2023年10月時点のため、その後に廃止されたもの（浜松市の旧区）は valid_to が空のまま。
 * 現行マスターに無い「現存扱い」のエントリは廃止済みとして拾う。
 *
 * 同じ名前が別の時代に別の区域で使われていることがある。実データでは
 * 茨城県新治郡新治村の1件だけで、1889〜1954年（現かすみがうら市側）と
 * 1955〜2006年（現土浦市側）が 7.4km 離れている。廃止年の新しい方だけを残すと、
 * 1954年以前生まれの入力が黙って別の場所へ解決されるため、**代表点が離れている
 * ときだけ期間ごとに分けて持つ**。同じ場所の村→町→市の昇格は1件にまとめる。
 */
function buildHistorical(current, rows) {
  const currentCodes = new Set(current.map((m) => m.code));
  const currentKeys = new Set(current.map((m) => placeKey(m.pref + m.county + m.name)));
  const groups = new Map();
  const stale = [];
  for (const r of rows) {
    // 島庁・入会地・区界未確定などは出生地として名乗られる単位ではない
    if (r.ne_class !== "市区町村" && r.ne_class !== "市区町村/政令指定都市") continue;
    if (KURIL.has(r.code)) continue;
    // 「/」区切りは併記（例「東京都/東京府」）。先頭を採る
    const first = (s) => (s || "").split("/")[0];
    const pref = first(r.prefname);
    const county = first(r.countyname);
    const name = first(r.body) + first(r.suffix);
    const key = placeKey(pref + county + name);
    let year = Number(r.valid_to.slice(0, 4));
    if (!r.valid_to) {
      // CODH（2023年10月時点）では現存扱いだが現行マスターに無い ＝ その後の廃止、
      // または CODH 側の記録漏れ。いずれも廃止年が分からないので 0（不明）で持つ。
      if (currentCodes.has(r.code) || currentKeys.has(key)) continue;
      year = 0;
      stale.push(`${pref}${county}${name}`);
    } else if (year < 1920) continue; // フォームの生年（1920年〜）では選びようがない
    const lat = Number(r.latitude);
    const lng = Number(r.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) { note(`CODH に座標が無い: ${r.entry_id} ${pref}${county}${name}`); continue; }
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({
      pref, county, name, year,
      from: Number(r.valid_from.slice(0, 4)) || 0,
      lat: round5(lat), lng: round5(lng),
    });
  }
  process.stderr.write(`  CODH で現存扱いだが現行マスターに無い（廃止として採用）: ${stale.length}件 ${stale.join(" ")}\n`);

  // 同じ名前のものを、代表点の近さで場所ごとにまとめる
  const out = [];
  const split = [];
  for (const entries of groups.values()) {
    const clusters = clusterByProximity(entries);
    for (const cluster of clusters) {
      // 同じ場所の村→町→市は1件にまとめ、廃止年が最も新しいものを代表にする。
      // 廃止年が並んだときは座標で決める（入力順で代表が変わらないようにする）
      const latest = [...cluster].sort(
        (a, b) => b.year - a.year || b.lat - a.lat || b.lng - a.lng
      )[0];
      out.push({
        ...latest,
        // 期間で見分ける必要があるとき（同名で場所が違うとき）だけ設立年を持たせる。
        // 全件に持たせるとファイルが太るうえ、見分けに使わない値になる
        from: clusters.length > 1 ? Math.min(...cluster.map((e) => e.from)) : 0,
      });
    }
    if (clusters.length > 1) {
      const label = entries[0].pref + entries[0].county + entries[0].name;
      const spans = clusters.map((c) => `${Math.min(...c.map((e) => e.from))}〜${Math.max(...c.map((e) => e.year))}`);
      split.push(`${label}（${spans.join(" / ")}）`);
    }
  }
  if (split.length) {
    // 誤りではなく、利用者に選ばせるべき状態。ビルドは失敗させない
    process.stderr.write(`  同名で場所が違うため期間別に分けた: ${split.length}件 ${split.join(" ")}\n`);
  }
  return out;
}

// ── 8. 同名衝突（照合キーが重なるもの）を数える ─────────
function collisions(items, keyOf) {
  const index = new Map();
  for (const m of items) {
    const key = keyOf(m);
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(m);
  }
  return [...index.entries()].filter(([, v]) => v.length > 1);
}

// ── main ────────────────────────────────────────────────
const soumu = await readSoumu();
process.stderr.write(`総務省: 市区町村 ${soumu.municipalities.length}件 / 政令市 ${soumu.designatedCities.length}件\n`);

const codh = parseCsv((await load("codh")).toString("utf8"));
process.stderr.write(`CODH: ${codh.length}件\n`);

let current = await buildFromGeolonia();
process.stderr.write(`Geolonia 集約: ${current.length}件\n`);

current = reorganizeHamamatsu(current);
current = fillGapsFromCodh(current, soumu.municipalities, codh);
current = addDesignatedCities(current, soumu.designatedCities, codh);
current = applyRepresentativePointOverrides(current, codh);
current.sort((a, b) => a.code.localeCompare(b.code));
process.stderr.write(`補正後: ${current.length}件（東京都 ${current.filter((m) => m.pref === "東京都").length}件）\n`);

crossCheck(current, [...soumu.municipalities, ...soumu.designatedCities]);

const historical = buildHistorical(current, codh);
// 同名で場所の違うもの（新治村）は名前だけでは並びが決まらないので、廃止年・座標まで見て
// 完全に決まるようにする。並びが実行ごとに変わると差分が読めなくなる
historical.sort((a, b) =>
  (a.pref + a.county + a.name).localeCompare(b.pref + b.county + b.name, "ja") ||
  a.year - b.year || a.lat - b.lat || a.lng - b.lng
);
process.stderr.write(`廃止済み: ${historical.length}件\n`);

// 衝突の報告（実装が使う索引は実行時に作るので、ここでは規模の確認のみ）
const bare = collisions(current, (m) => placeKey(m.name));
process.stderr.write(`都道府県を省いたときに衝突する名称: ${bare.length}種\n`);
for (const [key, group] of bare.sort((a, b) => b[1].length - a[1].length).slice(0, 12)) {
  process.stderr.write(`    ${key} ×${group.length}: ${group.map((m) => m.pref + m.county + m.name).join(" / ")}\n`);
}
const full = collisions(current, (m) => placeKey(m.pref + m.county + m.name));
if (full.length) note(`都道府県まで含めても一意にならない: ${full.map(([k]) => k).join(", ")}`);

// 正規化（placeKey）が別々の自治体を同じキーへ寄せている組。実行時は候補提示になるので
// 誤答にはならないが、異体字の吸収しすぎに気づけるよう一覧で出す。ビルドは失敗させない。
const merged = bare.filter(([, group]) => new Set(group.map((m) => m.name)).size > 1);
if (merged.length) {
  process.stderr.write(`  正規化で同じキーになった別名の組: ${merged.length}件\n`);
  for (const [key, group] of merged) {
    process.stderr.write(`    ${key} ← ${group.map((m) => m.pref + m.county + m.name).join(" / ")}\n`);
  }
}

// ── 書き出し ────────────────────────────────────────────
/**
 * 生成日ではなく入力データの版を記録する。
 *
 * 生成日を入れると、元データが1バイトも変わっていなくても実行するたびに差分が出て、
 * 「データが変わったのか日付が変わっただけなのか」がレビューで区別できなくなる。
 * 知りたいのは「いつ実行したか」ではなく「どの版から作ったか」なので、そちらを記録する。
 */
const sourceVersions = Object.fromEntries(
  Object.entries(SOURCES).map(([key, { file, version }]) => [key, {
    file,
    ...(version ? { version } : {}),
    sha256: createHash("sha256").update(readFileSync(join(CACHE, file))).digest("hex"),
  }])
);

const write = (path, contents) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
  process.stderr.write(
    `  ${path.replace(ROOT + "/", "")}  ${(contents.length / 1024).toFixed(1)}KB` +
    ` (gzip ${(gzipSync(contents).length / 1024).toFixed(1)}KB)\n`
  );
};

write(join(ROOT, "src/data/municipalities.ts"), `\
/**
 * 現行の市区町村と代表点。**自動生成物なので手で編集しない。**
 * 更新: node scripts/build-municipalities.mjs
 *
 * 出典: 『Geolonia 住所データ』（株式会社Geolonia、CC BY 4.0）を市区町村へ集約し、
 *       町字座標の中央値を代表点としたもの。総務省「全国地方公共団体コード」R6.1.1 と突合済み。
 *       Geolonia に町字が無い自治体と政令指定都市そのものの代表点は
 *       『Geoshape市区町村IDデータセット』（CODH作成、CC BY 4.0）で補っている。
 *
 * 件数: ${current.length}件
 * 入力（生成日ではなく、どの版から作ったかを記録している）:
${Object.entries(sourceVersions)
  .map(([key, v]) => ` *   ${key} ${v.file}${v.version ? ` (${v.version})` : ""}\n *     sha256: ${v.sha256}`)
  .join("\n")}
 */

export type MunicipalityRow = [
  code: string,
  pref: string,
  /** 郡（郡部のみ。市部・特別区は空文字）。 */
  county: string,
  name: string,
  kana: string,
  lat: number,
  lng: number,
];

export const MUNICIPALITIES: MunicipalityRow[] = [
${current.map((m) => `  ${JSON.stringify([m.code, m.pref, m.county, m.name, m.kana, m.lat, m.lng])},`).join("\n")}
];
`);

write(join(ROOT, "public/data/municipalities-historical.json"), JSON.stringify({
  source: "歴史的行政区域データセットβ版『Geoshape市区町村IDデータセット』（CODH作成、CC BY 4.0）",
  sourceVersions,
  // abolished は廃止年。0 は「廃止済みだが年が分からない」（CODH の記録漏れ・2023年10月以降の廃止）
  // established は設立年。0 以外が入るのは、同名で場所の違うものを期間で見分ける必要がある場合だけ
  columns: ["pref", "county", "name", "abolished", "lat", "lng", "established"],
  items: historical.map((h) => [h.pref, h.county, h.name, h.year, h.lat, h.lng, h.from]),
}) + "\n");

if (problems.length) {
  process.stderr.write(`\n⚠ 要確認 ${problems.length}件\n`);
  for (const p of problems) process.stderr.write(`  - ${p}\n`);
  process.exitCode = 1;
} else {
  process.stderr.write("\n突合に差分なし\n");
}
