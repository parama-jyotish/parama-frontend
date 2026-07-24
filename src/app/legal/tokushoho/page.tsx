import type { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "特定商取引法に基づく表記 | PARAMA",
};

const sections: { term: string; description: ReactNode }[] = [
  { term: "販売事業者", description: "中島一磨" },
  { term: "屋号", description: "桂乃星術館" },
  { term: "運営統括責任者", description: "中島一磨" },
  {
    term: "所在地",
    description: (
      <>
        〒530-0001
        <br />
        大阪府大阪市北区梅田1丁目1番3号　大阪駅前第3ビル11階2号室
      </>
    ),
  },
  {
    term: "電話番号",
    description:
      "電話番号につきましては、お客様からのご請求をいただき次第、遅滞なく電子メールにて開示いたします。ご請求は下記メールアドレス宛にお願いいたします。",
  },
  {
    term: "メールアドレス",
    description: (
      <a
        href="mailto:info@parama-jyotish.jp"
        className="text-foreground underline underline-offset-2 hover:opacity-70 transition-opacity"
      >
        info@parama-jyotish.jp
      </a>
    ),
  },
  {
    term: "販売価格",
    description:
      "現在は無料サービスのみを提供しております。有料サービスは今後提供開始予定です。提供開始の際には、各サービスページにて税込価格を表示いたします。",
  },
  {
    term: "商品代金以外の必要料金",
    description: "本サービスのご利用に伴う通信費は、お客様のご負担となります。",
  },
  {
    term: "支払方法",
    description:
      "有料サービスは今後提供開始予定です。提供開始の際に、対応する支払方法を本ページに記載いたします。",
  },
  {
    term: "支払時期",
    description:
      "有料サービスは今後提供開始予定です。提供開始の際に、本ページに記載いたします。",
  },
  {
    term: "サービス提供時期",
    description:
      "無料ラグナ診断：お客様が入力フォームを送信後、結果はオンライン上で即時に表示されます。",
  },
  {
    term: "返品・キャンセル",
    description:
      "サービスの性質上、鑑定結果の提供後における返金・返品には応じかねます。ただし、当方の責に帰すべき事由によりサービスの提供に瑕疵があった場合は、この限りではありません。",
  },
  {
    term: "鑑定結果について",
    description: (
      <div className="space-y-4">
        <p>
          本サービスで提供する鑑定結果は、インド占星術（ジョーティシュ）の古典体系に基づく解釈情報です。将来の出来事や特定の結果を保証するものではなく、自己理解の手がかりとしてご利用ください。鑑定結果の受け止め方には個人差があります。
        </p>
        <p>
          医療・法律・投資・その他専門的判断を要する事項については、必ず各分野の専門家にご相談ください。本サービスはこれらの専門的助言の代替となるものではありません。
        </p>
      </div>
    ),
  },
  {
    term: "動作環境",
    description:
      "本サービスは、最新版の主要ウェブブラウザ（Google Chrome、Safari、Microsoft Edge、Firefox）でのご利用を推奨いたします。",
  },
  {
    term: "免責事項",
    description:
      "通信回線・コンピュータ等の技術的制約に起因する事由により本サービスの提供に支障が生じた場合、および当方が必要と判断しシステムメンテナンス等のためサービスを一時停止する場合がございます。当方の故意または重大な過失による場合を除き、これらに関連して生じた損害について責任を負いかねます。",
  },
];

export default function TokushohoPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-background">
        <div className="max-w-2xl mx-auto px-6 py-12 sm:py-20">
          <h1 className="text-2xl font-normal text-c-teal mb-8 text-center">
            特定商取引法に基づく表記
          </h1>
          <div className="py-8 sm:py-10 px-[22px] text-c-teal-deep leading-relaxed font-ryotext text-[0.9375rem]">
            <p className="text-sm text-c-teal-deep mb-8">
              「特定商取引に関する法律」第11条に基づき、以下のとおり表示いたします。
            </p>
            <dl>
              {sections.map((section) => (
                <div key={section.term} className="py-6 first:pt-0 last:pb-0">
                  <dt className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-1.5">
                    {section.term}
                  </dt>
                  <dd>{section.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
