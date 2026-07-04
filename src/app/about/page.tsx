import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "About | PARAMA（パラマ）",
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
              fontSize: "clamp(2.75rem, 15vw, 4.5rem)",
              lineHeight: 1,
              color: "var(--c-green-light)",
              letterSpacing: "-0.01em",
              marginBottom: 14,
            }}
          >
            About
          </p>
          <p style={{ fontSize: "1.25rem", color: "var(--c-green)", marginBottom: 48 }}>
            ✶
          </p>

          {/* 本文（句点なしスタイル） */}
          <div
            style={{
              fontFamily: "var(--font-ryotext)",
              fontSize: "0.9375rem",
              color: "var(--c-green)",
              lineHeight: 2.1,
              display: "flex",
              flexDirection: "column",
              gap: 28,
            }}
          >
<p>
なぜ自分はうまくいかないのか、何かがしっくりこない——言葉にしようとしても、それが何なのかさえ、わからない
</p>
<p>
そんな思いに覚えがあるのなら、まず、ここまでたどり着けたあなたを「よくがんばってきたね」って褒めてあげてほしい。
</p>
<p>
ここは、立ち止まってもいい場所です。急ぐことも、答えを出すことも、いりません。
</p>
<p>
生まれた瞬間の、たった一度きりの星の配置から、あなたという存在の成り立ちを、ていねいに読み解いていきます。
</p>
<p>
すると、自分の感じやすさにも、心の揺れにも、ちゃんと理由があったのだと、少しずつわかってくる。良いとも悪いとも決めずに、ただ「そういうもの」として、静かに眺めてみます。
</p>
<p>
自分へ向けるまなざしが、やわらいでいくとき——動けないままだった日々は、もう、過去のものになり始めています。
</p>
<p>
あなたがずっと知りたかったことに、ようやく手が届くかもしれません。
</p>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
