import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PARAMA（パラマ）| インド占星術で自分らしさの手がかりを",
  description:
    "3,000年以上の歴史を持つインド占星術（ジョーティシュ）で、あなたの本質と人生の流れを読み解きます。まずは無料のラグナ診断から。",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "PARAMA（パラマ）| インド占星術",
    description:
      "3,000年以上の歴史を持つインド占星術で、あなたの本質と人生の流れを読み解きます。",
    url: "https://parama-jyotish.jp",
    siteName: "インド占星術パラマ",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PARAMA（パラマ）| インド占星術",
    description:
      "3,000年以上の歴史を持つインド占星術で、あなたの本質と人生の流れを読み解きます。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} h-full antialiased`}>
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/ijv0xyz.css" />
        <style>{`
          :root {
            --c-citron: #d6db89;
            --c-cream: #f4f2c9;
            --c-cream-2: #f8f6ed;
            --c-blush: #ffd2d5;
            --c-rose: #cd849d;
            --c-lilac: #a08ccb;
            --c-plum: #755d8f;
            --c-plum-dark: #69537e;
            --c-violet: #583bc2;
            --c-violet-2: #5841bb;
            --c-ink: #311c7e;
            --c-pink: #d493a9;
            --c-green: #5c9c78;
            --c-green-light: #97bf95;
            --c-teal-green: #7fa999;
            --c-teal: #3e8a7a;
            --c-teal-dark: #3b8374;
            --c-teal-deep: #2f685c;
            --c-sage: #c6d2bf;
            --c-sage-light: #d3e1cc;
          }
        `}</style>
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
