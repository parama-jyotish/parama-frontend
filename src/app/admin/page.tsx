"use client";

/**
 * /admin — レビュー管理画面（v4.0 段階配信B / 手順書07 Step 6）
 *
 * - Supabase Auth（Google OAuth）でログイン
 * - ready_for_review 一覧（ready_for_review_at 昇順）
 * - エラー一覧（*_error 系、created_at 降順）
 * - 実効的なアクセス制御は RLS（kazma_full_access）。管理者以外のアカウントで
 *   ログインしてもクエリ結果が空になるだけでデータには触れない。
 *
 * 内部ツールのため DESIGN.md のブランドトーンは適用せず、機能優先の最小 UI とする。
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import {
  ERROR_STATUSES,
  getSupabase,
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

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

function RecordRow({ record }: { record: PendingReading }) {
  return (
    <Link
      href={`/admin/${record.id}`}
      style={{ ...cardStyle, display: "block", textDecoration: "none", color: "inherit" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <span style={{ fontWeight: 600 }}>
          {record.friend_name || record.email || record.id.slice(0, 8)}
        </span>
        <span style={{ fontSize: "0.75rem", color: "#666" }}>{record.status}</span>
      </div>
      <div style={{ fontSize: "0.75rem", color: "#666", marginTop: 4 }}>
        {record.delivery_channel} / {record.category} / {record.lagna_sign ?? "—"} /
        受付 {formatDate(record.created_at)}
      </div>
    </Link>
  );
}

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<PendingReading[]>([]);
  const [errorRecords, setErrorRecords] = useState<PendingReading[]>([]);
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

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const supabase = getSupabase();
      const [reviewRes, errorRes] = await Promise.all([
        supabase
          .from("pending_readings")
          .select("*")
          .eq("status", "ready_for_review")
          .order("ready_for_review_at", { ascending: true }),
        supabase
          .from("pending_readings")
          .select("*")
          .in("status", ERROR_STATUSES)
          .order("created_at", { ascending: false }),
      ]);
      if (reviewRes.error) throw reviewRes.error;
      if (errorRes.error) throw errorRes.error;
      setReviewQueue(reviewRes.data ?? []);
      setErrorRecords(errorRes.data ?? []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

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
