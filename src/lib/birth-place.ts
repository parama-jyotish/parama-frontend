/**
 * 出生地入力を `/api/start` の `birth_place` へ渡す形に解決する。
 *
 * バックエンドは出生地を文字列でしか受け取らず（StartRequest に緯度経度フィールドがない）、
 * Nominatim でジオコーディングする。2026-08-13 の実測で分かった Nominatim の性質:
 *   - 「35.68,139.76」のような座標文字列は逆引きとして解決する（誤差 約30m）
 *   - 丁目・番地を含む住所は解決できない（「東京都世田谷区北沢2-24-8」等は全滅）
 *   - 都道府県＋市区町村までなら解決するが、**誤った場所を黙って返すことがある**
 *     （「北区」→ 大阪市北区、「東京都保谷市」→ 京都市左京区の東大路通）
 *
 * そこで地名から座標への解決はフロント側の市区町村マスターで行い、確定した座標を
 * 「緯度,経度」の文字列で送る。Nominatim には座標の逆引きしかさせない＝誤った場所を
 * 返す余地が無くなる。マスターに無い海外の地名などは従来どおり文字列で送る。
 *
 * 座標記法の許容範囲・丸め桁は jyoti-app/test_reading.py の `_parse_place` に合わせている。
 * `cities.ts` の `findCity()` は使わない（解決できない入力を黙って東京へ落とすため）。
 */

// Node から直接テストを走らせるため、パスエイリアスではなく相対で参照する
import { MUNICIPALITIES } from "../data/municipalities.ts";
import { placeKey } from "./place-key.ts";

export interface Municipality {
  pref: string;
  /** 郡（郡部のみ）。政令市の区では市名が入る。 */
  county: string;
  name: string;
  lat: number;
  lng: number;
  /** 廃止年。現存する市区町村では undefined、廃止済みだが年が不明な場合は 0。 */
  abolished?: number;
}

export type BirthPlaceResolution =
  /** 座標が確定した。value を送信し、label を利用者に見せる。 */
  | { kind: "coords"; value: string; label: string; municipality?: Municipality }
  /** 同名の市区町村が複数ある。利用者に選ばせる。 */
  | { kind: "ambiguous"; candidates: Municipality[] }
  /** マスターに無い（海外の地名など）。従来どおり文字列で送り、解決はバックエンドに委ねる。 */
  | { kind: "fallback"; value: string }
  /** 日本の住所として書かれているのにマスターで解決できない。送信せずにエラーにする。 */
  | { kind: "unknown"; reason: "not-found" | "lookup-failed" };

// ── 入力の下ごしらえ ────────────────────────────────────

/** 全角の数字・区切り記号を半角へ寄せる（cities.ts の findCity と同じ範囲）。 */
function toHalfWidth(input: string): string {
  return input
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[、，]/g, ",")
    .replace(/．/g, ".")
    .replace(/[－−]/g, "-")
    .replace(/　/g, " ");
}

/** 都道府県。北海道・東京都・京都府/大阪府・○○県（2〜3文字）。 */
const PREFECTURE = "(?:北海道|東京都|(?:京都|大阪)府|[^\\s]{2,3}県)";

/**
 * 市区町村。政令指定都市は「○○市○○区」まで残す。
 * 郡部は「○○郡○○町/村」を1単位として扱う。
 */
const MUNICIPALITY =
  "(?:[^\\s]{1,8}?郡[^\\s]{1,8}?[町村]|[^\\s]{1,8}?市(?:[^\\s]{1,6}?区)?|[^\\s]{1,8}?[区町村])";

const ADDRESS_PATTERN = new RegExp(`^\\s*(${PREFECTURE})?\\s*(${MUNICIPALITY})`);

/** 座標を小数5桁で丸める（浮動小数点誤差を避けるため toFixed 経由）。 */
function round5(value: number): number {
  return parseFloat(value.toFixed(5));
}

const DIRECTION_SIGN: Record<string, number> = { N: 1, S: -1, E: 1, W: -1 };

/**
 * 座標の片側（緯度または経度）をパースする。
 * 方角記号は前後どちらでも受け、S・W は符号を反転させる（南半球・西半球）。
 * 記号を単に除去すると南緯が北緯に化けるため、必ず符号へ変換すること。
 */
function parseCoordPart(part: string): number | null {
  const m = part.match(/^([NnSsEeWw])?\s*(-?\d+(?:\.\d+)?)\s*°?\s*([NnSsEeWw])?$/);
  if (!m) return null;
  const value = Number(m[2]);
  if (!Number.isFinite(value)) return null;
  const direction = (m[1] ?? m[3] ?? "").toUpperCase();
  if (!direction) return value;
  // 「S-33.8」のように符号と方角が二重に付いた入力は解釈が定まらないので受け付けない。
  if (value < 0) return null;
  return DIRECTION_SIGN[direction] * value;
}

/** 郵便番号を落とし、全角を寄せ、前後の空白を削る。 */
function prepare(raw: string): string {
  return toHalfWidth(raw)
    // 先頭の郵便番号（〒130-0011 / 1300011 など）を落とす。住所の照合を妨げるだけで情報を持たない。
    .replace(/^\s*〒?\s*\d{3}-?\d{4}\s*/, "")
    .trim();
}

/** 座標として読めるなら「緯度,経度」を返す。 */
function parseCoordinates(normalized: string): string | null {
  const parts = normalized.split(/[,\s]+/).filter(Boolean);
  if (parts.length !== 2) return null;
  const lat = parseCoordPart(parts[0]);
  const lng = parseCoordPart(parts[1]);
  if (lat === null || lng === null) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return `${round5(lat)},${round5(lng)}`;
}

/**
 * 入力文字列を送信用に正規化する（マスターで解決できなかったときの経路）。
 *
 * - 座標（例: `35.68, 139.76` / `N35.68 E139.76` / 全角）→ `"35.68,139.76"`
 * - 日本の住所（例: `宮城県仙台市青葉区中央1丁目1-1`）→ `"宮城県仙台市青葉区"`
 * - どちらにも当たらない入力（`仙台` / `Paris` など）→ 前後の空白を落としてそのまま
 *
 * 解決できない入力を既定の地点へ置き換えることはしない。
 */
export function normalizeBirthPlace(raw: string): string {
  const normalized = prepare(raw);
  if (!normalized) return "";

  const coords = parseCoordinates(normalized);
  if (coords) return coords;

  // ── 日本の住所 ── 都道府県＋市区町村まで残し、町名・丁目・番地は落とす。
  const match = normalized.match(ADDRESS_PATTERN);
  if (match) return `${match[1] ?? ""}${match[2]}`;

  return normalized;
}

// ── 市区町村マスターの索引 ──────────────────────────────

type MunicipalityIndex = Map<string, Municipality[]>;

/** 索引に載せるキーの最大長。これを超える長さの前方一致は試さない。 */
const MAX_KEY_LENGTH = 16;

function addKey(index: MunicipalityIndex, key: string, m: Municipality): void {
  // 1文字のキーは地名として意味を成さず、誤爆のもとになる
  if (key.length < 2) return;
  const bucket = index.get(key);
  if (!bucket) index.set(key, [m]);
  else if (!bucket.includes(m)) bucket.push(m);
}

/** 「大阪市北区」から「北区」を取り出す。特別区のように市名が付かない場合は null。 */
function bareWard(name: string): string | null {
  const m = name.match(/^.+市(.+区)$/);
  return m ? m[1] : null;
}

/**
 * 見出し語から索引を作る。
 *
 * 利用者は都道府県・郡を省いたり、逆に全部書いたりする。カナで書くこともある。
 * 想定される書き方をすべてキーとして張り、同じキーに複数当たるものは「候補」として扱う。
 * 「北区」のように市名を省いた区名も張るので、東京都北区と大阪市北区は候補提示になる
 * （どちらか一方へ黙って寄せない、というのがこの実装の眼目）。
 */
function buildIndex(items: Municipality[], kanaOf?: (m: Municipality) => string): MunicipalityIndex {
  const index: MunicipalityIndex = new Map();
  for (const m of items) {
    addKey(index, placeKey(m.pref + m.county + m.name), m);
    addKey(index, placeKey(m.pref + m.name), m);
    addKey(index, placeKey(m.county + m.name), m);
    addKey(index, placeKey(m.name), m);
    const ward = bareWard(m.name);
    if (ward) addKey(index, placeKey(ward), m);

    const kana = kanaOf?.(m);
    if (kana) {
      addKey(index, placeKey(kana), m);
      // 郡部のカナは「ミヤギグンマツシママチ」のように郡を含む。郡を省いた形でも引けるようにする
      if (m.county) addKey(index, placeKey(kana.replace(/^.*?グン/, "")), m);
    }
  }
  return index;
}

/**
 * 入力の先頭から、索引に載っている最も長い地名を探す。
 * 一致した長さも返す（現行マスターより具体的な廃止地名が無いかを判断するのに使う）。
 */
function lookup(index: MunicipalityIndex, key: string): { matches: Municipality[]; length: number } {
  for (let length = Math.min(key.length, MAX_KEY_LENGTH); length >= 2; length--) {
    const hit = index.get(key.slice(0, length));
    if (hit) return { matches: hit, length };
  }
  return { matches: [], length: 0 };
}

// ── 現行の市区町村（バンドルに同梱） ────────────────────

const CURRENT_KANA = new Map<Municipality, string>();

const currentItems: Municipality[] = MUNICIPALITIES.map(([, pref, county, name, kana, lat, lng]) => {
  const m: Municipality = { pref, county, name, lat, lng };
  CURRENT_KANA.set(m, kana);
  return m;
});

let currentIndex: MunicipalityIndex | null = null;

function getCurrentIndex(): MunicipalityIndex {
  currentIndex ??= buildIndex(currentItems, (m) => CURRENT_KANA.get(m) ?? "");
  return currentIndex;
}

// ── 廃止された市区町村（照合が外れたときだけ取得） ──────

/**
 * 保谷市・浦和市のような旧市町村名。現行マスターの10倍近くあり LP の初回表示に載せたくないので、
 * 現行マスターで解決できなかったときにだけ取りに行く。
 */
const HISTORICAL_URL = "/data/municipalities-historical.json";

let historicalIndex: Promise<MunicipalityIndex> | null = null;

function getHistoricalIndex(): Promise<MunicipalityIndex> {
  historicalIndex ??= fetch(HISTORICAL_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`historical master: HTTP ${res.status}`);
      return res.json();
    })
    .then((data: { items: [string, string, string, number, number, number][] }) =>
      buildIndex(data.items.map(([pref, county, name, abolished, lat, lng]) => ({
        pref, county, name, lat, lng, abolished,
      })))
    )
    .catch((err) => {
      historicalIndex = null; // 次の入力で取り直せるようにする
      throw err;
    });
  return historicalIndex;
}

// ── 解決 ────────────────────────────────────────────────

/** 市区町村の表示名。廃止済みなら廃止年を添える。 */
export function municipalityLabel(m: Municipality): string {
  const name = `${m.pref}${m.county}${m.name}`;
  if (m.abolished === undefined) return name;
  return m.abolished ? `${name}（${m.abolished}年まで）` : `${name}（現在は廃止）`;
}

/** 市区町村を送信値（緯度,経度）にする。 */
export function municipalityValue(m: Municipality): string {
  return `${m.lat},${m.lng}`;
}

/**
 * 日本の住所として書かれているか。
 *
 * 都道府県が付いているか、市区町村を表す語が漢字・ひらがなを伴って現れるものを日本の住所とみなす。
 * カタカナだけの「ニューヨーク市」を日本の住所と誤認して弾かないための条件。
 */
function looksJapaneseAddress(normalized: string): boolean {
  const match = normalized.match(ADDRESS_PATTERN);
  if (!match) return false;
  // 市区町村を表す文字自体が漢字なので、それを除いた残りで判定する
  return Boolean(match[1]) || /[一-龥ぁ-ん]/.test(match[2].replace(/[市区町村郡]/g, ""));
}

function fromMatches(matches: Municipality[]): BirthPlaceResolution | null {
  if (matches.length === 0) return null;
  if (matches.length > 1) return { kind: "ambiguous", candidates: matches };
  return {
    kind: "coords",
    value: municipalityValue(matches[0]),
    label: municipalityLabel(matches[0]),
    municipality: matches[0],
  };
}

/**
 * 出生地入力を解決する。
 *
 * 現行の市区町村マスター → （日本の住所らしければ）廃止された市区町村 の順に照合する。
 * どちらにも無く、かつ日本の住所として書かれている場合は送信せずにエラーとする。
 * 「東京都保谷市」を素通しすると Nominatim が京都の東大路通を返し、誤りに気づけないため。
 */
export async function resolveBirthPlace(raw: string): Promise<BirthPlaceResolution> {
  const normalized = prepare(raw);
  if (!normalized) return { kind: "fallback", value: "" };

  const coords = parseCoordinates(normalized);
  if (coords) return { kind: "coords", value: coords, label: coords };

  const key = placeKey(normalized);
  const current = lookup(getCurrentIndex(), key);

  // 入力が現行マスターで当たった地名より具体的な場合は、廃止された地名も見る。
  // 「静岡県浜松市浜北区」は現行マスターだと「静岡県浜松市」で止まってしまい、
  // 旧浜北区の代表点（市役所から約11km）へ行き着けないため。
  const addressMatch = normalized.match(ADDRESS_PATTERN);
  const addressLength = addressMatch ? placeKey(`${addressMatch[1] ?? ""}${addressMatch[2]}`).length : 0;
  const needsHistorical = current.matches.length === 0 || addressLength > current.length;

  if (!needsHistorical) return fromMatches(current.matches)!;

  if (!looksJapaneseAddress(normalized)) {
    return fromMatches(current.matches) ?? { kind: "fallback", value: normalizeBirthPlace(raw) };
  }

  let historical;
  try {
    historical = lookup(await getHistoricalIndex(), key);
  } catch {
    return fromMatches(current.matches) ?? { kind: "unknown", reason: "lookup-failed" };
  }
  // 同じ長さで当たったときは現行を優先する（「さいたま市大宮区」と旧「大宮市」など）
  const best = historical.length > current.length ? historical.matches : current.matches;
  return fromMatches(best) ?? { kind: "unknown", reason: "not-found" };
}
