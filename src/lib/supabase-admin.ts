/**
 * supabase-admin.ts — /admin 専用の Supabase ブラウザクライアントと型定義
 *
 * v4.0 段階配信B: 管理画面は Supabase Auth（Google OAuth）でログインし、
 * anon キー + authenticated ロールで pending_readings にアクセスする。
 * 実効的なアクセス制御は Supabase RLS（kazma_full_access ポリシー）が担う。
 *
 * 必要な環境変数（.env.local）:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定です（.env.local を確認）"
      );
    }
    client = createBrowserClient(url, anonKey);
  }
  return client;
}

// ── pending_readings の型（バックエンド schemas.py / migration SQL と対応）──

export type PendingReadingStatus =
  | "pending"
  | "linked"
  | "generating"
  | "ready_for_review"
  | "approved"
  | "sent"
  | "calc_error"
  | "generation_error"
  | "send_error"
  | "blocked"
  | "bounced"
  | "expired";

export interface PendingReading {
  id: string;
  created_at: string;
  delivery_channel: "line" | "email";
  category: string;
  birth_year: number | null;
  birth_month: number | null;
  birth_day: number | null;
  birth_hour: number | null;
  birth_minute: number | null;
  time_unknown: boolean;
  birth_place: string | null;
  email: string | null;
  line_user_id: string | null;
  friend_name: string | null;
  entry_source: string | null;
  age_range: string | null;
  lagna_sign: string | null;
  status: PendingReadingStatus;
  linked_at: string | null;
  ready_for_review_at: string | null;
  approved_at: string | null;
  sent_at: string | null;
  reading_text: string | null;
  reading_text_edited: string | null;
}

export const ERROR_STATUSES: PendingReadingStatus[] = [
  "calc_error",
  "generation_error",
  "send_error",
  "blocked",
];

/** 配信済みセクションの対象。bounced は「配信後に跳ねた」ため配信済み扱いとする。 */
export const DELIVERED_STATUSES: PendingReadingStatus[] = ["sent", "bounced"];

/** 配信済みセクションの 1 ページあたり表示件数 */
export const DELIVERED_PAGE_SIZE = 20;

/** status の日本語ラベル（一覧・詳細で共通利用） */
export const STATUS_LABELS: Partial<Record<PendingReadingStatus, string>> = {
  blocked: "LINE ブロック",
  bounced: "バウンス",
};

/**
 * 管理画面から実行できる操作（バックエンド state_machine.py のマトリクスと対応）。
 *
 * - transition: フロントから Supabase を直接 UPDATE する遷移
 *   （承認、send_error→approved。approved は H-3 バッチが自動で拾うため完結する）
 * - regenerate: バックエンドの管理用エンドポイントを呼ぶ操作
 *   （calc_error / generation_error。status を戻すだけでは生成が再実行されないため、
 *    POST /api/admin/regenerate/{id} が遷移＋再キックをまとめて行う）
 */
export type AdminAction =
  | { kind: "transition"; to: PendingReadingStatus; label: string; confirm?: string }
  | { kind: "regenerate"; label: string; confirm?: string };

export const ADMIN_ACTIONS: Partial<Record<PendingReadingStatus, AdminAction>> = {
  ready_for_review: { kind: "transition", to: "approved", label: "承認する" },
  approved: {
    kind: "transition",
    to: "ready_for_review",
    label: "配信をキャンセル（レビュー待ちに戻す）",
    confirm: "配信をキャンセルしてレビュー待ちに戻します。よろしいですか？",
  },
  send_error: { kind: "transition", to: "approved", label: "approved に戻す（再配信）" },
  calc_error: { kind: "regenerate", label: "鑑定文を再生成する" },
  generation_error: { kind: "regenerate", label: "鑑定文を再生成する" },
};

/**
 * 配信バッチ（H-3）の稼働時間帯かどうかを JST で判定する。
 *
 * H-3 は「approved 一覧を読む → 外部送信 → 条件付き UPDATE」の順で処理するため、
 * 送信後・UPDATE 前にキャンセルが成功すると「配信済みなのに DB はレビュー待ち」に
 * なる（要求仕様書 §4-6）。この時間帯はキャンセルを受け付けない。
 *
 * 平日 07:00-07:30 JST（deliver_weekday）／土曜 09:00-09:30 JST（deliver_saturday）
 */
export function isDeliveryBatchWindow(now: Date = new Date()): boolean {
  // JST の曜日・時刻を得る（実行環境のタイムゾーンに依存しないよう明示変換する）
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekday = get("weekday");
  const minutes = Number(get("hour")) * 60 + Number(get("minute"));

  if (weekday === "Sat") {
    return minutes >= 9 * 60 && minutes < 9 * 60 + 30;
  }
  if (weekday === "Sun") {
    return false;
  }
  return minutes >= 7 * 60 && minutes < 7 * 60 + 30;
}

/**
 * 状態遷移を実行する（現在 status 一致の条件付き UPDATE で多重実行を防止。
 * バックエンド supabase_client.update_status と同じガード方式）。
 *
 * @returns 更新できたら true、条件不一致（他所が先に更新）なら false
 */
export async function transitionStatus(
  id: string,
  from: PendingReadingStatus,
  to: PendingReadingStatus
): Promise<boolean> {
  const fields: Record<string, string | null> = { status: to };
  if (to === "approved" && from === "ready_for_review") {
    fields.approved_at = new Date().toISOString();
  }
  // 配信キャンセル。status と時刻列の整合を保つため approved_at を消す。
  // ready_for_review_at は「生成が完了した時刻」なので更新しない（§8-3）。
  if (to === "ready_for_review" && from === "approved") {
    fields.approved_at = null;
  }
  const { data, error } = await getSupabase()
    .from("pending_readings")
    .update(fields)
    .eq("id", id)
    .eq("status", from)
    .select("id");
  if (error) throw error;
  return (data ?? []).length > 0;
}

/**
 * バックエンドの管理用エンドポイントで鑑定文の再生成をキックする
 * （calc_error / generation_error 用。遷移＋再実行をバックエンドが行う）。
 *
 * 認証には現在の Supabase セッションのアクセストークンを使う
 * （バックエンドが ADMIN_EMAIL と照合する）。
 *
 * @throws Error 未ログイン、API URL 未設定、またはバックエンドがエラーを返した場合
 */
export async function regenerateReading(id: string): Promise<void> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL が未設定です（.env.local を確認）");
  }
  const { data } = await getSupabase().auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error("ログインセッションがありません");
  }
  const res = await fetch(
    `${apiUrl.replace(/\/$/, "")}/api/admin/regenerate/${id}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail ?? `再生成リクエストが失敗しました（HTTP ${res.status}）`);
  }
}
