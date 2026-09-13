/**
 * isDeliveryBatchWindow の単体テスト。
 *
 * H-3 配信バッチ（平日 07:00-07:30 JST / 土曜 09:00-09:30 JST）を判定する。
 * docs/43 §4-6 と §7-17 の受け入れ条件に対応。
 *
 * 曜日のアンカーは 2026-01 から採る:
 *   2026-01-05 (Mon), 2026-01-10 (Sat), 2026-01-11 (Sun)
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { isDeliveryBatchWindow } from "./supabase-admin.ts";

const monday = "2026-01-05";
const saturday = "2026-01-10";
const sunday = "2026-01-11";

const jst = (date: string, hhmm: string): Date =>
  new Date(`${date}T${hhmm}:00+09:00`);

describe("平日（月曜）", () => {
  test("06:59 → 稼働外", () => {
    assert.equal(isDeliveryBatchWindow(jst(monday, "06:59")), false);
  });
  test("07:00 → 稼働開始（境界）", () => {
    assert.equal(isDeliveryBatchWindow(jst(monday, "07:00")), true);
  });
  test("07:15 → 稼働中", () => {
    assert.equal(isDeliveryBatchWindow(jst(monday, "07:15")), true);
  });
  test("07:29 → 稼働終了直前", () => {
    assert.equal(isDeliveryBatchWindow(jst(monday, "07:29")), true);
  });
  test("07:30 → 稼働終了（境界）", () => {
    assert.equal(isDeliveryBatchWindow(jst(monday, "07:30")), false);
  });
  test("08:00 → 稼働外", () => {
    assert.equal(isDeliveryBatchWindow(jst(monday, "08:00")), false);
  });
  test("22:00 → 稼働外（深夜帯）", () => {
    assert.equal(isDeliveryBatchWindow(jst(monday, "22:00")), false);
  });
});

describe("土曜", () => {
  test("07:15（平日の窓）→ 稼働外", () => {
    assert.equal(isDeliveryBatchWindow(jst(saturday, "07:15")), false);
  });
  test("08:59 → 稼働外", () => {
    assert.equal(isDeliveryBatchWindow(jst(saturday, "08:59")), false);
  });
  test("09:00 → 稼働開始（境界）", () => {
    assert.equal(isDeliveryBatchWindow(jst(saturday, "09:00")), true);
  });
  test("09:15 → 稼働中", () => {
    assert.equal(isDeliveryBatchWindow(jst(saturday, "09:15")), true);
  });
  test("09:29 → 稼働終了直前", () => {
    assert.equal(isDeliveryBatchWindow(jst(saturday, "09:29")), true);
  });
  test("09:30 → 稼働終了（境界）", () => {
    assert.equal(isDeliveryBatchWindow(jst(saturday, "09:30")), false);
  });
});

describe("日曜（配信なし）", () => {
  test("07:15 → 稼働なし", () => {
    assert.equal(isDeliveryBatchWindow(jst(sunday, "07:15")), false);
  });
  test("09:15 → 稼働なし", () => {
    assert.equal(isDeliveryBatchWindow(jst(sunday, "09:15")), false);
  });
});
