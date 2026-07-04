export interface LagnaResult {
  name_ja: string;
  name_en: string;
  sanskrit: string;
  description: string;
}

export const LAGNA_RESULTS: Record<string, LagnaResult> = {
  Aries: {
    name_ja: "牡羊座",
    name_en: "Aries",
    sanskrit: "メーシャ（Mesha）",
    description:
      "止まっているより、動いている時間のほうが性に合うラグナです",
  },
  Taurus: {
    name_ja: "牡牛座",
    name_en: "Taurus",
    sanskrit: "ヴリシャバ（Vrishabha）",
    description:
      "数字や理屈より、肌感覚の「合う・合わない」を信じるラグナです",
  },
  Gemini: {
    name_ja: "双子座",
    name_en: "Gemini",
    sanskrit: "ミトゥナ（Mithuna）",
    description:
      "ひとつに絞らず、複数の関心を同時に動かしていけるラグナです",
  },
  Cancer: {
    name_ja: "蟹座",
    name_en: "Cancer",
    sanskrit: "カルカ（Karka）",
    description:
      "放っておけない気持ちが、自然と人を支える力になるラグナです",
  },
  Leo: {
    name_ja: "獅子座",
    name_en: "Leo",
    sanskrit: "シンハ（Simha）",
    description:
      "演じるより、自分のままで在ることを選ぶラグナです",
  },
  Virgo: {
    name_ja: "乙女座",
    name_en: "Virgo",
    sanskrit: "カンニャー（Kanya）",
    description:
      "小さなズレや違和感を、さっと整えられるラグナです",
  },
  Libra: {
    name_ja: "天秤座",
    name_en: "Libra",
    sanskrit: "トゥラー（Tula）",
    description:
      "相手の反応を見ながら、ちょうどいい着地点を探していけるラグナです",
  },
  Scorpio: {
    name_ja: "蠍座",
    name_en: "Scorpio",
    sanskrit: "ヴリシュチカ（Vrischika）",
    description:
      "一度信じた相手なら、長く深く関わり続けられるラグナです",
  },
  Sagittarius: {
    name_ja: "射手座",
    name_en: "Sagittarius",
    sanskrit: "ダヌス（Dhanus）",
    description:
      "損得より、自分が納得できる道を進んでいけるラグナです",
  },
  Capricorn: {
    name_ja: "山羊座",
    name_en: "Capricorn",
    sanskrit: "マカラ（Makara）",
    description:
      "3年後・5年後の景色から逆算して、進んでいけるラグナです",
  },
  Aquarius: {
    name_ja: "水瓶座",
    name_en: "Aquarius",
    sanskrit: "クンバ（Kumbha）",
    description:
      "流れに合わせるより、自分の感覚を優先できる芯を持つラグナです",
  },
  Pisces: {
    name_ja: "魚座",
    name_en: "Pisces",
    sanskrit: "ミーナ（Meena）",
    description:
      "目に見えない気配や流れまで含めて、世界を感じ取れるラグナです",
  },
};
