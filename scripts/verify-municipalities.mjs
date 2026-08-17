/**
 * 市区町村マスターの代表点が、実際にその市区町村の中にあるかを外部ソースで検証する。
 *
 *   node scripts/verify-municipalities.mjs           代表サンプル（約60件・約1分半）
 *   node scripts/verify-municipalities.mjs --all     全件（約40分）
 *   node scripts/verify-municipalities.mjs --codes 13421,01695
 *
 * **なぜ必要か**
 * マスターの座標は Geolonia の町字座標の中央値（＋一部は CODH の代表点）から機械的に作る。
 * 集約の取り違え・緯度経度の入れ違い・二峰分布（複数の島に分かれた自治体で中央値が
 * 実在しない位置に落ちる）を、生成物だけを見て検出することはできない。
 *
 * `npm test` の全件整合テストはこれを担えない。あれは MUNICIPALITIES を回して
 * MUNICIPALITIES と突き合わせる自己参照であり、索引・正規化・衝突の検証にはなるが、
 * 座標が地理的に正しいかは見ていない。**独立したソースと突き合わせるのはこのスクリプト。**
 *
 * `verify-birth-place.mjs` とは目的が違う。あちらは実行経路（辞書外の地名が Nominatim で
 * 解決するか）、こちらはデータ品質（座標がその自治体内にあるか）。
 *
 * 判定は2段:
 *   1. 都道府県 — 団体コードの先頭2桁と、逆引きが返す ISO3166-2-lvl4（JP-13 等）の一致。
 *      地名の表記ゆれに左右されないので、こちらを主に使う。
 *   2. 市区町村 — 名前の構成要素が逆引き結果に現れるか（政令市の区は「市」と「区」に分解）。
 *
 * Nominatim の利用ポリシーに従い、1リクエストあたり1.2秒の間隔を空け、
 * 連絡先を含む User-Agent を送る。
 */

import { MUNICIPALITIES } from "../src/data/municipalities.ts";
import { placeKey } from "../src/lib/place-key.ts";

const UA = "PARAMA-municipality-verification/1.0 (info@parama-jyotish.jp)";
const INTERVAL_MS = 1200;
/** 区まで解決し、町字まで細かくなりすぎない粒度。 */
const ZOOM = 12;

/**
 * 既定サンプルに必ず含める自治体。代表点の作り方が特殊なもの・地理的に代表点が
 * 定めにくいものを優先する。
 *
 * コードと名前を対で持つのは、コードの取り違えを検出するため。名前だけで引くと
 * 同名自治体（府中市・伊達市など）で誤り、コードだけだと取り違えに気づけない。
 */
const ALWAYS_CHECK = [
  // 東京都の島嶼部（今回の検証テーマ）
  ["13361", "大島町"], ["13362", "利島村"], ["13363", "新島村"], ["13364", "神津島村"],
  ["13381", "三宅村"], ["13382", "御蔵島村"], ["13401", "八丈町"], ["13402", "青ヶ島村"],
  ["13421", "小笠原村"], // 代表点を個別補正したもの（中央値は母島側に落ちる）
  // 離島・広域で代表点が定めにくい自治体
  ["46304", "十島村"],       // 村役場が区域外（鹿児島市内）にあり CODH 代表点は使えない
  ["46303", "三島村"],       // 同上
  ["47381", "竹富町"],       // 多島
  ["47382", "与那国町"],     // 最西端
  ["42209", "対馬市"],
  ["32528", "隠岐の島町"],
  ["15224", "佐渡市"],
  ["01367", "奥尻町"],
  ["01214", "稚内市"],       // 最北端
  // Geolonia に町字が無く CODH の代表点で補ったもの
  ["43506", "湯前町"],
  // 政令市そのもの（区ではなく市の代表点）
  ["01100", "札幌市"], ["04100", "仙台市"], ["22130", "浜松市"], ["27100", "大阪市"], ["40130", "福岡市"],
  // 政令市の区・特別区
  ["01101", "札幌市中央区"], ["13117", "北区"], ["27127", "大阪市北区"], ["14103", "横浜市西区"],
  // 2024年の再編で新設・改番された区
  ["22138", "浜松市中央区"], ["22139", "浜松市浜名区"], ["22140", "浜松市天竜区"],
  // 郡部
  ["04401", "松島町"], ["13308", "奥多摩町"],
];

// ── 引数 ────────────────────────────────────────────────
const args = process.argv.slice(2);
const codesArg = args.includes("--codes") ? args[args.indexOf("--codes") + 1] : null;

function selectTargets() {
  const byCode = new Map(MUNICIPALITIES.map((m) => [m[0], m]));
  if (codesArg) {
    return codesArg.split(",").map((c) => byCode.get(c.trim())).filter(Boolean);
  }
  if (args.includes("--all")) return MUNICIPALITIES;

  const picked = new Map();
  const listErrors = [];
  for (const [code, expected] of ALWAYS_CHECK) {
    const m = byCode.get(code);
    if (!m) {
      listErrors.push(`${code}（${expected}）がマスターに無い。合併等で消えたか、コードの誤り`);
    } else if (m[3] !== expected) {
      listErrors.push(`${code} は「${expected}」のつもりだが実際は「${m[1]}${m[2]}${m[3]}」。コードの誤り`);
    } else {
      picked.set(code, m);
    }
  }
  // 取り違えを黙って通すと、検証したつもりの自治体が検証されない
  if (listErrors.length) {
    console.error(`⚠ 既定サンプルの指定に誤りがあります（${listErrors.length}件）`);
    for (const e of listErrors) console.error(`  - ${e}`);
    console.error("");
    process.exitCode = 1;
  }
  // 特定の傾向に偏らないよう、全体からも等間隔で拾う
  const step = Math.floor(MUNICIPALITIES.length / 30);
  for (let i = 0; i < MUNICIPALITIES.length; i += step) picked.set(MUNICIPALITIES[i][0], MUNICIPALITIES[i]);
  return [...picked.values()];
}

// ── 判定 ────────────────────────────────────────────────
/** 「札幌市中央区」を ["札幌市","中央区"] に分ける。特別区や町村はそのまま1つ。 */
function nameParts(name) {
  const ward = name.match(/^(.+市)(.+区)$/);
  return ward ? [ward[1], ward[2]] : [name];
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function reverse(lat, lng) {
  const url =
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}` +
    `&format=jsonv2&zoom=${ZOOM}&addressdetails=1&accept-language=ja`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return { error: `HTTP ${res.status}` };
  const body = await res.json();
  if (!body || body.error || !body.address) return { error: "逆引きできない（海上の可能性）" };
  return { address: body.address, display: body.display_name ?? "" };
}

function judge(m, address) {
  const [code, pref, , name] = m;
  const problems = [];

  // 1. 都道府県（ISO コードで見る。無ければ名前で見る）
  const iso = address["ISO3166-2-lvl4"];
  if (iso) {
    const expected = `JP-${code.slice(0, 2)}`;
    if (iso !== expected) problems.push(`都道府県が違う（期待 ${expected}=${pref} / 実際 ${iso}）`);
  } else {
    const values = Object.values(address).join(" ");
    if (!values.includes(pref)) problems.push(`都道府県 ${pref} が逆引き結果に無い`);
  }

  // 2. 市区町村名の構成要素
  const haystack = placeKey(Object.values(address).join(" "));
  const missing = nameParts(name).filter((part) => !haystack.includes(placeKey(part)));
  if (missing.length) problems.push(`${missing.join("・")} が逆引き結果に無い`);

  return problems;
}

// ── 実行 ────────────────────────────────────────────────
const targets = selectTargets();
const mode = codesArg ? "指定コード" : args.includes("--all") ? "全件" : "代表サンプル";
console.error(
  `${mode} ${targets.length}件を検証します（約${Math.ceil((targets.length * INTERVAL_MS) / 60000)}分）\n`
);

const failures = [];
let checked = 0;

for (const m of targets) {
  const [code, pref, county, name, , lat, lng] = m;
  const full = `${pref}${county}${name}`;
  await sleep(INTERVAL_MS);
  const got = await reverse(lat, lng);

  if (got.error) {
    failures.push(`${code} ${full}（${lat},${lng}）: ${got.error}`);
    console.log(`✖ ${full.padEnd(20)} ${got.error}`);
    continue;
  }
  const problems = judge(m, got.address);
  if (problems.length) {
    failures.push(`${code} ${full}（${lat},${lng}）: ${problems.join(" / ")} → ${got.display}`);
    console.log(`✖ ${full.padEnd(20)} ${problems.join(" / ")}`);
    console.log(`    逆引き: ${got.display}`);
  } else {
    checked++;
    console.log(`✔ ${full.padEnd(20)} ${Object.values(got.address).slice(0, 3).join(" / ")}`);
  }
}

console.log(`\n${checked}/${targets.length} 合格`);
for (const f of failures) console.log(`  - ${f}`);
process.exitCode = failures.length ? 1 : 0;
