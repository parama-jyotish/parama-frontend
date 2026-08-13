/**
 * 市区町村マスターの照合キーを作る。
 *
 * マスター側の見出し語と利用者の入力の双方に同じ関数を通すことで、表記ゆれを吸収する。
 * ビルドスクリプト（scripts/build-municipalities.mjs）と実行時の双方から import しており、
 * **両者が同じ関数を使うことが前提**。ここを片方だけ変えると索引と入力が食い違って照合が壊れる。
 *
 * 正規化の対象は実データから決めている（総務省コード表と Geolonia 住所データの突合で
 * 実際に食い違った文字、および利用者が書き分けうる異体字）。
 */

/** 全角英数・記号を半角へ。 */
function toHalfWidth(input: string): string {
  return input
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/　/g, " ");
}

/** ひらがな → カタカナ（カナ入力を見出し語のカナと突き合わせるため）。 */
function toKatakana(input: string): string {
  return input.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));
}

/**
 * 異体字の吸収。左が入力されうる表記、右が寄せ先。
 * 正式名称がどちらであるかは問わない（キーの一意性ではなく一致だけが目的）。
 */
const VARIANTS: Record<string, string> = {
  // ケ/ヶ/ヵ/箇 — 袖ケ浦市・龍ケ崎市・鎌ケ谷市・外ヶ浜町 など。正式表記が版により揺れる
  ヶ: "ケ", ヵ: "ケ", ケ: "ケ",
  // 旧字体・異体字
  檮: "梼", 龍: "竜", 邊: "辺", 邉: "辺", 澤: "沢", 嶋: "島", 嶌: "島",
  濱: "浜", 曾: "曽", 桧: "檜", 藪: "薮", 舘: "館", 髙: "高", 﨑: "崎",
  國: "国", 齋: "斎", 齊: "斉", 圓: "円", 兒: "児", 榮: "栄", 假: "仮",
  黑: "黒", 惠: "恵", 廣: "広",
};

const VARIANT_PATTERN = new RegExp(`[${Object.keys(VARIANTS).join("")}]`, "g");

/**
 * 照合キーへ変換する。
 *
 * 空白・中黒・ハイフンは落とす（「東京都 世田谷区」「サッポロシ チュウオウク」を吸収）。
 * 「が」は漢字に続くときだけ「ケ」へ寄せる（袖が浦 → 袖ケ浦）。カナ語中の「が」まで
 * 潰すと「ナガノ」が「ナケノ」になるため、直前が漢字の場合に限っている。
 */
export function placeKey(input: string): string {
  return toKatakana(toHalfWidth(input))
    .replace(/([㐀-鿿])[がガ]/g, "$1ケ")
    .replace(VARIANT_PATTERN, (c) => VARIANTS[c])
    .replace(/[\s・\-‐‑–—ー―]/g, "")
    .toUpperCase();
}
