/**
 * 出生地入力を `/api/start` の `birth_place` へ渡す形に正規化する。
 *
 * バックエンドは出生地を文字列でしか受け取らず（StartRequest に緯度経度フィールドがない）、
 * Nominatim でジオコーディングする。2026-08-13 の実測で分かった Nominatim の性質:
 *   - 「35.68,139.76」のような座標文字列は逆引きとして解決する（誤差 約30m）
 *   - 丁目・番地を含む住所は解決できない（「東京都世田谷区北沢2-24-8」等は全滅）
 *   - 都道府県＋市区町村までなら解決する（郡＋町も可）
 * そこで、座標は正規化した座標文字列に、住所は市区町村までに縮約して送る。
 *
 * 座標記法の許容範囲・丸め桁は jyoti-app/test_reading.py の `_parse_place` に合わせている。
 * `cities.ts` の `findCity()` は使わない（解決できない入力を黙って東京へ落とすため）。
 */

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

/**
 * 入力文字列を送信用に正規化する。
 *
 * - 座標（例: `35.68, 139.76` / `N35.68 E139.76` / 全角）→ `"35.68,139.76"`
 * - 日本の住所（例: `宮城県仙台市青葉区中央1丁目1-1`）→ `"宮城県仙台市青葉区"`
 * - どちらにも当たらない入力（`仙台` / `Paris` など）→ 前後の空白を落としてそのまま
 *
 * 解決できない入力を既定の地点へ置き換えることはしない。地名として不正なら
 * バックエンドが 400 を返すので、それを利用者に提示する。
 */
export function normalizeBirthPlace(raw: string): string {
  const normalized = toHalfWidth(raw)
    // 先頭の郵便番号（〒130-0011 / 1300011 など）を落とす。住所の照合を妨げるだけで情報を持たない。
    .replace(/^\s*〒?\s*\d{3}-?\d{4}\s*/, "")
    .trim();
  if (!normalized) return "";

  // ── 座標入力 ── カンマまたは空白で2つに割れ、両方が座標として読めるか。
  const parts = normalized.split(/[,\s]+/).filter(Boolean);
  if (parts.length === 2) {
    const lat = parseCoordPart(parts[0]);
    const lng = parseCoordPart(parts[1]);
    if (
      lat !== null && lng !== null &&
      lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
    ) {
      return `${round5(lat)},${round5(lng)}`;
    }
  }

  // ── 日本の住所 ── 都道府県＋市区町村まで残し、町名・丁目・番地は落とす。
  const match = normalized.match(ADDRESS_PATTERN);
  if (match) {
    return `${match[1] ?? ""}${match[2]}`;
  }

  return normalized;
}
