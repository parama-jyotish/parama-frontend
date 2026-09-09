"use client";

/**
 * /admin — レビュー管理画面（v4.0 段階配信B / 手順書07 Step 6）
 *
 * - Supabase Auth（Google OAuth）でログイン
 * - レビュー待ち一覧（ready_for_review、ready_for_review_at 昇順）
 * - 配信待ち一覧（approved、approved_at 昇順）
 * - 配信済み一覧（sent / bounced、sent_at 降順・カーソルページング）
 * - エラー一覧（*_error 系 + blocked、created_at 降順）
 * - 実効的なアクセス制御は RLS（kazma_full_access）。管理者以外のアカウントで
 *   ログインしてもクエリ結果が空になるだけでデータには触れない。
 *
 * 内部ツールのため DESIGN.md のブランドトーンは適用せず、機能優先の最小 UI とする。
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import {
  DELIVERED_PAGE_SIZE,
  DELIVERED_STATUSES,
  ERROR_STATUSES,
  getSupabase,
  STATUS_LABELS,
  type PendingReading,
} from "@/lib/supabase-admin";

const cardStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: 16,
  marginBottom: 12,
  background: "white",
};

const btnStyle: React.CSSProperties = {
  height: 44,
  padding: "0 24px",
  borderRadius: 8,
  border: "none",
  background: "#0b7492",
  color: "white",
  fontSize: "0.875rem",
  cursor: "pointer",
};

/** ページ送りボタン。無効時は白抜き記号に変わるので色も落とす。 */
function pagerStyle(disabled: boolean): React.CSSProperties {
  return {
    height: 32,
    minWidth: 44,
    borderRadius: 8,
    border: "1px solid #ddd",
    background: "white",
    color: disabled ? "#bbb" : "#0b7492",
    fontSize: "1rem",
    cursor: disabled ? "default" : "pointer",
  };
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

function RecordRow({ record, extra }: { record: PendingReading; extra?: string }) {
  return (
    <Link
      href={`/admin/${record.id}`}
      style={{ ...cardStyle, display: "block", textDecoration: "none", color: "inherit" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <span style={{ fontWeight: 600 }}>
          {record.friend_name || record.email || record.id.slice(0, 8)}
        </span>
        <span style={{ fontSize: "0.75rem", color: "#666" }}>
          {STATUS_LABELS[record.status] ?? record.status}
        </span>
      </div>
      <div style={{ fontSize: "0.75rem", color: "#666", marginTop: 4 }}>
        {record.delivery_channel} / {record.category} / {record.lagna_sign ?? "—"} /
        受付 {formatDate(record.created_at)}
        {extra ? ` / ${extra}` : ""}
      </div>
    </Link>
  );
}

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<PendingReading[]>([]);
  const [approvedQueue, setApprovedQueue] = useState<PendingReading[]>([]);
  const [errorRecords, setErrorRecords] = useState<PendingReading[]>([]);
  const [delivered, setDelivered] = useState<PendingReading[]>([]);
  // deliveredCursors[i] は i ページ目を取得するための sent_at カーソル（0 ページ目は null）
  const [deliveredCursors, setDeliveredCursors] = useState<(string | null)[]>([null]);
  const [deliveredPage, setDeliveredPage] = useState(0);
  const [hasMoreDelivered, setHasMoreDelivered] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  /**
   * 配信済みを 1 ページ分取得する（カーソル方式）。
   *
   * offset 方式だと閲覧中に新しい sent が先頭へ入って重複・取りこぼしが起きるため、
   * 直前ページ最終行の sent_at を起点に sent_at < cursor で取得する。
   * PAGE_SIZE + 1 件取ることで、全件カウントなしに次ページの有無を判定する。
   */
  const loadDelivered = useCallback(
    async (page: number, cursors: (string | null)[]) => {
      const supabase = getSupabase();
      let query = supabase
        .from("pending_readings")
        .select("*")
        .in("status", DELIVERED_STATUSES)
        .order("sent_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(DELIVERED_PAGE_SIZE + 1);

      const cursor = cursors[page] ?? null;
      if (cursor) query = query.lt("sent_at", cursor);

      const { data, error } = await query;
      if (error) throw error;

      const rows = data ?? [];
      const hasMore = rows.length > DELIVERED_PAGE_SIZE;
      const shown = rows.slice(0, DELIVERED_PAGE_SIZE);

      setDelivered(shown);
      setHasMoreDelivered(hasMore);
      setDeliveredPage(page);

      // 次ページ用のカーソルを確定させる
      const next = [...cursors];
      next[page + 1] = hasMore ? shown[shown.length - 1]?.sent_at ?? null : null;
      setDeliveredCursors(next);
      return next;
    },
    []
  );

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const supabase = getSupabase();
      const [reviewRes, approvedRes, errorRes] = await Promise.all([
        supabase
          .from("pending_readings")
          .select("*")
          .eq("status", "ready_for_review")
          .order("ready_for_review_at", { ascending: true }),
        supabase
          .from("pending_readings")
          .select("*")
          .eq("status", "approved")
          .order("approved_at", { ascending: true }),
        supabase
          .from("pending_readings")
          .select("*")
          .in("status", ERROR_STATUSES)
          .order("created_at", { ascending: false }),
      ]);
      if (reviewRes.error) throw reviewRes.error;
      if (approvedRes.error) throw approvedRes.error;
      if (errorRes.error) throw errorRes.error;
      setReviewQueue(reviewRes.data ?? []);
      setApprovedQueue(approvedRes.data ?? []);
      setErrorRecords(errorRes.data ?? []);
      // 再読込時は配信済みも先頭ページに戻す
      await loadDelivered(0, [null]);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [loadDelivered]);

  /** 配信済みのページ送り。他セクションは再取得しない。 */
  const goDelivered = async (page: number) => {
    setLoading(true);
    setLoadError(null);
    try {
      await loadDelivered(page, deliveredCursors);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) loadRecords();
  }, [session, loadRecords]);

  const signIn = async () => {
    await getSupabase().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/admin` },
    });
  };

  const signOut = async () => {
    await getSupabase().auth.signOut();
  };

  if (!authChecked) {
    return <main style={{ padding: 24 }}>確認中…</main>;
  }

  if (!session) {
    return (
      <main style={{ padding: 24, maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.25rem", margin: "48px 0 24px" }}>PARAMA 管理画面</h1>
        <button type="button" onClick={signIn} style={btnStyle}>
          Google でログイン
        </button>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto", background: "#f5f5f5", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.25rem", margin: 0 }}>レビュー管理</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={loadRecords} style={{ ...btnStyle, background: "#666" }} disabled={loading}>
            {loading ? "読込中…" : "再読込"}
          </button>
          <button type="button" onClick={signOut} style={{ ...btnStyle, background: "#999" }}>
            ログアウト
          </button>
        </div>
      </div>

      {loadError && (
        <p style={{ color: "#b00020", fontSize: "0.875rem" }}>
          読み込みエラー: {loadError}
        </p>
      )}

      <h2 style={{ fontSize: "1rem", margin: "24px 0 12px" }}>
        レビュー待ち（{reviewQueue.length}件）
      </h2>
      {reviewQueue.length === 0 && !loading && (
        <p style={{ fontSize: "0.875rem", color: "#666" }}>レビュー待ちはありません</p>
      )}
      {reviewQueue.map((r) => (
        <RecordRow key={r.id} record={r} />
      ))}

      <h2 style={{ fontSize: "1rem", margin: "32px 0 12px" }}>
        配信待ち（{approvedQueue.length}件）
      </h2>
      {approvedQueue.length === 0 && !loading && (
        <p style={{ fontSize: "0.875rem", color: "#666" }}>配信待ちはありません</p>
      )}
      {approvedQueue.map((r) => (
        <RecordRow key={r.id} record={r} extra={`承認 ${formatDate(r.approved_at)}`} />
      ))}

      <h2 style={{ fontSize: "1rem", margin: "32px 0 12px" }}>配信済み</h2>
      {delivered.length === 0 && !loading && (
        <p style={{ fontSize: "0.875rem", color: "#666" }}>配信済みはありません</p>
      )}
      {delivered.map((r) => (
        <RecordRow key={r.id} record={r} extra={`配信 ${formatDate(r.sent_at)}`} />
      ))}
      {(delivered.length > 0 || deliveredPage > 0) && (
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
          <button
            type="button"
            onClick={() => goDelivered(deliveredPage - 1)}
            disabled={deliveredPage === 0 || loading}
            style={pagerStyle(deliveredPage === 0 || loading)}
            aria-label="前の20件"
          >
            {deliveredPage === 0 || loading ? "◁" : "◀"}
          </button>
          <span style={{ fontSize: "0.75rem", color: "#666" }}>
            {deliveredPage + 1} ページ目
          </span>
          <button
            type="button"
            onClick={() => goDelivered(deliveredPage + 1)}
            disabled={!hasMoreDelivered || loading}
            style={pagerStyle(!hasMoreDelivered || loading)}
            aria-label="次の20件"
          >
            {!hasMoreDelivered || loading ? "▷" : "▶"}
          </button>
        </div>
      )}

      <h2 style={{ fontSize: "1rem", margin: "32px 0 12px" }}>
        エラー（{errorRecords.length}件）
      </h2>
      {errorRecords.length === 0 && !loading && (
        <p style={{ fontSize: "0.875rem", color: "#666" }}>エラーはありません</p>
      )}
      {errorRecords.map((r) => (
        <RecordRow key={r.id} record={r} />
      ))}
    </main>
  );
}
