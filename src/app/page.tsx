"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LogoWordmark from "@/components/LogoWordmark";
import styles from "./page.module.css";

// ── 夜空マスクスタイル（citron 層の中央正方形の窓） ──────────
// 窓のサイズ・位置は page.module.css の .hero の CSS 変数で定義
// （モバイル: 152px / 窓上端 200px 相当。PC ではリキッドにスケール）
const skyWindowMask: React.CSSProperties = {
  WebkitMaskImage:
    "linear-gradient(black, black), linear-gradient(black, black)",
  maskImage:
    "linear-gradient(black, black), linear-gradient(black, black)",
  WebkitMaskSize: "100% 100%, var(--window-px) var(--window-px)",
  maskSize: "100% 100%, var(--window-px) var(--window-px)",
  WebkitMaskPosition: "0 0, center var(--window-top)",
  maskPosition: "0 0, center var(--window-top)",
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
  /** PC 2カラム時の見出し群の配置（モバイルでは無効） */
  align?: "left" | "right";
}

function ContentSection({
  bg, enHeading, enColor, starColor, jaHeading, jaColor, body, bodyColor, sectionRef,
  align = "left",
}: ContentSectionProps) {
  return (
    <section ref={sectionRef} className={styles.section} style={{ background: bg }}>
      <div
        className={
          align === "right"
            ? `${styles.secInner} ${styles.secRight}`
            : styles.secInner
        }
      >
        <div className={styles.secHead}>
          <p className={styles.enHeading} style={{ color: enColor }}>
            {enHeading}
          </p>
          <p className={styles.star} style={{ color: starColor }}>
            ✶
          </p>
          <p className={styles.jaHeading} style={{ color: jaColor }}>
            {jaHeading}
          </p>
        </div>
        <p className={styles.secBody} style={{ color: bodyColor }}>
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
      { threshold: 0, rootMargin: "0% 0px -95% 0px" }
    );

    watch(
      ctaSectionRef.current,
      (e) => setCtaSectionInView(e.isIntersecting),
      { threshold: 0, rootMargin: "0% 0px -95% 0px" }
    );

    watch(
      closingRef.current,
      (e) => setClosingInView(e.isIntersecting),
      { threshold: 0, rootMargin: "0% 0px -95% 0px" }
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
        className={styles.hero}
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
            top: "var(--edge-top)",
            left: "var(--edge-pad)",
            zIndex: 30,
          }}
        >
          <Image
            src="/images/logo-mark.svg"
            alt="Parama"
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
            top: "var(--wordmark-top)",
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            zIndex: 30,
            padding: "0 24px",
          }}
        >
          <LogoWordmark
            style={{
              width: "var(--wordmark-w)",
              height: "auto",
              color: "var(--c-plum)",
            }}
          />
        </div>

        {/* タグライン・CTA（窓の下方、絶対配置） */}
        <div
          style={{
            position: "absolute",
            top: "calc(var(--window-top) + var(--window-px) + var(--tagline-gap))",
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
          <p className={styles.tagline}>
            星が描く地図を読み解き
            <br />
            本来の自分とつながる
          </p>

          <Link
            href="/free/lagna"
            className="pillBtn"
            style={{ marginTop: 28 }}
          >
            ラグナを知る（無料・登録なし）
          </Link>

          <p className={styles.annotation}>
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
        align="left"
        bg="var(--c-cream)"
        enHeading="Insights"
        enColor="var(--c-green-light)"
        starColor="var(--c-green)"
        jaHeading="パラマでわかること"
        jaColor="var(--c-green)"
        body={
          "インド占星術は、なぜそう感じ、そうしてしまうかを言語化することが得意です。\n自分自身や、置かれている状況を深く知りたいあなたに、そっと寄り添い、星からのまなざしをお届けします。"
        }
        bodyColor="var(--c-green)"
      />

      {/* ══════════════════════════════════════
          Timing
      ══════════════════════════════════════ */}
      <ContentSection
        align="right"
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
        align="left"
        bg="var(--c-rose)"
        enHeading="Nature"
        enColor="#cfd9c9"
        starColor="#dae6d4"
        jaHeading="自分の特性がわかる"
        jaColor="#cfd9c9"
        body={
          "あなたらしい性格や性分、行動のパターンがどこから来るのか、読み解きます。自分の反応を、仕組みとしてとらえることができます。"
        }
        bodyColor="#dae6d4"
      />

      {/* ══════════════════════════════════════
          Wisdom
      ══════════════════════════════════════ */}
      <ContentSection
        align="right"
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
        <div className={styles.ctaInner}>
          <p className={styles.ctaHeading}>
            まずはラグナ（上昇星座）を<br />知ることから
          </p>

          <p className={styles.ctaBody}>
            {"あなたの基本的な性質や能力が映し出されているのがラグナ。\n生まれた瞬間の東の地平線に昇っていた星座をそう呼んでいます。\n生まれた日・時刻・場所を入力するだけで、すぐに結果が出せます。"}
          </p>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <Link href="/free/lagna" className="pillBtn">
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
        className={styles.closing}
        style={{
          background: "#2d3b6a",
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* 上テキスト（上アキの天地中央） */}
        <div className={styles.closingSpacer}>
          <p className={styles.closingText}>自分に出会う旅</p>
        </div>

        {/* cta-sky.jpg 中央配置（モバイル 152×152、PC はリキッド） */}
        <div
          className={styles.closingWindow}
          style={{
            position: "relative",
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

        {/* 下：✶（下アキの天地中央） */}
        <div className={styles.closingSpacer}>
          <p className={styles.closingText}>✶</p>
        </div>
      </section>

      <Footer />
    </>
  );
}
