"use client";

/**
 * /admin/[id] — 鑑定レビュー詳細（v4.0 段階配信B）
 *
 * - レコード詳細 + AI 生成テキスト（reading_text）の表示
 * - 編集: reading_text_edited に保存（NULL なら配信時に原文を使用）
 * - 承認: ready_for_review → approved（approved_at 記録）
 * - 手動復帰: エラー status をマトリクス許容の遷移で戻す
 */

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ADMIN_ACTIONS,
  getSupabase,
  regenerateReading,
  transitionStatus,
  type PendingReading,
} from "@/lib/supabase-admin";

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

const labelStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  color: "#666",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

export default function AdminDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [record, setRecord] = useState<PendingReading | null>(null);
  const [editedText, setEditedText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadRecord = useCallback(async () => {
    const { data, error } = await getSupabase()
      .from("pending_readings")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      setMessage(`読み込みエラー: ${error.message}`);
    } else {
      setRecord(data);
      setEditedText(data?.reading_text_edited ?? "");
    }
    setLoaded(true);
  }, [id]);

  useEffect(() => {
    loadRecord();
  }, [loadRecord]);

  const saveEdit = async () => {
    if (!record) return;
    setBusy(true);
    setMessage(null);
    try {
      // 空文字は NULL に戻す（配信時に原文を使う挙動を維持）
      const { error } = await getSupabase()
        .from("pending_readings")
        .update({ reading_text_edited: editedText.trim() ? editedText : null })
        .eq("id", record.id);
      if (error) throw error;
      setMessage("編集内容を保存しました");
      await loadRecord();
    } catch (e) {
      setMessage(`保存エラー: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const doAction = async () => {
    if (!record) return;
    const action = ADMIN_ACTIONS[record.status];
    if (!action) return;
    const confirmText =
      action.kind === "transition"
        ? `status を ${record.status} → ${action.to} にします。よろしいですか？`
        : "鑑定文の再生成を開始します。よろしいですか？";
    if (!window.confirm(confirmText)) {
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      if (action.kind === "transition") {
        const ok = await transitionStatus(record.id, record.status, action.to);
        setMessage(
          ok
            ? `${action.to} に遷移しました`
            : "遷移できませんでした（他の処理が先に status を変更した可能性）"
        );
      } else {
        await regenerateReading(record.id);
        setMessage("再生成を開始しました（完了すると ready_for_review に戻ります）");
      }
      await loadRecord();
    } catch (e) {
      setMessage(`操作エラー: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) {
    return <main style={{ padding: 24 }}>読み込み中…</main>;
  }

  if (!record) {
    return (
      <main style={{ padding: 24 }}>
        <p>レコードが見つかりません（未ログインまたは権限なしの可能性）</p>
        <Link href="/admin">← 一覧へ戻る</Link>
      </main>
    );
  }

  const action = ADMIN_ACTIONS[record.status];
  const birth =
    record.birth_year !== null
      ? `${record.birth_year}-${record.birth_month}-${record.birth_day} ` +
        (record.time_unknown ? "(時刻不明)" : `${record.birth_hour}:${String(record.birth_minute).padStart(2, "0")}`)
      : "（期限切れによりNULL化済み）";

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto", background: "#f5f5f5", minHeight: "100vh" }}>
      <Link href="/admin" style={{ fontSize: "0.875rem" }}>← 一覧へ戻る</Link>

      <h1 style={{ fontSize: "1.25rem", margin: "16px 0" }}>
        {record.friend_name || record.email || record.id.slice(0, 8)}
        <span style={{ fontSize: "0.875rem", color: "#666", marginLeft: 12 }}>{record.status}</span>
      </h1>

      {message && (
        <p style={{ fontSize: "0.875rem", color: message.includes("エラー") ? "#b00020" : "#0b7492" }}>
          {message}
        </p>
      )}

      <section style={{ background: "white", borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <dl style={{ display: "grid", gridTemplateColumns: "8em 1fr", gap: 8, margin: 0, fontSize: "0.875rem" }}>
          <dt style={labelStyle}>ID</dt><dd style={{ margin: 0 }}>{record.id}</dd>
          <dt style={labelStyle}>チャネル</dt><dd style={{ margin: 0 }}>{record.delivery_channel}</dd>
          <dt style={labelStyle}>カテゴリー</dt><dd style={{ margin: 0 }}>{record.category}</dd>
          <dt style={labelStyle}>生年月日</dt><dd style={{ margin: 0 }}>{birth}</dd>
          <dt style={labelStyle}>出生地</dt><dd style={{ margin: 0 }}>{record.birth_place ?? "—"}</dd>
          <dt style={labelStyle}>ラグナ</dt><dd style={{ margin: 0 }}>{record.lagna_sign ?? "—"}</dd>
          <dt style={labelStyle}>連絡先</dt>
          <dd style={{ margin: 0 }}>{record.email ?? record.line_user_id ?? "—"}</dd>
          <dt style={labelStyle}>流入経路</dt><dd style={{ margin: 0 }}>{record.entry_source ?? "—"}</dd>
          <dt style={labelStyle}>受付</dt><dd style={{ margin: 0 }}>{formatDate(record.created_at)}</dd>
          <dt style={labelStyle}>生成完了</dt><dd style={{ margin: 0 }}>{formatDate(record.ready_for_review_at)}</dd>
          <dt style={labelStyle}>承認</dt><dd style={{ margin: 0 }}>{formatDate(record.approved_at)}</dd>
          <dt style={labelStyle}>配信</dt><dd style={{ margin: 0 }}>{formatDate(record.sent_at)}</dd>
        </dl>
      </section>

      <section style={{ background: "white", borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h2 style={{ fontSize: "1rem", marginTop: 0 }}>AI 生成原文（reading_text）</h2>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.875rem", fontFamily: "inherit", margin: 0 }}>
          {record.reading_text ?? "（未生成）"}
        </pre>
      </section>

      <section style={{ background: "white", borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h2 style={{ fontSize: "1rem", marginTop: 0 }}>編集済み文（reading_text_edited）</h2>
        <p style={labelStyle}>空のまま保存すると原文を配信します</p>
        <textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          rows={16}
          style={{
            width: "100%",
            fontSize: "0.875rem",
            padding: 12,
            borderRadius: 8,
            border: "1px solid #ddd",
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />
        <button type="button" onClick={saveEdit} disabled={busy} style={{ ...btnStyle, marginTop: 8 }}>
          編集を保存
        </button>
      </section>

      {action && (
        <section style={{ background: "white", borderRadius: 8, padding: 16 }}>
          <button
            type="button"
            onClick={doAction}
            disabled={busy}
            style={{
              ...btnStyle,
              background: record.status === "ready_for_review" ? "#0b7492" : "#a6ba67",
              width: "100%",
            }}
          >
            {action.label}
          </button>
        </section>
      )}
    </main>
  );
}
