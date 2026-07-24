"use client";

import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./Header.module.css";

interface HeaderProps {
  variant?: "home" | "interior";
  showCta?: boolean;
  /** home variant: 親のスクロール追跡から渡す */
  logoVisible?: boolean;
  ctaVisible?: boolean;
  ctaVariant?: "teal" | "citron" | "green" | "sage-light";
  /** true なら PC(900px〜)で左右いっぱいに広げる（トップページ用） */
  fluid?: boolean;
  /** 指定時は CTA を遷移せずこのコールバックを呼ぶ（同一ルート内で状態を戻す用途） */
  onCtaClick?: () => void;
}

export default function Header({
  variant = "interior",
  showCta = false,
  logoVisible,
  ctaVisible,
  ctaVariant = "teal",
  fluid = false,
  onCtaClick,
}: HeaderProps) {
  const isHome = variant === "home";

  const showLogoMark = isHome ? (logoVisible ?? false) : true;
  const showCtaButton = isHome ? (ctaVisible ?? false) : showCta;
  const ctaColor = isHome ? ctaVariant : "teal";

  const ctaColorStyle =
    ctaColor === "citron"
      ? { borderColor: "var(--c-citron)", color: "var(--c-citron)" }
      : ctaColor === "green"
      ? { borderColor: "var(--c-green)", color: "var(--c-green)" }
      : ctaColor === "sage-light"
      ? { borderColor: "var(--c-sage-light)", color: "var(--c-sage-light)" }
      : { borderColor: "var(--c-teal)", color: "var(--c-teal)" };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{ background: "transparent" }}
    >
      <div
        className={fluid ? `${styles.inner} ${styles.fluid}` : styles.inner}
      >
        {/* 左肩：ロゴマーク */}
        <div style={{ width: 36, height: 36 }}>
          <AnimatePresence>
            {showLogoMark && (
              <motion.div
                key="logo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {isHome ? (
                  <button
                    onClick={() =>
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }
                    aria-label="ページ先頭へ"
                    className="block w-9 h-9"
                  >
                    <Image
                      src="/images/logo-mark.svg"
                      alt="PARAMA"
                      width={36}
                      height={36}
                    />
                  </button>
                ) : (
                  <Link href="/" className="block w-9 h-9">
                    <Image
                      src="/images/logo-mark.svg"
                      alt="PARAMA"
                      width={36}
                      height={36}
                    />
                  </Link>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 右肩：Outline CTA */}
        <div style={{ marginTop: 1 }}>
          <AnimatePresence>
            {showCtaButton && (
              <motion.div
                key="cta"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <motion.div
                  animate={{
                    borderColor: ctaColorStyle.borderColor,
                    color: ctaColorStyle.color,
                  }}
                  transition={{ duration: 0.3 }}
                  style={{
                    border: "1px solid",
                    borderRadius: "9999px",
                    overflow: "hidden",
                    ...ctaColorStyle,
                  }}
                >
                  <Link
                    href="/free/lagna"
                    style={{
                      display: "block",
                      padding: "5px 12px",
                      fontSize: "0.645rem",
                      color: "inherit",
                      textDecoration: "none",
                      fontFamily: "var(--font-noto-sans-jp), sans-serif",
                      fontWeight: 500,
                      transition: "background 0.15s, color 0.15s",
                    }}
                    onClick={
                      onCtaClick
                        ? (e) => {
                            e.preventDefault();
                            onCtaClick();
                          }
                        : undefined
                    }
                    onMouseEnter={(e) => {
                      const el = e.currentTarget;
                      el.style.background = "var(--c-pink)";
                      el.style.color = "var(--c-ink)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget;
                      el.style.background = "transparent";
                      el.style.color = "inherit";
                    }}
                  >
                    ラグナを知る
                  </Link>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
