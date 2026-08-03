import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "About | Parama（パラマ）",
  description:
    "インド占星術パラマについて。3,000年以上の歴史を持つジョーティシュで、自分らしさの手がかりを見つけるサービスです。",
};

export default function AboutPage() {
  return (
    <>
      <Header variant="interior" showCta />

      <main
        style={{ background: "var(--c-cream)", flex: 1 }}
      >
        <div style={{ maxWidth: 512, margin: "0 auto", padding: "80px 24px 96px" }}>
          {/* 英字見出し */}
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
            About
          </p>
          <p style={{ fontSize: "1.25rem", color: "var(--c-green)", textAlign: "center", margin: "14px 0" }}>
            ✶
          </p>

          {/* 本文（句点なしスタイル） */}
          <div
            style={{
              fontFamily: "var(--font-ryotext)",
              fontSize: "0.9375rem",
              color: "var(--c-teal-deep)",
              lineHeight: 2.1,
              display: "flex",
              flexDirection: "column",
              gap: 28,
              padding: "0 22px",
            }}
          >
<p>
「なぜ自分はうまくいかないのか、何かがしっくりこない——言葉にしようとしても、それが何なのかさえ、わからない」
</p>
<p>
もし、そんな夜を過ごした覚えがあるなら、がんばってきたあなたを、まずはねぎらいたい。
</p>
<p>
ここは一旦立ち止まってもいい場所。評価されることも、急がされることも、ありません。
</p>
<p>
あなたが生まれた瞬間の、たった一度きりの星の配置から、あなたという存在の成り立ちを、ていねいに読み解いていきます。
</p>
<p>
自分の感じやすさにも、心の揺れにも、ちゃんと理由があったのだと、分かります。良いとも、悪いとも決めつけず、ただ「そういうもの」として、静かに眺めてみる。
</p>
<p>
そうして、自分に向けるまなざしが、やわらぐとき——動けなかった日々に、少しずつ変化が現れてきます。
</p>
<p>
あなたがずっと知りたかったことに、ようやくたどり着けるかも知れません。
</p>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
