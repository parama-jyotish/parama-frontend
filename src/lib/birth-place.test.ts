/**
 * 出生地入力の解決の単体テスト。
 *
 *   npm test
 *
 * 廃止された市区町村のマスターは実行時に fetch する設計なので、テストでは
 * public/ のファイルを読んで返すスタブを差し込んでいる。
 */

import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  normalizeBirthPlace,
  resolveBirthPlace,
  municipalityLabel,
  type BirthPlaceResolution,
} from "./birth-place.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

before(() => {
  const body = readFileSync(join(ROOT, "public/data/municipalities-historical.json"), "utf8");
  globalThis.fetch = (async (url: string) => {
    assert.equal(String(url), "/data/municipalities-historical.json");
    return { ok: true, status: 200, json: async () => JSON.parse(body) };
  }) as unknown as typeof fetch;
});

/** 解決結果を「種別＋要点」の短い文字列にして期待値と比べる。 */
async function resolved(raw: string): Promise<string> {
  const r: BirthPlaceResolution = await resolveBirthPlace(raw);
  switch (r.kind) {
    case "coords": return `coords ${r.value} (${r.label})`;
    case "ambiguous": return `ambiguous ${r.candidates.length}: ${r.candidates.map(municipalityLabel).join(" / ")}`;
    case "fallback": return `fallback ${r.value}`;
    case "unknown": return `unknown ${r.reason}`;
  }
}

// ── 座標入力（既存仕様。docs/29 §4-1 の26件から座標分を引き継ぐ） ──
describe("座標入力", () => {
  const cases: [string, string][] = [
    ["35.68, 139.76", "35.68,139.76"],
    ["35.68,139.76", "35.68,139.76"],
    ["35.68 139.76", "35.68,139.76"],
    ["３５.６８、１３９.７６", "35.68,139.76"],
    ["N35.68 E139.76", "35.68,139.76"],
    ["35.68N 139.76E", "35.68,139.76"],
    ["35.68°N 139.76°E", "35.68,139.76"],
    // 南半球・西半球。方角記号を落とすだけの実装だと北半球に化ける（docs/30 §4）
    ["S33.8688 E151.2093", "-33.8688,151.2093"],
    ["-34.6037,-58.3816", "-34.6037,-58.3816"],
    ["S22.9068 W43.1729", "-22.9068,-43.1729"],
    ["-1.2921,36.8219", "-1.2921,36.8219"],
  ];
  for (const [input, expected] of cases) {
    test(input, async () => {
      assert.equal(normalizeBirthPlace(input), expected);
      assert.equal(await resolved(input), `coords ${expected} (${expected})`);
    });
  }

  test("符号と方角の二重指定は受け付けない", () => {
    assert.equal(normalizeBirthPlace("S-33.8688 E151.2093"), "S-33.8688 E151.2093");
  });

  test("範囲外の値は座標として扱わない", () => {
    assert.equal(normalizeBirthPlace("91.0, 139.76"), "91.0, 139.76");
  });
});

// ── 現行の市区町村を一意に解決する ──
describe("現行の市区町村", () => {
  const cases: [string, string][] = [
    ["東京都世田谷区", "東京都世田谷区"],
    ["世田谷区", "東京都世田谷区"],
    ["東京都世田谷区北沢2-24-8", "東京都世田谷区"],
    ["宮城県仙台市青葉区中央1丁目1-1", "宮城県仙台市青葉区"],
    ["仙台市青葉区", "宮城県仙台市青葉区"],
    // 政令市を区まで書かない場合。Geolonia は区単位でしか持たないので明示的に足している
    ["仙台市", "宮城県仙台市"],
    ["浜松市", "静岡県浜松市"],
    // 郡部。郡を書いても省いてもよい
    ["宮城県宮城郡松島町", "宮城県宮城郡松島町"],
    ["宮城県松島町", "宮城県宮城郡松島町"],
    ["松島町", "宮城県宮城郡松島町"],
    ["東京都西多摩郡奥多摩町", "東京都西多摩郡奥多摩町"],
    ["奥多摩町", "東京都西多摩郡奥多摩町"],
    // 島嶼部（今回の検証テーマ）
    ["東京都八丈町", "東京都八丈町"],
    ["八丈町", "東京都八丈町"],
    ["利島村", "東京都利島村"],
    ["東京都利島村", "東京都利島村"],
    ["小笠原村", "東京都小笠原村"],
    // 「市」を名前に含む市、ひらがな・カタカナの市町村名
    ["市川市", "千葉県市川市"],
    ["さいたま市浦和区", "埼玉県さいたま市浦和区"],
    ["ニセコ町", "北海道虻田郡ニセコ町"],
    ["南アルプス市", "山梨県南アルプス市"],
    // 町名に数字を含む住所（北海道の「〜条〜丁目」）
    ["北海道札幌市中央区北1条西2丁目", "北海道札幌市中央区"],
    // 郵便番号付き・全角・前後の空白
    ["〒130-0011 東京都墨田区石原1-1-1", "東京都墨田区"],
    ["　東京都渋谷区　", "東京都渋谷区"],
    // 表記ゆれ（ケ/ヶ・異体字）
    ["袖ヶ浦市", "千葉県袖ケ浦市"],
    ["袖ケ浦市", "千葉県袖ケ浦市"],
    ["龍ケ崎市", "茨城県龍ケ崎市"],
    ["竜ヶ崎市", "茨城県龍ケ崎市"],
    ["高知県檮原町", "高知県高岡郡梼原町"],
    ["高知県梼原町", "高知県高岡郡梼原町"],
    // カナ入力（都道府県のカナは索引に持たないので、市区町村のカナのみ）
    ["セタガヤク", "東京都世田谷区"],
    ["せたがやく", "東京都世田谷区"],
    ["まつしままち", "宮城県宮城郡松島町"],
  ];
  for (const [input, expected] of cases) {
    test(`${input} → ${expected}`, async () => {
      const r = await resolveBirthPlace(input);
      assert.equal(r.kind, "coords", `期待は一意ヒットだが ${await resolved(input)}`);
      assert.equal(r.kind === "coords" ? r.label : "", expected);
    });
  }
});

// ── 浜松市の区再編（2024-01-01、7区→3区） ──
describe("浜松市の区再編", () => {
  test("新しい区は現行マスターにある", async () => {
    for (const [input, expected] of [
      ["浜松市中央区", "静岡県浜松市中央区"],
      ["浜松市浜名区", "静岡県浜松市浜名区"],
      ["浜松市天竜区", "静岡県浜松市天竜区"],
    ]) {
      const r = await resolveBirthPlace(input);
      assert.equal(r.kind === "coords" ? r.label : r.kind, expected);
    }
  });

  test("旧区名は廃止済みとして解決する（2023年以前生まれの表記）", async () => {
    const r = await resolveBirthPlace("静岡県浜松市浜北区");
    assert.equal(r.kind, "coords");
    assert.equal(r.kind === "coords" ? r.label : "", "静岡県浜松市浜北区（現在は廃止）");
  });
});

// ── 同名衝突は候補提示にする（黙って一方へ寄せない） ──
describe("同名の市区町村", () => {
  test("北区（東京都と政令市の区）", async () => {
    const r = await resolveBirthPlace("北区赤羽1-1-1");
    assert.equal(r.kind, "ambiguous");
    if (r.kind !== "ambiguous") return;
    const labels = r.candidates.map(municipalityLabel);
    assert.ok(labels.includes("東京都北区"), labels.join(" / "));
    assert.ok(labels.includes("大阪府大阪市北区"), labels.join(" / "));
    assert.ok(r.candidates.length >= 10, `候補 ${r.candidates.length}件`);
  });

  test("府中市（東京都・広島県）", async () => {
    const r = await resolveBirthPlace("府中市");
    assert.equal(r.kind, "ambiguous");
    if (r.kind !== "ambiguous") return;
    assert.deepEqual(r.candidates.map(municipalityLabel).sort(), ["広島県府中市", "東京都府中市"]);
  });

  test("都道府県を付ければ一意になる", async () => {
    for (const [input, expected] of [
      ["東京都府中市", "東京都府中市"],
      ["広島県府中市", "広島県府中市"],
      ["東京都北区", "東京都北区"],
      ["大阪市北区", "大阪府大阪市北区"],
      ["伊達市", null],
      ["北海道伊達市", "北海道伊達市"],
      ["福島県伊達市", "福島県伊達市"],
    ] as [string, string | null][]) {
      const r = await resolveBirthPlace(input);
      if (expected === null) assert.equal(r.kind, "ambiguous", input);
      else assert.equal(r.kind === "coords" ? r.label : r.kind, expected, input);
    }
  });

  test("港区・青葉区・泉区も候補提示になる（docs/30 §3 の指摘）", async () => {
    for (const input of ["港区", "青葉区", "泉区", "緑区", "中区", "旭区", "鶴見区"]) {
      const r = await resolveBirthPlace(input);
      assert.equal(r.kind, "ambiguous", `${input} → ${await resolved(input)}`);
    }
  });
});

// ── 旧市町村名（今回の主目的） ──
describe("廃止された市区町村", () => {
  const cases: [string, string][] = [
    ["東京都保谷市", "東京都保谷市（2001年まで）"],
    ["東京都保谷市東町1-1", "東京都保谷市（2001年まで）"],
    ["保谷市", "東京都保谷市（2001年まで）"],
    ["田無市", "東京都田無市（2001年まで）"],
    ["埼玉県浦和市", "埼玉県浦和市（2001年まで）"],
    ["大宮市", "埼玉県大宮市（2001年まで）"],
    ["与野市", "埼玉県与野市（2001年まで）"],
  ];
  for (const [input, expected] of cases) {
    test(`${input} → ${expected}`, async () => {
      const r = await resolveBirthPlace(input);
      assert.equal(r.kind, "coords", `期待は一意ヒットだが ${await resolved(input)}`);
      assert.equal(r.kind === "coords" ? r.label : "", expected);
    });
  }

  test("保谷市が Nominatim 誤答（京都市左京区）ではなく旧保谷市域に解決する", async () => {
    const r = await resolveBirthPlace("東京都保谷市");
    assert.equal(r.kind, "coords");
    if (r.kind !== "coords") return;
    const [lat, lng] = r.value.split(",").map(Number);
    // 旧保谷市域（現 西東京市）。京都市左京区は 35.03,135.78 なので取り違えれば必ず落ちる
    assert.ok(Math.abs(lat - 35.74) < 0.05, `lat=${lat}`);
    assert.ok(Math.abs(lng - 139.56) < 0.05, `lng=${lng}`);
  });

  test("現行の市区町村を廃止済みより優先する", async () => {
    // 「大宮区」はさいたま市に現存し、「大宮市」は廃止済み。取り違えない
    const now = await resolveBirthPlace("さいたま市大宮区");
    assert.equal(now.kind === "coords" ? now.label : "", "埼玉県さいたま市大宮区");
  });
});

// ── 辞書外 ──
describe("辞書に無い入力", () => {
  test("海外の地名はそのまま送る（Nominatim に委ねる）", async () => {
    for (const [input, expected] of [
      ["Paris", "Paris"],
      ["シドニー", "シドニー"],
      ["Sydney, Australia", "Sydney, Australia"],
      ["ブエノスアイレス", "ブエノスアイレス"],
      ["ニューヨーク市", "ニューヨーク市"],
    ]) {
      assert.equal(await resolved(input), `fallback ${expected}`, input);
    }
  });

  test("市区町村を含まない日本語もそのまま送る", async () => {
    for (const input of ["仙台", "東京", "沖縄県", "西新宿2-8-1"]) {
      const r = await resolveBirthPlace(input);
      assert.equal(r.kind, "fallback", `${input} → ${await resolved(input)}`);
    }
  });

  test("日本の住所として書かれていて解決できないものは送らずエラー", async () => {
    for (const input of ["東京都せたがや区", "架空県架空市", "東京都存在しない町"]) {
      assert.equal(await resolved(input), "unknown not-found", input);
    }
  });

  test("空文字", async () => {
    assert.equal(await resolved(""), "fallback ");
    assert.equal(normalizeBirthPlace(""), "");
  });
});
