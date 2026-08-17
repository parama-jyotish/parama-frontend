"use client";

/**
 * /start — LP 統一フォーム（PARAMA_LP-LINE登録仕様_v4_0.md 第1部）
 *
 * 生年月日・出生時刻・出生地・関心事カテゴリー・受取方法を1画面で受け取り、
 * POST {NEXT_PUBLIC_API_URL}/api/start の結果を同一 URL 内で概要表示する。
 * LINE 組は cid1〜cid5 付きのエルメ URL へのボタン、メール組は送信先メールの提示で終える。
 *
 * 環境変数:
 *   NEXT_PUBLIC_API_URL            バックエンド（FastAPI）のベース URL
 *   NEXT_PUBLIC_ELME_LINE_URL      エルメの LINE 友だち追加 URL（未設定時はボタンを準備中表示）
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY Turnstile サイトキー（未設定時は Cloudflare の開発用テストキー）
 *
 * ※ コピー（キャッチコピー・登録後の流れ・各注記）は【仮】。確定はカズマ（docs/22 STEP 6-4）。
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LogoWordmark from "@/components/LogoWordmark";
import { CITIES } from "@/data/cities";
import {
  resolveBirthPlace,
  birthPlacePayload,
  municipalityLabel,
  type BirthPlaceResolution,
  type Municipality,
} from "@/lib/birth-place";

// ── 定数 ──────────────────────────────────────────────────
// 出生時刻の時間帯プリセット（/free/lagna と同一）
const TIME_PRESETS = [
  { label: "深夜", hour: 1, minute: 30 },
  { label: "明け方", hour: 4, minute: 30 },
  { label: "午前", hour: 9, minute: 0 },
  { label: "日中", hour: 13, minute: 30 },
  { label: "夕方", hour: 16, minute: 30 },
  { label: "夜間", hour: 21, minute: 0 },
];

const TIME_UNKNOWN_PRESET = { label: "不明（正午で計算）", hour: 12, minute: 0 };

// 鑑定カテゴリー7択（PARAMA_LP_鑑定カテゴリー仕様.md §3。ID・文言とも変更禁止）
const CATEGORIES = [
  {
    id: "self",
    label: "自分自身の本質と人生の方向性",
    sub: "性格・才能・人生のテーマ・自分のことを総合的に知りたい方も",
  },
  { id: "career", label: "仕事・キャリア・適職", sub: "転職・起業・働き方・職場の関係" },
  { id: "partnership", label: "結婚・パートナーシップ", sub: "婚期・相手の傾向・関係性" },
  { id: "money", label: "お金との関わり方", sub: "収入・資産・金銭感覚" },
  { id: "family", label: "家族・身近な人間関係", sub: "親・子ども・親しい人との関係" },
  { id: "health", label: "健康・体質の傾向", sub: "体質パターン・エネルギーの使い方" },
  { id: "timing", label: "いまの人生の時期・転機", sub: "これからの流れ・転換点" },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];
type DeliveryChannel = "line" | "email";

// Cloudflare の常時成功するテストキー。本番キーは環境変数から差し込む（docs/22 STEP 2）。
const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";
const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || TURNSTILE_TEST_SITE_KEY;
const TURNSTILE_SCRIPT_ID = "cf-turnstile-script";
const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

const CONTACT_EMAIL = "info@parama-jyotish.jp";

// 流入経路タグ（cid2）。仕様上は半角英数＋アンダースコアのみ。
const ENTRY_SOURCE_PATTERN = /^[A-Za-z0-9_]{1,64}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface TurnstileApi {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    }
  ) => string;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

interface StartResponse {
  pending_reading_id: string;
  lagna_sign: string;
  lagna_sign_ja: string;
  summary: string;
  age_range: string;
  delivery_channel: DeliveryChannel;
  time_unknown: boolean;
}

type PageState = "input" | "loading" | "result";
type FieldKey = "birth" | "time" | "place" | "category" | "delivery" | "email" | "turnstile";
type FieldErrors = Partial<Record<FieldKey, string>>;

// ── スタイル定数（/free/lagna と揃える） ──────────────────
const selectStyle: React.CSSProperties = {
  width: "100%",
  height: 44,
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "white",
  padding: "0 12px",
  fontSize: "0.875rem",
  color: "var(--c-teal-deep)",
  appearance: "auto",
};

const legendStyle: React.CSSProperties = {
  fontSize: "0.8125rem",
  color: "var(--c-teal-dark)",
  marginBottom: 10,
  fontWeight: 500,
};

const helpTextStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  color: "var(--c-teal-green)",
  lineHeight: 1.7,
  marginTop: 6,
};

const fieldErrorStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  color: "#b91c1c",
  marginTop: 6,
};

/** 出生地が確定したことの表示（「○○ として計算します」）。 */
const placeConfirmStyle: React.CSSProperties = {
  fontSize: "0.8125rem",
  color: "var(--c-teal)",
  lineHeight: 1.7,
  marginTop: 8,
};

// ── ヘルパー ──────────────────────────────────────────────
const FIELD_LABELS: Record<FieldKey, string> = {
  birth: "生年月日",
  time: "出生時刻",
  place: "出生地",
  category: "テーマ",
  delivery: "受取方法",
  email: "メールアドレス",
  turnstile: "認証",
};

const VALIDATION_FIELD_MAP: Record<string, FieldKey> = {
  year: "birth",
  month: "birth",
  day: "birth",
  hour: "time",
  minute: "time",
  time_unknown: "time",
  birth_place: "place",
  category: "category",
  delivery_channel: "delivery",
  email: "email",
  turnstile_token: "turnstile",
};

/** FastAPI の 422 レスポンス（detail 配列）を項目別のインラインエラーに変換する。 */
function mapValidationErrors(detail: unknown): FieldErrors {
  const errors: FieldErrors = {};
  if (!Array.isArray(detail)) return errors;
  for (const item of detail) {
    const loc = (item as { loc?: unknown[] })?.loc;
    const name = Array.isArray(loc) ? String(loc[loc.length - 1]) : "";
    const key = VALIDATION_FIELD_MAP[name];
    if (key) errors[key] = `${FIELD_LABELS[key]}のご入力内容をご確認ください。`;
  }
  return errors;
}

/** LINE 組の遷移先（エルメ URL + cid1〜cid5）。未設定・不正な URL の場合は null。 */
function buildElmeUrl(result: StartResponse, entrySource: string): string | null {
  const base = process.env.NEXT_PUBLIC_ELME_LINE_URL;
  if (!base) return null;
  try {
    const url = new URL(base);
    url.searchParams.set("cid1", result.pending_reading_id);
    url.searchParams.set("cid2", entrySource);
    url.searchParams.set("cid3", result.age_range);
    url.searchParams.set("cid4", result.lagna_sign);
    url.searchParams.set("cid5", ""); // Phase 2 では未使用の予約フィールド
    return url.toString();
  } catch {
    return null;
  }
}

// ── ページ ────────────────────────────────────────────────
export default function StartClient() {
  const searchParams = useSearchParams();
  const entrySource = useMemo(() => {
    const raw = searchParams.get("src") ?? "";
    return ENTRY_SOURCE_PATTERN.test(raw) ? raw : "";
  }, [searchParams]);

  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [isTimeUnknown, setIsTimeUnknown] = useState(false);
  const [showTimePresets, setShowTimePresets] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [birthPlace, setBirthPlace] = useState("");
  const [placeResolution, setPlaceResolution] = useState<BirthPlaceResolution | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Municipality | null>(null);
  // 出生地の現在値。handleSubmit の await 後は birthPlace が押した時点の値に固定されるため、
  // 「待っているあいだに書き換えられたか」はこちらで見る（onChange で同期している）。
  const birthPlaceRef = useRef("");
  // 送信の再入ガード。pageState は await を抜けるまで "input" のままなので state では防げない。
  const submitting = useRef(false);
  const [category, setCategory] = useState<CategoryId | "">("");
  const [deliveryChannel, setDeliveryChannel] = useState<DeliveryChannel | "">("");
  const [email, setEmail] = useState("");

  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | null>(null);

  const [pageState, setPageState] = useState<PageState>("input");
  const [result, setResult] = useState<StartResponse | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<React.ReactNode>(null);

  const years = useMemo(() => {
    const arr = [];
    for (let y = 2026; y >= 1920; y--) arr.push(y);
    return arr;
  }, []);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const cityNames = Object.keys(CITIES);

  // Turnstile ウィジェット（入力画面にいる間だけ描画。再入力時は貼り直してトークンを取り直す）
  useEffect(() => {
    if (pageState !== "input") return;

    let cancelled = false;

    const renderWidget = () => {
      if (cancelled || !window.turnstile || !turnstileRef.current) return;
      if (turnstileWidgetId.current) return;
      turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token) => setTurnstileToken(token),
        "expired-callback": () => setTurnstileToken(null),
        "error-callback": () => setTurnstileToken(null),
      });
    };

    let script: HTMLScriptElement | null = null;
    if (window.turnstile) {
      renderWidget();
    } else {
      script = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement("script");
        script.id = TURNSTILE_SCRIPT_ID;
        script.src = TURNSTILE_SCRIPT_SRC;
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", renderWidget);
    }

    return () => {
      cancelled = true;
      script?.removeEventListener("load", renderWidget);
      if (turnstileWidgetId.current && window.turnstile) {
        window.turnstile.remove(turnstileWidgetId.current);
      }
      turnstileWidgetId.current = null;
    };
  }, [pageState]);

  // 出生地の解決（入力が止まってから照合する。廃止された市区町村は必要になった時点で取りに行く）
  // 直前の解決結果は入力欄の onChange で捨てている（効果の中で同期的に setState しないため）
  useEffect(() => {
    const raw = birthPlace.trim();
    if (!raw) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      resolveBirthPlace(raw).then((resolution) => {
        if (!cancelled) setPlaceResolution(resolution);
      });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [birthPlace]);

  function handlePresetClick(
    preset: { label: string; hour: number; minute: number },
    unknown = false
  ) {
    setHour(String(preset.hour));
    setMinute(String(preset.minute));
    setIsTimeUnknown(unknown);
    setSelectedPreset(preset.label);
  }

  const isComplete =
    Boolean(year && month && day) &&
    (isTimeUnknown || (hour !== "" && minute !== "")) &&
    birthPlace.trim() !== "" &&
    placeResolution !== null &&
    birthPlacePayload(placeResolution, selectedPlace) !== null &&
    category !== "" &&
    deliveryChannel !== "" &&
    (deliveryChannel !== "email" || email.trim() !== "") &&
    turnstileToken !== null;

  function validate(place: BirthPlaceResolution | null): FieldErrors {
    const errors: FieldErrors = {};
    if (!year || !month || !day) errors.birth = "生年月日をお選びください。";
    if (!isTimeUnknown && (hour === "" || minute === ""))
      errors.time =
        "出生時刻をお選びください。わからない場合は「出生時刻がわからない方」からお選びいただけます。";
    if (birthPlace.trim() === "" || !place) errors.place = "出生地をご入力ください。";
    else if (place.kind === "ambiguous" && !selectedPlace)
      errors.place = "同じ名前の市区町村が複数あります。下からお選びください。";
    else if (place.kind === "unknown")
      errors.place =
        place.reason === "lookup-failed"
          ? "出生地を確認できませんでした。通信環境をご確認のうえ、再度お試しください。"
          : "この地名は見つかりませんでした。現在の市区町村名でお試しください（例：東京都西東京市、仙台市）。";
    if (category === "") errors.category = "テーマをひとつお選びください。";
    if (deliveryChannel === "") errors.delivery = "受取方法をお選びください。";
    if (deliveryChannel === "email") {
      if (email.trim() === "") errors.email = "メールアドレスをご入力ください。";
      else if (!EMAIL_PATTERN.test(email.trim()))
        errors.email = "メールアドレスの形式をご確認ください。";
    }
    if (!turnstileToken)
      errors.turnstile =
        "認証が完了していません。少しお待ちいただくか、ページを再読み込みしてお試しください。";
    return errors;
  }

  async function handleSubmit() {
    // 出生地の解決を待っているあいだに押し直されても、二重に送らない
    if (submitting.current) return;
    submitting.current = true;

    try {
      setFormError(null);

      // 入力直後に押された場合はデバウンス待ちの解決がまだ無いので、ここで確定させる
      const submitted = birthPlace.trim();
      let place = placeResolution;
      if (!place && submitted) {
        const resolved = await resolveBirthPlace(submitted);
        // 廃止された市区町村の取得中に出生地が書き換えられていたら、古い入力の結果は捨てる。
        // 画面に出ている地名と違う場所で計算させないため。
        if (birthPlaceRef.current.trim() !== submitted) return;
        place = resolved;
        setPlaceResolution(place);
      }

      const errors = validate(place);
      setFieldErrors(errors);
      if (Object.keys(errors).length > 0) return;

      // validate を通っていれば必ず値が決まる
      const placePayload = birthPlacePayload(place!, selectedPlace)!;

      setPageState("loading");

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${apiUrl}/api/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            year: Number(year),
            month: Number(month),
            day: Number(day),
            hour: isTimeUnknown ? 12 : Number(hour),
            minute: isTimeUnknown ? 0 : Number(minute),
            time_unknown: isTimeUnknown,
            // マスターで解決できたものは緯度経度も送り、バックエンドにジオコーディング
            // させない。辞書外は地名だけ（undefined は JSON から落ちる）
            birth_place: placePayload.birth_place,
            latitude: placePayload.latitude,
            longitude: placePayload.longitude,
            category,
            delivery_channel: deliveryChannel,
            email: deliveryChannel === "email" ? email.trim() : null,
            entry_source: entrySource || null,
            turnstile_token: turnstileToken,
          }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          handleApiError(response.status, (body as { detail?: unknown })?.detail);
          return;
        }

        setResult((await response.json()) as StartResponse);
        setPageState("result");
      } catch {
        setTurnstileToken(null);
        setFormError(
          "通信に失敗しました。電波状況をご確認のうえ、時間をおいて再度お試しください。"
        );
        setPageState("input");
      }
    } finally {
      submitting.current = false;
    }
  }

  /** ステータス別のエラー表示（400/403/422/429/500）。入力画面へ戻す。 */
  function handleApiError(status: number, detail: unknown) {
    setTurnstileToken(null); // トークンは使い切りのため、貼り直したウィジェットで取り直す
    setPageState("input");

    if (status === 400) {
      setFieldErrors({
        place:
          "地名を認識できませんでした。市区町村までの表記でお試しください（例：東京都世田谷区、仙台市）。",
      });
      return;
    }
    if (status === 403) {
      setFormError("認証に失敗しました。再読み込みしてお試しください。");
      return;
    }
    if (status === 422) {
      const errors = mapValidationErrors(detail);
      if (Object.keys(errors).length > 0) setFieldErrors(errors);
      else setFormError("ご入力内容をご確認のうえ、再度お試しください。");
      return;
    }
    if (status === 429) {
      setFormError("送信が集中しています。時間をおいてお試しください。");
      return;
    }
    setFormError(
      <>
        エラーが発生しました。時間をおいて再度お試しください。
        <br />
        解決しない場合は{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} style={{ textDecoration: "underline" }}>
          {CONTACT_EMAIL}
        </a>{" "}
        までご連絡ください。
      </>
    );
  }

  function handleRetry() {
    setResult(null);
    setFieldErrors({});
    setFormError(null);
    setPageState("input");
  }

  // ─── State: Loading ───────────────────────────────────
  if (pageState === "loading") {
    return (
      <>
        <Header variant="interior" />
        <main
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--c-cream)",
            padding: "80px 24px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                display: "inline-block",
                width: 40,
                height: 40,
                border: "2px solid var(--c-teal)",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                marginBottom: 24,
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p
              style={{
                fontFamily: "var(--font-shuei)",
                fontSize: "0.9375rem",
                color: "var(--c-teal)",
              }}
            >
              あなたのラグナを計算しています...
            </p>
            <p style={{ fontSize: "0.8125rem", color: "var(--c-teal-green)", marginTop: 8 }}>
              3,000年を超える星の知恵にアクセスしています
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // ─── State: Result（結果概要＋次アクション＋登録後の流れ） ───
  if (pageState === "result" && result) {
    const elmeUrl = buildElmeUrl(result, entrySource);
    const isLine = result.delivery_channel === "line";
    // 【仮】登録後の流れ（3ステップ）
    const steps = isLine
      ? [
          { title: "LINEで友だち追加", body: "上のボタンから追加してください。" },
          { title: "読み解きを準備", body: "ご入力の出生データをもとに用意します。" },
          { title: "1〜2日ほどでお届け", body: "準備ができ次第、LINEにお送りします。" },
        ]
      : [
          { title: "お申し込みを受け付けました", body: "ご入力ありがとうございます。" },
          { title: "読み解きを準備", body: "ご入力の出生データをもとに用意します。" },
          { title: "1〜2日ほどでお届け", body: "準備ができ次第、メールでお送りします。" },
        ];

    return (
      <>
        <Header variant="interior" />
        <main style={{ flex: 1, background: "var(--c-cream)" }}>
          <div
            className="max-w-lg min-[900px]:max-w-2xl"
            style={{ margin: "0 auto", padding: "72px 24px 96px" }}
          >
            {/* ラグナ名 + ゾディアック画像 */}
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <p style={{ fontSize: "0.8125rem", color: "var(--c-teal)", marginBottom: 12 }}>
                あなたのラグナ（上昇星座）は
              </p>

              <div
                style={{ width: 180, height: 180, margin: "0 auto 20px", position: "relative" }}
              >
                <Image
                  src={`/images/zodiac/${result.lagna_sign.toLowerCase()}.svg`}
                  alt={result.lagna_sign_ja}
                  fill
                  style={{ objectFit: "contain" }}
                />
              </div>

              <p
                style={{
                  fontFamily: "var(--font-shuei)",
                  fontSize: "1.75rem",
                  color: "var(--c-teal)",
                }}
              >
                {result.lagna_sign_ja}
              </p>
            </div>

            {/* サマリー */}
            <div
              style={{
                border: "1px solid var(--c-sage)",
                borderRadius: 10,
                padding: "28px 24px",
                marginBottom: 32,
                background: "var(--c-cream-2)",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-shuei)",
                  fontSize: "0.9375rem",
                  color: "var(--c-teal)",
                  lineHeight: 1.9,
                  whiteSpace: "pre-wrap",
                }}
              >
                {result.summary}
              </p>
            </div>

            {/* 時刻不明注記 */}
            {result.time_unknown && (
              <div
                style={{
                  background: "var(--c-blush)",
                  borderRadius: 10,
                  padding: "16px 20px",
                  marginBottom: 32,
                  fontSize: "0.8125rem",
                  color: "var(--foreground)",
                  lineHeight: 1.7,
                }}
              >
                ※ 出生時刻が不明のため、正午（12:00）で計算した概算です。正確な結果には出生時刻が必要です。
              </div>
            )}

            {/* 次アクション */}
            <div style={{ marginBottom: 48 }}>
              {isLine ? (
                <>
                  {/* 【仮】LINE 組の次アクション */}
                  <p
                    style={{
                      fontFamily: "var(--font-shuei)",
                      fontSize: "0.9375rem",
                      color: "var(--c-teal)",
                      lineHeight: 1.9,
                      textAlign: "center",
                      marginBottom: 20,
                    }}
                  >
                    続きの読み解きは、LINEでお届けします。
                  </p>
                  {elmeUrl ? (
                    <a href={elmeUrl} className="pillBtn">
                      LINEで受け取る
                    </a>
                  ) : (
                    <p
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--c-teal-green)",
                        textAlign: "center",
                        lineHeight: 1.8,
                      }}
                    >
                      LINE の登録先URLは準備中です。
                      {/* NEXT_PUBLIC_ELME_LINE_URL 未設定時（docs/22 STEP 7 で設定） */}
                    </p>
                  )}
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--c-teal-green)",
                      textAlign: "center",
                      lineHeight: 1.8,
                      marginTop: 14,
                    }}
                  >
                    24時間以内にご登録ください。それを過ぎた場合は、お手数ですが最初からご入力ください。
                  </p>
                </>
              ) : (
                <>
                  {/* 【仮】メール組の次アクション */}
                  <p
                    style={{
                      fontFamily: "var(--font-shuei)",
                      fontSize: "0.9375rem",
                      color: "var(--c-teal)",
                      lineHeight: 1.9,
                      textAlign: "center",
                      marginBottom: 12,
                    }}
                  >
                    以下のメールアドレスに送信します。
                  </p>
                  <p
                    style={{
                      fontSize: "0.9375rem",
                      color: "var(--c-teal-deep)",
                      textAlign: "center",
                      wordBreak: "break-all",
                    }}
                  >
                    {email}
                  </p>
                </>
              )}
            </div>

            {/* 登録後の流れ */}
            <div style={{ marginBottom: 40 }}>
              <p
                style={{
                  fontFamily: "var(--font-shuei)",
                  fontSize: "0.9375rem",
                  color: "var(--c-teal)",
                  fontWeight: 600,
                  textAlign: "center",
                  marginBottom: 24,
                }}
              >
                このあとの流れ
              </p>
              <ol style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {steps.map((step, i) => (
                  <li key={step.title} style={{ display: "flex", gap: 12 }}>
                    <span
                      style={{
                        flexShrink: 0,
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        border: "1px solid var(--c-teal)",
                        color: "var(--c-teal)",
                        fontSize: "0.75rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span>
                      <span
                        style={{
                          display: "block",
                          fontSize: "0.875rem",
                          color: "var(--c-teal)",
                          lineHeight: 1.6,
                        }}
                      >
                        {step.title}
                      </span>
                      <span
                        style={{
                          display: "block",
                          fontSize: "0.75rem",
                          color: "var(--c-teal-green)",
                          lineHeight: 1.8,
                          marginTop: 2,
                        }}
                      >
                        {step.body}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div style={{ textAlign: "center" }}>
              <button type="button" onClick={handleRetry} className="pillBtn">
                入力し直す
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // ─── State: Input Form ───────────────────────────────
  return (
    <>
      <Header variant="interior" />
      <main style={{ flex: 1, background: "var(--c-cream)" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "72px 24px 96px" }}>
          {/* ── ヒーロー（ロゴ + キャッチコピー）── */}
          <div style={{ marginBottom: 44 }}>
            <LogoWordmark
              style={{
                width: 220,
                height: "auto",
                color: "var(--c-plum)",
                display: "block",
                margin: "0 auto",
              }}
            />
            <p
              style={{
                fontSize: "1.25rem",
                color: "var(--c-teal-green)",
                textAlign: "center",
                margin: "18px 0",
              }}
            >
              ✶
            </p>
            {/* 【仮】キャッチコピー（確定はカズマ / docs/22 STEP 6-4） */}
            <p
              style={{
                fontFamily: "var(--font-shuei)",
                fontSize: "1rem",
                fontWeight: 600,
                color: "var(--c-teal)",
                lineHeight: 1.8,
                textAlign: "center",
              }}
            >
              生まれた瞬間の星の配置から
              <br />
              いまのあなたに必要な言葉を
            </p>
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--c-teal-green)",
                lineHeight: 1.9,
                textAlign: "center",
                marginTop: 16,
              }}
            >
              気になるテーマをひとつお選びいただくと、あなたのラグナ（上昇星座）をもとにした読み解きをお届けします。（無料・約1分）
            </p>
          </div>

          {/* ── 統一フォーム ── */}
          <div>
            {formError && (
              <div
                style={{
                  background: "#fff0f0",
                  border: "1px solid #fca5a5",
                  color: "#b91c1c",
                  borderRadius: 8,
                  padding: "12px 16px",
                  marginBottom: 24,
                  fontSize: "0.875rem",
                  lineHeight: 1.7,
                }}
              >
                {formError}
              </div>
            )}

            {/* 1. 生年月日 */}
            <fieldset style={{ border: "none", padding: 0, marginBottom: 24 }}>
              <legend style={legendStyle}>
                生年月日 <span style={{ color: "var(--c-pink)" }}>*</span>
              </legend>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <select value={year} onChange={(e) => setYear(e.target.value)} style={selectStyle}>
                  <option value="">年</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}年</option>
                  ))}
                </select>
                <select value={month} onChange={(e) => setMonth(e.target.value)} style={selectStyle}>
                  <option value="">月</option>
                  {months.map((m) => (
                    <option key={m} value={m}>{m}月</option>
                  ))}
                </select>
                <select value={day} onChange={(e) => setDay(e.target.value)} style={selectStyle}>
                  <option value="">日</option>
                  {days.map((d) => (
                    <option key={d} value={d}>{d}日</option>
                  ))}
                </select>
              </div>
              {fieldErrors.birth && <p style={fieldErrorStyle}>{fieldErrors.birth}</p>}
            </fieldset>

            {/* 2. 出生時刻 */}
            <fieldset style={{ border: "none", padding: 0, marginBottom: 24 }}>
              <legend style={legendStyle}>
                出生時刻 <span style={{ color: "var(--c-pink)" }}>*</span>
              </legend>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <select
                  value={hour}
                  onChange={(e) => {
                    setHour(e.target.value);
                    setSelectedPreset(null);
                    setIsTimeUnknown(false);
                  }}
                  style={selectStyle}
                >
                  <option value="">時</option>
                  {hours.map((h) => (
                    <option key={h} value={h}>{String(h).padStart(2, "0")}時</option>
                  ))}
                </select>
                <select
                  value={minute}
                  onChange={(e) => {
                    setMinute(e.target.value);
                    setSelectedPreset(null);
                    setIsTimeUnknown(false);
                  }}
                  style={selectStyle}
                >
                  <option value="">分</option>
                  {minutes.map((m) => (
                    <option key={m} value={m}>{String(m).padStart(2, "0")}分</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setShowTimePresets(!showTimePresets)}
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--c-teal)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span
                  style={{
                    transform: showTimePresets ? "rotate(90deg)" : "none",
                    display: "inline-block",
                    transition: "transform 0.15s",
                  }}
                >
                  ▶
                </span>
                出生時刻がわからない方
              </button>

              {showTimePresets && (
                <div style={{ marginTop: 10 }}>
                  <p style={{ fontSize: "0.75rem", color: "var(--c-teal-green)", marginBottom: 8 }}>
                    おおよその時間帯を選ぶと、時刻が自動でセットされます。
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 6,
                      marginBottom: 8,
                    }}
                  >
                    {TIME_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handlePresetClick(preset)}
                        style={{
                          height: 38,
                          borderRadius: 8,
                          border: "1px solid",
                          fontSize: "0.8125rem",
                          cursor: "pointer",
                          transition: "all 0.15s",
                          background:
                            selectedPreset === preset.label ? "var(--c-teal)" : "white",
                          color:
                            selectedPreset === preset.label ? "white" : "var(--c-teal-deep)",
                          borderColor:
                            selectedPreset === preset.label ? "var(--c-teal)" : "var(--border)",
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePresetClick(TIME_UNKNOWN_PRESET, true)}
                    style={{
                      width: "100%",
                      height: 38,
                      borderRadius: 8,
                      border: `2px dashed ${
                        selectedPreset === TIME_UNKNOWN_PRESET.label
                          ? "var(--c-teal)"
                          : "var(--border)"
                      }`,
                      fontSize: "0.8125rem",
                      cursor: "pointer",
                      background:
                        selectedPreset === TIME_UNKNOWN_PRESET.label
                          ? "var(--c-teal)"
                          : "#f8f8f4",
                      color:
                        selectedPreset === TIME_UNKNOWN_PRESET.label
                          ? "white"
                          : "var(--c-teal-green)",
                    }}
                  >
                    不明（正午で計算します）
                  </button>
                </div>
              )}
              {fieldErrors.time && <p style={fieldErrorStyle}>{fieldErrors.time}</p>}
            </fieldset>

            {/* 3. 出生地 */}
            <fieldset style={{ border: "none", padding: 0, marginBottom: 32 }}>
              <legend style={legendStyle}>
                出生地 <span style={{ color: "var(--c-pink)" }}>*</span>
              </legend>
              <input
                type="text"
                value={birthPlace}
                onChange={(e) => {
                  setBirthPlace(e.target.value);
                  birthPlaceRef.current = e.target.value;
                  setPlaceResolution(null);
                  setSelectedPlace(null);
                }}
                placeholder="例：仙台市、東京都世田谷区"
                list="start-city-list"
                className="placeholder:text-c-teal-green"
                style={{ ...selectStyle, padding: "0 16px" }}
              />
              <datalist id="start-city-list">
                {cityNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              <p style={helpTextStyle}>
                市区町村までで十分です。住所を貼り付けても、番地以下は送信しません。
                <br />
                昔の市町村名（例：保谷市）や緯経度（例：35.68, 139.76）でも調べられます。
              </p>

              {/* 一意に決まったとき。どこで計算するかを必ず見せる */}
              {placeResolution?.kind === "coords" && (
                <p style={placeConfirmStyle}>
                  <strong>{placeResolution.label}</strong> として計算します
                </p>
              )}
              {selectedPlace && (
                <p style={placeConfirmStyle}>
                  <strong>{municipalityLabel(selectedPlace)}</strong> として計算します
                </p>
              )}

              {/* 同名の市区町村が複数あるとき。黙ってどれかに寄せず、必ず選んでもらう */}
              {placeResolution?.kind === "ambiguous" && !selectedPlace && (
                <div style={{ marginTop: 10 }}>
                  <p style={{ fontSize: "0.75rem", color: "var(--c-teal-green)", marginBottom: 8 }}>
                    同じ名前の市区町村が{placeResolution.candidates.length}つあります。お選びください。
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {placeResolution.candidates.map((candidate) => (
                      <button
                        key={`${candidate.pref}${candidate.county}${candidate.name}`}
                        type="button"
                        onClick={() => setSelectedPlace(candidate)}
                        style={{
                          minHeight: 44,
                          padding: "10px 14px",
                          borderRadius: 8,
                          border: "1px solid var(--border)",
                          background: "white",
                          color: "var(--c-teal-deep)",
                          fontSize: "0.8125rem",
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        {municipalityLabel(candidate)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 解決できない地名は送信前に知らせる（送ってしまうと誤った場所で計算されるため） */}
              {placeResolution?.kind === "unknown" && !fieldErrors.place && (
                <p style={fieldErrorStyle}>
                  {placeResolution.reason === "lookup-failed"
                    ? "出生地を確認できませんでした。通信環境をご確認のうえ、少し時間をおいてお試しください。"
                    : "この地名は見つかりませんでした。現在の市区町村名でお試しください（例：東京都西東京市、仙台市）。"}
                </p>
              )}

              {fieldErrors.place && <p style={fieldErrorStyle}>{fieldErrors.place}</p>}
            </fieldset>

            {/* 4. 鑑定カテゴリー（7択・単一選択） */}
            <fieldset style={{ border: "none", padding: 0, marginBottom: 32 }}>
              <legend style={legendStyle}>
                いちばん気になっているテーマを、ひとつだけお選びください{" "}
                <span style={{ color: "var(--c-pink)" }}>*</span>
              </legend>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {CATEGORIES.map((item) => {
                  const selected = category === item.id;
                  return (
                    <label
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        minHeight: 44,
                        padding: "12px 14px",
                        borderRadius: 10,
                        border: "1px solid",
                        borderColor: selected ? "var(--c-teal)" : "var(--border)",
                        background: selected ? "var(--c-cream-2)" : "white",
                        cursor: "pointer",
                        transition: "border-color 0.15s, background 0.15s",
                      }}
                    >
                      <input
                        type="radio"
                        name="category"
                        value={item.id}
                        checked={selected}
                        onChange={() => setCategory(item.id)}
                        style={{ marginTop: 3, accentColor: "var(--c-teal)" }}
                      />
                      <span>
                        <span
                          style={{
                            display: "block",
                            fontSize: "0.875rem",
                            fontWeight: 500,
                            color: "var(--c-teal-deep)",
                            lineHeight: 1.5,
                          }}
                        >
                          {item.label}
                        </span>
                        <span
                          style={{
                            display: "block",
                            fontSize: "0.75rem",
                            color: "var(--c-teal-green)",
                            lineHeight: 1.7,
                            marginTop: 2,
                          }}
                        >
                          {item.sub}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
              {fieldErrors.category && <p style={fieldErrorStyle}>{fieldErrors.category}</p>}
            </fieldset>

            {/* 5. 受取方法 */}
            <fieldset style={{ border: "none", padding: 0, marginBottom: 32 }}>
              <legend style={legendStyle}>
                受取方法 <span style={{ color: "var(--c-pink)" }}>*</span>
              </legend>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {(
                  [
                    { id: "line", label: "LINEで受け取る" },
                    { id: "email", label: "メールで受け取る" },
                  ] as const
                ).map((item) => {
                  const selected = deliveryChannel === item.id;
                  return (
                    <label
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        minHeight: 44,
                        padding: "12px 14px",
                        borderRadius: 10,
                        border: "1px solid",
                        borderColor: selected ? "var(--c-teal)" : "var(--border)",
                        background: selected ? "var(--c-cream-2)" : "white",
                        cursor: "pointer",
                        transition: "border-color 0.15s, background 0.15s",
                      }}
                    >
                      <input
                        type="radio"
                        name="delivery_channel"
                        value={item.id}
                        checked={selected}
                        onChange={() => setDeliveryChannel(item.id)}
                        style={{ accentColor: "var(--c-teal)" }}
                      />
                      <span
                        style={{
                          fontSize: "0.8125rem",
                          fontWeight: 500,
                          color: "var(--c-teal-deep)",
                        }}
                      >
                        {item.label}
                      </span>
                    </label>
                  );
                })}
              </div>
              {fieldErrors.delivery && <p style={fieldErrorStyle}>{fieldErrors.delivery}</p>}

              {deliveryChannel === "email" && (
                <div style={{ marginTop: 16 }}>
                  <label
                    htmlFor="start-email"
                    style={{ ...legendStyle, display: "block" }}
                  >
                    メールアドレス <span style={{ color: "var(--c-pink)" }}>*</span>
                  </label>
                  <input
                    id="start-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="例：parama@example.com"
                    className="placeholder:text-c-teal-green"
                    style={{ ...selectStyle, padding: "0 16px" }}
                  />
                  {fieldErrors.email && <p style={fieldErrorStyle}>{fieldErrors.email}</p>}
                </div>
              )}
            </fieldset>

            {/* 6. Turnstile + 送信 */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <div ref={turnstileRef} />
            </div>
            {fieldErrors.turnstile && (
              <p style={{ ...fieldErrorStyle, textAlign: "center", marginBottom: 16 }}>
                {fieldErrors.turnstile}
              </p>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              className="pillBtn"
              style={isComplete ? undefined : { filter: "grayscale(0.7)", opacity: 0.7 }}
            >
              結果を見る
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
