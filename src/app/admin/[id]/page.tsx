"use client";

/**
 * /admin/[id] — 鑑定レビュー詳細（v4.0 段階配信B）
 *
 * - レコード詳細 + AI 生成テキスト（reading_text）の表示
 * - 編集: reading_text_edited に保存（NULL なら配信時に原文を使用）
 * - 承認: ready_for_review → approved（approved_at 記録）
 * - 配信キャンセル: approved → ready_for_review（approved_at を NULL に戻す）
 * - 手動復帰: エラー status をマトリクス許容の遷移で戻す
 * - 生成中（generating）はポーリングして完了を待つ
 */

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ADMIN_ACTIONS,
  getSupabase,
  isDeliveryBatchWindow,
  regenerateReading,
  transitionStatus,
  type AdminAction,
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

const BATCH_WINDOW_REASON =
  "配信バッチの稼働中です（平日 7:00-7:30 / 土曜 9:00-9:30 JST）。" +
  "この時間帯は配信済みと入れ違う恐れがあるためキャンセルできません。";

/** 配信キャンセル（approved → ready_for_review）かどうか。 */
function isCancelAction(action: AdminAction): boolean {
  return action.kind === "transition" && action.to === "ready_for_review";
}

/** アクションボタンの色。承認＝青、キャンセル＝オレンジ、その他（再生成・再配信）＝緑。 */
const ACTION_COLORS: Record<string, string> = {
  ready_for_review: "#0b7492",
  approved: "#d97a2b",
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
  // 保存直後は無効化し、テキストエリアにフォーカスが入ったら復帰させる
  const [editSaved, setEditSaved] = useState(false);
  // 読み込み失敗は操作メッセージと別に持つ。復旧時に自動で消せるようにするため。
  const [loadError, setLoadError] = useState<string | null>(null);
  // 配信バッチ稼働中か。境界をまたいでも表示が追随するよう定期的に再評価する。
  const [inBatchWindow, setInBatchWindow] = useState(false);

  /**
   * レコードを再取得する。
   *
   * preserveEdit=true のときは編集中のテキストを上書きしない
   * （生成中ポーリングで入力内容が消えるのを防ぐ）。
   */
  const loadRecord = useCallback(
    async (preserveEdit = false) => {
      const { data, error } = await getSupabase()
        .from("pending_readings")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) {
        setLoadError(error.message);
      } else {
        setLoadError(null);
        setRecord(data);
        if (!preserveEdit) setEditedText(data?.reading_text_edited ?? "");
      }
      setLoaded(true);
      return data as PendingReading | null;
    },
    [id]
  );

  useEffect(() => {
    loadRecord();
  }, [loadRecord]);

  // 生成中は完了を待って自動反映する。status が generating を抜けたら止める。
  //
  // setInterval だと応答が 5 秒を超えたときにリクエストが並行し、古い generating の
  // 応答が新しい完了応答を上書きして生成中表示のまま固まる。1 回の応答を待ってから
  // 次を予約する逐次方式にして、同時に 1 本しか飛ばないようにしている。
  useEffect(() => {
    if (record?.status !== "generating") return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      try {
        const next = await loadRecord(true);
        // 応答が返るまでにアンマウントされている場合があるので再確認する
        if (cancelled) return;
        if (next && next.status !== "generating") return;
      } catch {
        // 一時的な取得失敗ではポーリングを止めない（次回に再試行する）
        if (cancelled) return;
      }
      timer = setTimeout(tick, 5000);
    };

    timer = setTimeout(tick, 5000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [record?.status, loadRecord]);

  // 配信バッチ稼働時間帯の判定を 30 秒ごとに更新する
  useEffect(() => {
    const update = () => setInBatchWindow(isDeliveryBatchWindow());
    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, []);

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
      setEditSaved(true);
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
    // 配信バッチ稼働中のキャンセルは、外部送信済みなのに DB だけ戻る危険がある。
    // ボタンは事前に無効化しているが、境界をまたいだ直後の押下に備えて再判定する。
    if (isCancelAction(action) && isDeliveryBatchWindow()) {
      setMessage(BATCH_WINDOW_REASON);
      return;
    }
    const confirmText =
      action.confirm ??
      (action.kind === "transition"
        ? `status を ${record.status} → ${action.to} にします。よろしいですか？`
        : "鑑定文の再生成を開始します。よろしいですか？");
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

      {loadError && (
        <p style={{ fontSize: "0.875rem", color: "#b00020" }}>
          読み込みエラー: {loadError}
        </p>
      )}

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
        {record.status === "generating" ? (
          <p style={{ fontSize: "0.875rem", color: "#0b7492", margin: 0 }}>
            現在鑑定文を生成中です…（完了すると自動で表示されます）
          </p>
        ) : (
          <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.875rem", fontFamily: "inherit", margin: 0 }}>
            {record.reading_text ?? "（未生成）"}
          </pre>
        )}
      </section>

      <section style={{ background: "white", borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h2 style={{ fontSize: "1rem", marginTop: 0 }}>編集済み文（reading_text_edited）</h2>
        <p style={labelStyle}>空のまま保存すると原文を配信します</p>
        <textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          onFocus={() => setEditSaved(false)}
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
        <button
          type="button"
          onClick={saveEdit}
          disabled={busy || editSaved}
          style={{
            ...btnStyle,
            marginTop: 8,
            background: editSaved ? "#ccc" : btnStyle.background,
            cursor: editSaved ? "default" : "pointer",
          }}
        >
          編集を保存
        </button>
      </section>

      {action && (
        <section style={{ background: "white", borderRadius: 8, padding: 16 }}>
          {(() => {
            const blocked = isCancelAction(action) && inBatchWindow;
            return (
              <>
                <button
                  type="button"
                  onClick={doAction}
                  disabled={busy || blocked}
                  style={{
                    ...btnStyle,
                    background: blocked ? "#ccc" : ACTION_COLORS[record.status] ?? "#a6ba67",
                    cursor: blocked ? "default" : "pointer",
                    width: "100%",
                  }}
                >
                  {action.label}
                </button>
                {blocked && (
                  <p style={{ ...labelStyle, marginBottom: 0 }}>{BATCH_WINDOW_REASON}</p>
                )}
              </>
            );
          })()}
        </section>
      )}
    </main>
  );
}
