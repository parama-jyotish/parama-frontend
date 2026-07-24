"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CITIES, findCity } from "@/data/cities";
import { LAGNA_RESULTS } from "@/data/lagna-results";

const TIME_PRESETS = [
  { label: "深夜", hour: 1, minute: 30 },
  { label: "明け方", hour: 4, minute: 30 },
  { label: "午前", hour: 9, minute: 0 },
  { label: "日中", hour: 13, minute: 30 },
  { label: "夕方", hour: 16, minute: 30 },
  { label: "夜間", hour: 21, minute: 0 },
];

const TIME_UNKNOWN_PRESET = { label: "不明（正午で計算）", hour: 12, minute: 0 };

type PageState = "input" | "loading" | "result";

interface ResultData {
  rashi_en: string;
  rashi: string;
  sun_rashi: string;
  moon_rashi: string;
  moon_nakshatra: string;
}

// ── スタイル定数 ──────────────────────────────────────────
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

const primaryBtn: React.CSSProperties = {
  width: "100%",
  height: 50,
  background: "var(--c-pink)",
  color: "var(--c-ink)",
  borderRadius: "9999px",
  fontSize: "1rem",
  fontWeight: 500,
  border: "none",
  cursor: "pointer",
};

export default function LagnaPage() {
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [city, setCity] = useState("");
  const [isTimeUnknown, setIsTimeUnknown] = useState(false);
  const [showTimePresets, setShowTimePresets] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const [pageState, setPageState] = useState<PageState>("input");
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  function handlePresetClick(
    preset: { label: string; hour: number; minute: number },
    unknown = false
  ) {
    setHour(String(preset.hour));
    setMinute(String(preset.minute));
    setIsTimeUnknown(unknown);
    setSelectedPreset(preset.label);
  }

  async function handleSubmit() {
    if (!year || !month || !day || hour === "" || minute === "" || !city) {
      setError("すべての項目を入力してください。");
      return;
    }

    setError(null);
    setPageState("loading");

    const coords = findCity(city);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: Number(year),
          month: Number(month),
          day: Number(day),
          hour: Number(hour),
          minute: Number(minute),
          latitude: coords.lat,
          longitude: coords.lng,
          timezone_offset: 9.0,
          time_unknown: isTimeUnknown,
        }),
      });

      if (!response.ok) {
        throw new Error("計算サーバーとの通信に失敗しました。");
      }

      const data = await response.json();
      const lagna = data.charts?.rashi?.lagna;

      if (!lagna?.rashi_en) {
        throw new Error("計算結果の取得に失敗しました。");
      }

      const planets: Array<{ planet: string; rashi: string; nakshatra?: { name: string } }> =
        data.charts?.rashi?.planets ?? [];

      const sunPlanet = planets.find((p) => p.planet === "Sun");
      const moonPlanet = planets.find((p) => p.planet === "Moon");

      setResult({
        rashi_en: lagna.rashi_en,
        rashi: lagna.rashi,
        sun_rashi: sunPlanet?.rashi ?? "—",
        moon_rashi: moonPlanet?.rashi ?? "—",
        moon_nakshatra: moonPlanet?.nakshatra?.name ?? "—",
      });
      setPageState("result");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "エラーが発生しました。時間をおいて再度お試しください。"
      );
      setPageState("input");
    }
  }

  function handleRetry() {
    setPageState("input");
    setResult(null);
    setError(null);
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
                fontFamily: "var(--font-ryotext)",
                fontSize: "0.9375rem",
                color: "var(--c-teal)",
              }}
            >
              あなたのラグナを計算しています...
            </p>
            <p style={{ fontSize: "0.8125rem", color: "var(--muted)", marginTop: 8 }}>
              3,000年を超える星の知恵にアクセスしています
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // ─── State: Result ───────────────────────────────────
  if (pageState === "result" && result) {
    const lagnaData = LAGNA_RESULTS[result.rashi_en];
    const displayName = lagnaData
      ? `${lagnaData.name_ja}（${lagnaData.sanskrit}）`
      : result.rashi;

    return (
      <>
        <Header variant="interior" showCta onCtaClick={handleRetry} />
        <main
          style={{
            flex: 1,
            background: "var(--c-cream)",
          }}
        >
          <div
            style={{
              maxWidth: 672,
              margin: "0 auto",
              padding: "72px 24px 96px",
            }}
          >
            {/* ラグナ名 + ゾディアック画像 */}
            <div
              style={{
                textAlign: "center",
                marginBottom: 40,
              }}
            >
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--c-teal)",
                  marginBottom: 12,
                }}
              >
                あなたのラグナ（上昇星座）は
              </p>

              <div
                style={{
                  width: 180,
                  height: 180,
                  margin: "0 auto 20px",
                  position: "relative",
                }}
              >
                <Image
                  src={`/images/zodiac/${result.rashi_en.toLowerCase()}.svg`}
                  alt={result.rashi}
                  fill
                  style={{ objectFit: "contain" }}
                />
              </div>

              <p
                style={{
                  fontFamily: "var(--font-maruminshinano)",
                  fontSize: "1.75rem",
                  color: "var(--c-teal)",
                  marginBottom: 4,
                }}
              >
                {result.rashi}
              </p>
              {lagnaData && (
                <p
                  style={{
                    fontFamily: "var(--font-maruminshinano)",
                    fontSize: "0.8125rem",
                    color: "var(--c-teal-green)",
                  }}
                >
                  {lagnaData.sanskrit}
                </p>
              )}
            </div>

            {/* ラグナ説明文 */}
            <div
              style={{
                border: "1px solid var(--c-sage)",
                borderRadius: 10,
                padding: "28px 24px",
                marginBottom: 32,
              }}
            >
              {lagnaData?.description ? (
                <p
                  style={{
                    fontFamily: "var(--font-ryotext)",
                    fontSize: "0.9375rem",
                    color: "var(--c-teal)",
                    lineHeight: 1.625,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {lagnaData.description}
                </p>
              ) : (
                <p style={{ color: "var(--muted)", textAlign: "center", fontSize: "0.875rem" }}>
                  結果テキストは準備中です。
                </p>
              )}
            </div>

            {/* 太陽・月・ナクシャトラ */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                marginLeft: 25,
                marginRight: 25,
                marginBottom: 40,
              }}
            >
              {[
                { label: "太陽星座", value: result.sun_rashi },
                { label: "月星座", value: result.moon_rashi },
                { label: "月のナクシャトラ", value: result.moon_nakshatra },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    paddingBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      color: "var(--c-teal)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      borderBottom: "1px solid var(--border)",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-ryotext)",
                      fontSize: "0.9375rem",
                      color: "var(--c-teal)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* 時刻不明注記 */}
            {isTimeUnknown && (
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
                ※ 出生時刻が不明のため、正午（12:00）で計算しています。正確な結果には出生時刻が必要です。
              </div>
            )}

            {/* もっと詳しく知りたい方へ */}
            <div style={{ marginBottom: 40, textAlign: "center" }}>
              <p
                style={{
                  fontFamily: "var(--font-maruminshinano)",
                  fontSize: "0.9375rem",
                  color: "var(--c-teal)",
                  marginBottom: 8,
                }}
              >
                もっと詳しく知りたい方へ
              </p>
              <p style={{ fontSize: "0.8125rem", color: "var(--c-teal-green)", lineHeight: 1.7 }}>
                詳しい鑑定メニューは近日公開予定です。
              </p>
            </div>

            {/* もう一度計算するボタン */}
            <div style={{ textAlign: "center" }}>
              <button
                onClick={handleRetry}
                style={primaryBtn}
              >
                もう一度計算する
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
        <div
          style={{
            maxWidth: 480,
            margin: "0 auto",
            padding: "72px 24px 96px",
          }}
        >
          {/* ページタイトル */}
          <div style={{ marginBottom: 40 }}>
            <p
              style={{
                fontFamily: "var(--font-inria)",
                fontSize: "clamp(1.625rem, 8.85vw, 2.65rem)",
                lineHeight: 1,
                color: "var(--c-green-light)",
                letterSpacing: "-0.01em",
                textAlign: "center",
              }}
            >
              Lagna
            </p>
            <p style={{ fontSize: "1.25rem", color: "var(--c-green)", textAlign: "center", margin: "14px 0" }}>
              ✶
            </p>
            <p
              style={{
                fontFamily: "var(--font-maruminshinano)",
                fontSize: "0.9375rem",
                color: "var(--c-teal)",
                lineHeight: 1.7,
                marginLeft: 48,
                marginRight: 48,
              }}
            >
              あなたが生まれた瞬間、東の地平線に昇っていた星座を調べます。
            </p>
          </div>

          {/* フォームカード */}
          <div
            style={{
              borderRadius: 16,
              padding: "28px 24px",
            }}
          >
            {/* エラー */}
            {error && (
              <div
                style={{
                  background: "#fff0f0",
                  border: "1px solid #fca5a5",
                  color: "#b91c1c",
                  borderRadius: 8,
                  padding: "12px 16px",
                  marginBottom: 24,
                  fontSize: "0.875rem",
                }}
              >
                {error}
              </div>
            )}

            {/* ── 生年月日 ── */}
            <fieldset style={{ border: "none", padding: 0, marginBottom: 24 }}>
              <legend
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--c-teal-dark)",
                  marginBottom: 10,
                  fontWeight: 500,
                }}
              >
                生年月日{" "}
                <span style={{ color: "var(--c-pink)" }}>*</span>
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
            </fieldset>

            {/* ── 出生時刻 ── */}
            <fieldset style={{ border: "none", padding: 0, marginBottom: 24 }}>
              <legend
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--c-teal-dark)",
                  marginBottom: 10,
                  fontWeight: 500,
                }}
              >
                出生時刻{" "}
                <span style={{ color: "var(--c-pink)" }}>*</span>
              </legend>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
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
                <span style={{ transform: showTimePresets ? "rotate(90deg)" : "none", display: "inline-block", transition: "transform 0.15s" }}>
                  ▶
                </span>
                出生時刻がわからない方
              </button>

              {showTimePresets && (
                <div style={{ marginTop: 10 }}>
                  <p style={{ fontSize: "0.75rem", color: "var(--c-teal-green)", marginBottom: 8 }}>
                    おおよその時間帯を選ぶと、時刻が自動でセットされます。
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
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
                            selectedPreset === preset.label
                              ? "var(--c-teal)"
                              : "white",
                          color:
                            selectedPreset === preset.label
                              ? "white"
                              : "var(--c-teal-deep)",
                          borderColor:
                            selectedPreset === preset.label
                              ? "var(--c-teal)"
                              : "var(--border)",
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
                      border: `2px dashed ${selectedPreset === TIME_UNKNOWN_PRESET.label ? "var(--c-teal)" : "var(--border)"}`,
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
            </fieldset>

            {/* ── 出生地 ── */}
            <fieldset style={{ border: "none", padding: 0, marginBottom: 32 }}>
              <legend
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--c-teal-dark)",
                  marginBottom: 10,
                  fontWeight: 500,
                }}
              >
                出生地{" "}
                <span style={{ color: "var(--c-pink)" }}>*</span>
              </legend>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="例：東京、大阪、福岡"
                list="city-list"
                className="placeholder:text-c-teal-green"
                style={{
                  ...selectStyle,
                  padding: "0 16px",
                }}
              />
              <datalist id="city-list">
                {cityNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--c-teal-green)",
                  marginTop: 6,
                }}
              >
                一覧にない都市は、最も近い都市名を入力してください。
              </p>
            </fieldset>

            {/* 送信 */}
            <button
              type="button"
              onClick={handleSubmit}
              style={primaryBtn}
            >
              計算する
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
