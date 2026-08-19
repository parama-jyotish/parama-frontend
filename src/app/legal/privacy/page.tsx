import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "プライバシーポリシー | Parama",
};

/*
  【仮】Phase.2 対応版（v3）。確定はカズマ（docs/22 STEP 9）。
  原案: 開発/法務関連/PARAMA_プライバシーポリシーv3(Phase2実装反映案).md（2026-08-07・実装照合済み）

  原案から修正した箇所（2026-08-20・一次情報で裏取り）:
    Resend, Inc.      → Plus Five Five, Inc.（DPA 本文と Data Importer 欄に明記。
                        「Resend」はサービス名であり法人名ではない）
    Anthropic, Inc.   → Anthropic PBC（商用規約「Anthropic, PBC if Customer resides
                        anywhere else」。日本からの利用はこちらに該当）
    株式会社ミエルカ    → 株式会社ミショナ（L Message 利用規約「L Message 株式会社ミショナが
                        提供する…」。「ミエルカ」の表記は同社サイトに存在しない）

  ⚠ 未検証: OpenAI, L.L.C. の法人格表記。openai.com がボット判定により到達できず
     一次情報を確認できていない。公開前に確認すること（docs/22 §3-2）。

  ⚠ 本ポリシーは運用義務を生む。第11項で「お届けから6か月で自動消去」と明示しているため、
     H-4 バッチ（毎日3時）の停止はポリシー違反になる（docs/22 STEP 9-3）。
*/
export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-background">
        <div className="max-w-lg min-[900px]:max-w-2xl mx-auto px-6 py-12 sm:py-20">
          <h1 className="text-2xl font-normal text-c-teal mb-8 text-center">
            プライバシーポリシー
          </h1>
          <div className="py-8 sm:py-10 px-[22px] text-c-teal-deep leading-relaxed space-y-8 font-ryotext text-[0.9375rem]">
            <p>
              桂乃星術館（以下「当サービス」といいます）は、インド占星術（ジョーティシュ）に基づく鑑定サービス「インド占星術パラマ（PARAMA）」（以下「本サービス」といいます）を提供するにあたり、ご利用者の個人情報の保護を重要な責務と考えています。本ポリシーは、本サービスにおける個人情報の取得、利用、管理に関する方針を定めるものです。
            </p>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                1. 個人情報の定義
              </h2>
              <p>
                本ポリシーにおいて「個人情報」とは、個人情報の保護に関する法律（以下「個人情報保護法」といいます）第2条第1項に定める個人情報を指します。具体的には、氏名、生年月日、メールアドレス、その他の記述等により特定の個人を識別することができる情報、および他の情報と容易に照合することができ、それにより特定の個人を識別することができる情報をいいます。
              </p>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                2. 鑑定のために必要な情報について
              </h2>
              <p className="mb-4">
                本サービスでは、インド占星術の計算（ホロスコープの作成および分析）にあたり、生年月日・出生時刻・出生地をお預かりします。これらは天体配置の計算に不可欠であり、鑑定の目的以外には使用せず、氏名・住所等と紐づけて第三者に提供することはありません。取り扱いは、ご利用の機能によって以下のとおり異なります。
              </p>

              <h3 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mt-5 mb-2">
                2-1. 無料ラグナ診断（その場で結果を表示する診断）をご利用いただく場合
              </h3>
              <p className="mb-4">
                ご入力いただいた生年月日・出生時刻・出生地は、ラグナの計算にのみ使用します。これらをサーバーやデータベースに保存することはなく、計算結果の表示後、ブラウザを離れた時点で残りません。氏名・メールアドレス等の連絡先も取得しません。
              </p>

              <h3 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mt-5 mb-2">
                2-2. メールまたはLINEで鑑定結果を受け取る場合
              </h3>
              <p className="mb-4">
                結果をメールまたはLINEで受け取るお申し込みをされた場合、計算と結果のお届けのために、出生データを当サービスのデータベースに保存します。
              </p>
              <p className="mb-4">
                お申し込みのみで受け取り手続き（送信先メールの確定またはLINE登録）が完了しなかった場合、ご入力から24時間が経過した時点で、生年月日・出生時刻・出生地・緯度経度などの機微な情報を自動的に消去します。消去後は、サービス改善のための統計を目的として、個人を特定できない情報（おおよその年代・ラグナの星座・流入元・処理状態）のみを保持します。
              </p>
              <p>
                受け取り手続きを完了された場合は、鑑定結果の作成・お届けのために、出生データおよびLINE登録情報（LINEユーザー識別子・LINE表示名）を保管します。保管期間については第11項をご覧ください。
              </p>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                3. 取得する個人情報の項目
              </h2>
              <p className="mb-3">
                本サービスでは、第2項の出生データに加え、次の情報を取得することがあります。
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>メールアドレス</li>
                <li>
                  LINEで結果を受け取るお申し込みの場合：LINEユーザー識別子およびLINEの表示名（LINE公式アカウントの友だち追加の際に、後述の委託先を通じて取得されます）
                </li>
                <li>ご関心のカテゴリー（鑑定内容の傾向を絞り込むための選択項目）</li>
                <li>お問い合わせフォームにご記入いただいた内容</li>
                <li>
                  有料鑑定をご購入の際の決済情報（決済代行業者を経由するため、当サービスはクレジットカード番号自体を保有しません）
                </li>
              </ul>
              <p className="mt-3">
                このほか、サービス改善のための統計として、おおよその年代・流入元・ラグナの星座など、特定の個人を識別できない情報を取得する場合があります。
              </p>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                4. 利用目的
              </h2>
              <p className="mb-3">
                当サービスは、取得した個人情報を以下の目的のために利用します。
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>鑑定サービスの提供および結果のご案内</li>
                <li>メールまたはLINEによる鑑定結果のお届け</li>
                <li>AIを用いた鑑定文の生成（第5項をご参照ください）</li>
                <li>メールマガジンおよびサービスに関するお知らせの配信</li>
                <li>お問い合わせへの対応</li>
                <li>本サービスの品質向上およびコンテンツ改善のための統計分析</li>
                <li>利用規約に違反する行為への対応</li>
                <li>法令に基づく対応</li>
              </ul>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                5. AI（人工知能）による処理について
              </h2>
              <p className="mb-3">
                本サービスは、鑑定文の生成のために、Anthropic社（Claude
                API）およびOpenAI社（OpenAI
                API）のAPIサービスを利用します。通常はAnthropic社のサービスを使用し、一時的な障害等により生成できなかった場合に限り、OpenAI社のサービスで自動的に再試行します。これらの処理にあたり、鑑定計算の結果やそれに基づくテキストを送信する場合がありますが、氏名・メールアドレス等の連絡先は送信しません。
              </p>
              <p>
                両社は、APIを通じて送信されたデータをモデルの学習目的に使用しないことを利用規約で定めています。なお、不正利用の監視等の目的で、各社の定めにより一定期間データが保持されたのち削除されます。両社は第7項の委託先として記載しています。
              </p>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                6. 第三者提供について
              </h2>
              <p className="mb-3">
                当サービスは、ご利用者の個人情報を、ご本人の同意を得ることなく第三者に提供することはありません。ただし、次の各号のいずれかに該当する場合はこの限りではありません。
              </p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>法令に基づく場合</li>
                <li>
                  人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき
                </li>
                <li>
                  公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき
                </li>
                <li>
                  国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがあるとき
                </li>
              </ol>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                7. 個人情報の取扱いの委託について
              </h2>
              <p className="mb-3">
                当サービスは、サービスの運営にあたり、以下の事業者に個人情報の取扱いを委託しています。
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 font-medium text-c-teal-deep">
                        委託先
                      </th>
                      {/* 375px では「アメリカ合衆国」が1文字ずつ縦に折り返されるため折返しを禁じる */}
                      <th className="text-left py-2 pr-4 font-medium text-c-teal-deep whitespace-nowrap">
                        所在地
                      </th>
                      <th className="text-left py-2 font-medium text-c-teal-deep">
                        委託する業務の内容
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="py-2 pr-4">Supabase, Inc.</td>
                      <td className="py-2 pr-4 whitespace-nowrap">アメリカ合衆国</td>
                      <td className="py-2">
                        データベースおよび認証基盤の提供
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Railway Corp.</td>
                      <td className="py-2 pr-4 whitespace-nowrap">アメリカ合衆国</td>
                      <td className="py-2">バックエンドサーバーの提供</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Vercel Inc.</td>
                      <td className="py-2 pr-4 whitespace-nowrap">アメリカ合衆国</td>
                      <td className="py-2">フロントエンド配信基盤の提供</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Cloudflare, Inc.</td>
                      <td className="py-2 pr-4 whitespace-nowrap">アメリカ合衆国</td>
                      <td className="py-2">
                        DNS・ネットワーク基盤の提供、および不正送信防止（ボット判定）の実施
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">株式会社ミショナ</td>
                      <td className="py-2 pr-4 whitespace-nowrap">日本</td>
                      <td className="py-2">
                        LINE公式アカウントの友だち登録・メッセージ配信の仲介（「L
                        Message（エルメ）」）
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">LINEヤフー株式会社</td>
                      <td className="py-2 pr-4 whitespace-nowrap">日本</td>
                      <td className="py-2">
                        LINE公式アカウントによるメッセージ配信基盤（Messaging
                        API）の提供
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Plus Five Five, Inc.</td>
                      <td className="py-2 pr-4 whitespace-nowrap">アメリカ合衆国</td>
                      <td className="py-2">
                        メール配信基盤の提供（「Resend」）
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">MailerLite Limited</td>
                      <td className="py-2 pr-4 whitespace-nowrap">アイルランド</td>
                      <td className="py-2">
                        メールマガジン配信および顧客管理（メールでの受け取りを選択された方が対象）
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Anthropic PBC</td>
                      <td className="py-2 pr-4 whitespace-nowrap">アメリカ合衆国</td>
                      <td className="py-2">鑑定文の生成（AI処理）</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">OpenAI, L.L.C.</td>
                      <td className="py-2 pr-4 whitespace-nowrap">アメリカ合衆国</td>
                      <td className="py-2">
                        鑑定文の生成（AI処理。Anthropic社のサービスが一時的に利用できない場合の予備）
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-4">
                各委託先との間では、データ処理契約（DPA）を締結し、定期的に各社の安全管理体制および再委託先の状況を確認することで、必要かつ適切な監督を行います。
              </p>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                8. 外国にある第三者への個人情報の提供について
              </h2>
              <p className="mb-3">
                前項の委託先のうち、日本国外に所在する事業者（Supabase, Inc. ／
                Railway Corp. ／ Vercel Inc. ／ Cloudflare, Inc. ／ Plus Five
                Five, Inc. ／ MailerLite Limited ／ Anthropic PBC ／ OpenAI,
                L.L.C.）への個人情報の取扱いの委託は、個人情報保護法第28条にいう「外国にある第三者への個人データの提供」に該当します。
              </p>
              <p className="mb-3">
                各委託先の所在国における個人情報の保護に関する制度については、個人情報保護委員会のウェブサイト（
                <a
                  href="https://www.ppc.go.jp/personalinfo/legal/kaiseihogohou/#gaikoku"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-c-teal underline underline-offset-2 hover:opacity-70 transition-opacity break-all"
                >
                  https://www.ppc.go.jp/personalinfo/legal/kaiseihogohou/#gaikoku
                </a>
                ）にて公表されている情報をご参照ください。
              </p>
              <p>
                各委託先は、SOC 2、ISO 27001、GDPRなど国際的に認められた情報セキュリティ・個人情報保護の基準に準拠しており、当サービスとの間で締結したデータ処理契約（標準契約条項を含む）に基づいて個人情報を取り扱います。当サービスは、各委託先が公開するトラストセンター等を通じて、その実施状況を定期的に確認します。
              </p>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                9. Cookie およびアクセス解析について
              </h2>
              <p>
                当サービスは、本ポリシー制定時点においては Cookie
                を用いたアクセス解析ツール（Google Analytics
                等）を導入していません。将来これらを導入する場合には、本ポリシーを改定し、サイト上で告知します。
              </p>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                10. 安全管理措置
              </h2>
              <p className="mb-3">
                当サービスは、個人情報への不正アクセス、紛失、改ざん、漏えい等を防止するため、以下の措置を講じています。
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  ウェブサイトと利用者端末との間の通信は SSL/TLS
                  により暗号化しています
                </li>
                <li>
                  データベースおよび認証情報へのアクセスは、必要最小限の権限を有する者のみに制限しています
                </li>
                <li>
                  委託先事業者の選定にあたっては、十分な安全管理体制を備えていることを確認しています
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                11. 個人情報の保有期間および削除
              </h2>
              <p className="mb-3">
                当サービスは、個人情報を以下の期間保有します。
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <span className="font-bold">
                    その場で結果を表示する無料ラグナ診断
                  </span>
                  ：保存しません
                </li>
                <li>
                  <span className="font-bold">
                    メール／LINEで結果を受け取るお申し込みのうち、受取手続きが完了しなかったもの
                  </span>
                  ：入力から24時間後に、生年月日・出生時刻・出生地などの機微な情報を自動的に消去します。消去後は、個人を特定できない統計用の情報（おおよその年代・ラグナの星座・流入元・状態）のみを保持します
                </li>
                <li>
                  <span className="font-bold">
                    鑑定結果をお届けした方の出生データおよび連絡先
                  </span>
                  ：お届けから6か月が経過した時点で、生年月日・出生時刻・出生地・緯度経度・メールアドレス・LINEユーザー識別子・LINE表示名を自動的に消去します。消去後は、個人を特定できない統計用の情報（おおよその年代・ラグナの星座・流入元・状態）のみを保持します
                </li>
                <li>
                  <span className="font-bold">
                    削除のご請求・LINEブロック・配信停止をいただいた場合
                  </span>
                  ：原則として速やかに、または法令上必要な記録を除き消去します
                </li>
                <li>
                  <span className="font-bold">お問い合わせ対応の記録</span>
                  ：対応完了から1年間
                </li>
                <li>
                  <span className="font-bold">
                    取引に関する記録（有料鑑定開始後）
                  </span>
                  ：法令で定められた期間（最長7年）
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                12. 統計情報の作成および利用について
              </h2>
              <p>
                当サービスは、サービスの品質向上、傾向分析、コンテンツ改善等を目的として、保有する情報を個人が特定できない集計値（統計情報）に加工し、利用することがあります。統計情報は特定の個人との対応関係が排斥されており、個人情報には該当しません。第三者へ個人を特定できる形でデータを提供することはありません。
              </p>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                13. 開示・訂正・利用停止等のご請求
              </h2>
              <p className="mb-3">
                ご利用者は、当サービスが保有するご自身の個人情報について、開示、訂正、追加、削除、利用停止、第三者提供の停止を請求することができます。ご請求は、本ポリシー末尾に記載のお問い合わせ窓口までご連絡ください。
              </p>
              <p>
                ご請求を受けた場合、当サービスは合理的な期間内にご本人であることを確認したうえで対応します。本人確認のため、追加の情報のご提供をお願いする場合があります。
              </p>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                14. 本ポリシーの改定について
              </h2>
              <p>
                当サービスは、法令の改正、サービス内容の変更、その他必要に応じて本ポリシーを改定することがあります。改定後の本ポリシーは、当サービスのウェブサイトに掲載した時点から効力を生じるものとします。重要な変更を行う場合には、ウェブサイト上での告知、またはメール・LINEで結果を受け取られた方へのご連絡を行います。
              </p>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                15. お問い合わせ窓口
              </h2>
              <p className="mb-3">
                本ポリシーおよび個人情報の取扱いに関するお問い合わせは、以下の窓口までご連絡ください。
              </p>
              <div className="space-y-1">
                <p>桂乃星術館</p>
                <p>代表者：中島一磨</p>
                <p>
                  所在地：大阪府大阪市北区梅田1丁目1番3号　大阪駅前第3ビル11階2号室
                </p>
                <p>
                  メールアドレス：
                  <a
                    href="mailto:info@parama-jyotish.jp"
                    className="text-c-teal underline underline-offset-2 hover:opacity-70 transition-opacity"
                  >
                    info@parama-jyotish.jp
                  </a>
                </p>
              </div>
            </section>

            <hr className="border-border" />

            <p className="text-sm text-c-teal-green">
              制定日：2026年6月6日
              <br />
              最終改定日：2026年8月19日
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
