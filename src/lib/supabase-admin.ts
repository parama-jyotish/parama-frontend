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
];

/**
 * 管理画面から実行できる状態遷移（バックエンド state_machine.py のマトリクスと同一。
 * 承認 + リトライ復帰3種のみ。他の遷移はバックエンド/バッチが担う）。
 */
export const ADMIN_TRANSITIONS: Partial<
  Record<PendingReadingStatus, { to: PendingReadingStatus; label: string }>
> = {
  ready_for_review: { to: "approved", label: "承認する" },
  calc_error: { to: "pending", label: "pending に戻す" },
  generation_error: { to: "generating", label: "generating に戻す" },
  send_error: { to: "approved", label: "approved に戻す（再配信）" },
};

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
  const fields: Record<string, string> = { status: to };
  if (to === "approved" && from === "ready_for_review") {
    fields.approved_at = new Date().toISOString();
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
