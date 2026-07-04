"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LogoWordmark from "@/components/LogoWordmark";

// ── 夜空マスクスタイル（citron 層の中央正方形の窓） ──────────
const WINDOW_PX = 152;
const HALF_WINDOW = WINDOW_PX / 2;
// 窓の上端: ワードマーク下端(89+63≈152px) + 48px gap
const WINDOW_TOP = 200;

const skyWindowMask: React.CSSProperties = {
  WebkitMaskImage:
    "linear-gradient(black, black), linear-gradient(black, black)",
  maskImage:
    "linear-gradient(black, black), linear-gradient(black, black)",
  WebkitMaskSize: `100% 100%, ${WINDOW_PX}px ${WINDOW_PX}px`,
  maskSize: `100% 100%, ${WINDOW_PX}px ${WINDOW_PX}px`,
  WebkitMaskPosition: `0 0, center ${WINDOW_TOP}px`,
  maskPosition: `0 0, center ${WINDOW_TOP}px`,
  WebkitMaskRepeat: "no-repeat, no-repeat",
  maskRepeat: "no-repeat, no-repeat",
  WebkitMaskComposite: "xor",
  maskComposite: "exclude",
};

// ── セクション共通コンポーネント ─────────────────────────────
interface ContentSectionProps {
  bg: string;
  enHeading: string;
  enColor: string;
  starColor: string;
  jaHeading: string;
  jaColor: string;
  body: string;
  bodyColor: string;
  sectionRef?: React.RefObject<HTMLElement | null>;
}

function ContentSection({
  bg, enHeading, enColor, starColor, jaHeading, jaColor, body, bodyColor, sectionRef,
}: ContentSectionProps) {
  return (
    <section
      ref={sectionRef}
      style={{ background: bg, position: "relative", zIndex: 2 }}
    >
      <div style={{ maxWidth: 512, margin: "0 auto", padding: "80px 24px" }}>
        <p
          style={{
            fontFamily: "var(--font-inria)",
            fontSize: "clamp(1.625rem, 8.85vw, 2.65rem)",
            lineHeight: 1,
            color: enColor,
            letterSpacing: "-0.01em",
            textAlign: "center",
          }}
        >
          {enHeading}
        </p>
        <p style={{ fontSize: "1.25rem", color: starColor, margin: "14px 0", textAlign: "center" }}>
          ✶
        </p>
        <p
          style={{
            fontFamily: "var(--font-maruminshinano)",
            fontSize: "0.9375rem",
            color: jaColor,
            lineHeight: 1.7,
            marginBottom: 28,
            textAlign: "center",
            fontWeight: 700,
          }}
        >
          {jaHeading}
        </p>
        <p
          style={{
            fontFamily: "var(--font-ryotext)",
            fontSize: "0.8125rem",
            color: bodyColor,
            lineHeight: 2,
            whiteSpace: "pre-wrap",
            padding: "0 22px",
          }}
        >
          {body}
        </p>
      </div>
    </section>
  );
}

// ── メインページ ─────────────────────────────────────────────
export default function Home() {
  const [heroInView, setHeroInView] = useState(true);
  const [insightsInView, setInsightsInView] = useState(false);
  const [ctaSectionInView, setCtaSectionInView] = useState(false);
  const [closingInView, setClosingInView] = useState(false);
  const [natureInView, setNatureInView] = useState(false);

  const heroRef = useRef<HTMLElement>(null);
  const insightsRef = useRef<HTMLElement>(null);
  const natureRef = useRef<HTMLElement>(null);
  const ctaSectionRef = useRef<HTMLElement>(null);
  const closingRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    const watch = (
      el: HTMLElement | null,
      cb: (e: IntersectionObserverEntry) => void,
      opts?: IntersectionObserverInit
    ) => {
      if (!el) return;
      const obs = new IntersectionObserver(([e]) => cb(e), opts);
      obs.observe(el);
      observers.push(obs);
    };

    watch(heroRef.current, (e) => {
      setHeroInView(e.isIntersecting);
      if (e.isIntersecting) setInsightsInView(false);
    }, {
      threshold: 0,
      rootMargin: "-1px 0px 0px 0px",
    });

    watch(insightsRef.current, (e) => {
      if (e.isIntersecting) setInsightsInView(true);
    }, {
      threshold: 0,
      rootMargin: "0px 0px -99% 0px",
    });

    watch(
      natureRef.current,
      (e) => setNatureInView(e.isIntersecting),
      { threshold: 0, rootMargin: "-50% 0px -50% 0px" }
    );

    watch(
      ctaSectionRef.current,
      (e) => setCtaSectionInView(e.isIntersecting),
      { threshold: 0, rootMargin: "-50% 0px -50% 0px" }
    );

    watch(
      closingRef.current,
      (e) => setClosingInView(e.isIntersecting),
      { threshold: 0, rootMargin: "-50% 0px -50% 0px" }
    );

    return () => observers.forEach((obs) => obs.disconnect());
  }, []);

  const logoVisible = insightsInView;
  const ctaVisible = insightsInView && (!ctaSectionInView || closingInView);
  const ctaVariant = natureInView ? "sage-light" : "green";

  return (
    <>
      {/* ── 固定夜空（全ページで背後に留まる） ── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <Image
          src="/images/hero-sky.jpg"
          fill
          alt=""
          style={{ objectFit: "cover" }}
          priority
        />
      </div>

      {/* ── 固定ヘッダー ── */}
      <Header
        variant="home"
        logoVisible={logoVisible}
        ctaVisible={ctaVisible}
        ctaVariant={ctaVariant}
      />

      {/* ══════════════════════════════════════
          Hero セクション
      ══════════════════════════════════════ */}
      <section
        ref={heroRef}
        style={{
          position: "relative",
          zIndex: 1,
          height: "100dvh",
          overflow: "hidden",
        }}
      >
        {/* ロゴマーク（citron 層と共にスクロールアウト） */}
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            zIndex: 30,
          }}
        >
          <Image
            src="/images/logo-mark.svg"
            alt="PARAMA"
            width={36}
            height={36}
          />
        </div>

        {/* citron 層（中央正方形が夜空の窓になる） */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "var(--c-citron)",
            zIndex: 20,
            ...skyWindowMask,
          }}
        />

        {/* ワードマーク（ロゴマーク下端+33px） */}
        <div
          style={{
            position: "absolute",
            top: 89,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            zIndex: 30,
            padding: "0 24px",
          }}
        >
          <LogoWordmark
            style={{ width: 284, height: "auto", color: "var(--c-plum)" }}
          />
        </div>

        {/* タグライン・CTA（窓の下方、絶対配置） */}
        <div
          style={{
            position: "absolute",
            top: WINDOW_TOP + WINDOW_PX + 28,
            left: 0,
            right: 0,
            zIndex: 30,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "0 28px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-maruminshinano)",
              color: "var(--c-violet)",
              fontSize: "1rem",
              lineHeight: 1,
            }}
          >
            星が描く地図を読み解き
            <br />
            本来の自分とつながる
          </p>

          <Link
            href="/free/lagna"
            style={{
              marginTop: 28,
              display: "inline-block",
              background: "var(--c-pink)",
              color: "var(--c-ink)",
              padding: "9px 20px",
              borderRadius: "9999px",
              fontSize: "0.75rem",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            ラグナを知る（無料・登録なし）
          </Link>

          <p
            style={{
              color: "var(--c-violet-2)",
              fontSize: "0.72rem",
              marginTop: 14,
            }}
          >
            生まれた日・時刻・場所を入力するだけ（約1分）
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════
          透明セクション（夜空を見せる）
      ══════════════════════════════════════ */}
      <section
        style={{
          height: "100dvh",
          position: "relative",
          zIndex: 2,
          background: "transparent",
        }}
      />

      {/* ══════════════════════════════════════
          Insights
      ══════════════════════════════════════ */}
      <ContentSection
        sectionRef={insightsRef}
        bg="var(--c-cream)"
        enHeading="Insights"
        enColor="var(--c-green-light)"
        starColor="var(--c-green)"
        jaHeading="パラマでわかること"
        jaColor="var(--c-green)"
        body={
          "インド占星術は、なぜそう感じ、そうしてしまうかを言語化するのが得意。\n自分自身や、置かれている状況を深く知りたいあなたに、そっと寄り添い、星からのまなざしをお届けします。"
        }
        bodyColor="var(--c-green)"
      />

      {/* ══════════════════════════════════════
          Timing
      ══════════════════════════════════════ */}
      <ContentSection
        bg="var(--c-blush)"
        enHeading="Timing"
        enColor="var(--c-teal-green)"
        starColor="var(--c-teal-green)"
        jaHeading="人生の流れと時期が読める"
        jaColor="var(--c-teal)"
        body={
          "いまがどんな時期なのかがわかります。引越し、転職、結婚 ── 時期予測の体系（ダシャー）が、動くタイミングの見当をつけてくれます。"
        }
        bodyColor="var(--c-teal)"
      />

      {/* ══════════════════════════════════════
          Nature
      ══════════════════════════════════════ */}
      <ContentSection
        sectionRef={natureRef}
        bg="var(--c-rose)"
        enHeading="Nature"
        enColor="var(--c-sage)"
        starColor="var(--c-sage)"
        jaHeading="自分の特性がわかる"
        jaColor="var(--c-sage-light)"
        body={
          "あなたらしい性格や性分、行動のパターンがどこから来るのか、読み解きます。自分の反応を、仕組みとして理解できるようになります。"
        }
        bodyColor="var(--c-sage-light)"
      />

      {/* ══════════════════════════════════════
          Wisdom
      ══════════════════════════════════════ */}
      <ContentSection
        bg="var(--c-blush)"
        enHeading="Wisdom"
        enColor="var(--c-teal-green)"
        starColor="var(--c-teal-green)"
        jaHeading="3,000年を超える知恵の体系"
        jaColor="var(--c-teal)"
        body={
          "先人によって磨かれてきた知の蓄積。思いつきではなく、検証を重ねてきた解釈に基づいています。"
        }
        bodyColor="var(--c-teal)"
      />

      {/* ══════════════════════════════════════
          まずはラグナを知る
      ══════════════════════════════════════ */}
      <section
        ref={ctaSectionRef}
        style={{
          background: "var(--c-cream)",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{ maxWidth: 512, margin: "0 auto", padding: "80px 24px" }}
        >
          <p
            style={{
              fontFamily: "var(--font-maruminshinano)",
              fontSize: "0.9375rem",
              color: "var(--c-green)",
              lineHeight: 1.7,
              marginBottom: 28,
              textAlign: "center",
              fontWeight: 700,
            }}
          >
            まずはラグナ（上昇星座）を<br />知ることから
          </p>

          <p
            style={{
              fontFamily: "var(--font-ryotext)",
              fontSize: "0.8125rem",
              color: "var(--c-green)",
              lineHeight: 2,
              whiteSpace: "pre-wrap",
              padding: "0 22px",
              marginBottom: 36,
              fontWeight: 500,
            }}
          >
            {"あなたの基本的な性質や能力が映し出されているのがラグナ。\n生まれた瞬間の東の地平線に昇っていた星座をそう呼んでいます。\n以下ではラグナだけでなく、太陽星座、月星座、月のナクシャトラもあわせてお調べします。\n生まれた日・時刻・場所を入力するだけで、すぐに結果が出ます。"}
          </p>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <Link
              href="/free/lagna"
              style={{
                display: "inline-block",
                background: "var(--c-pink)",
                color: "var(--c-ink)",
                padding: "9px 20px",
                borderRadius: "9999px",
                fontSize: "0.75rem",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              ラグナを知る（無料・登録なし）
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          クロージング夜空セクション
      ══════════════════════════════════════ */}
      <section
        ref={closingRef}
        style={{
          background: "#2d3b6a",
          position: "relative",
          zIndex: 2,
          padding: "240px 24px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* cta-sky.jpg 152×152 中央配置 */}
        <div
          style={{
            position: "relative",
            width: 152,
            height: 152,
            flexShrink: 0,
          }}
        >
          <Image
            src="/images/cta-sky.jpg"
            fill
            alt=""
            style={{ objectFit: "cover" }}
          />
        </div>
      </section>

      <Footer />
    </>
  );
}
