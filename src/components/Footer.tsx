import Link from "next/link";
import LogoWordmark from "./LogoWordmark";

export default function Footer() {
  return (
    <footer
      className="w-full"
      style={{
        background: "var(--c-lilac)",
        position: "relative",
        zIndex: 2,
      }}
    >
      <div className="max-w-lg min-[900px]:max-w-[1320px] mx-auto px-6 min-[900px]:px-[54px] pt-14">
        {/* メニューリンク */}
        <nav
          className="flex flex-col gap-4"
          style={{ marginBottom: 56, fontSize: "0.8125rem" }}
        >
          <Link
            href="/about"
            className="transition-opacity hover:opacity-60"
            style={{ color: "var(--c-cream)" }}
          >
            About
          </Link>
          <Link
            href="/free/lagna"
            className="transition-opacity hover:opacity-60"
            style={{ color: "var(--c-cream)" }}
          >
            ラグナ簡易判定
          </Link>
        </nav>

        {/* ワードマーク */}
        <LogoWordmark
          style={{
            width: 284,
            height: "auto",
            color: "var(--c-plum)",
            display: "block",
            margin: "0 auto",
            marginBottom: 41,
          }}
        />

        {/* 法務リンク（1行・センタリング） */}
        <nav
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "nowrap",
            justifyContent: "center",
            gap: 12,
            fontSize: "0.6875rem",
            marginBottom: 17,
          }}
        >
          {[
            { href: "/legal/tokushoho", label: "特定商取引法に基づく表記" },
            { href: "/legal/privacy", label: "プライバシーポリシー" },
            { href: "/legal/terms", label: "利用規約" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="transition-opacity hover:opacity-60 whitespace-nowrap"
              style={{ color: "var(--c-blush)" }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* コピーライト */}
        <p
          style={{
            color: "var(--c-plum-dark)",
            fontSize: "0.6875rem",
            textAlign: "center",
            marginBottom: 22,
          }}
        >
          ©2026 桂乃星術館
        </p>
      </div>
    </footer>
  );
}
