import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "プライバシーポリシー | PARAMA",
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <h1 className="text-2xl font-normal text-foreground mb-8 text-center">
            プライバシーポリシー
          </h1>
          <div className="bg-card-bg rounded-2xl p-8 sm:p-10 shadow-sm border border-border text-foreground/80 leading-relaxed space-y-8">
            <p>
              桂乃星術館（以下「当サービス」といいます）は、インド占星術（ジョーティシュ）に基づく鑑定サービス「インド占星術パラマ（PARAMA）」（以下「本サービス」といいます）を提供するにあたり、ご利用者の個人情報の保護を重要な責務と考えています。本ポリシーは、本サービスにおける個人情報の取得、利用、管理に関する方針を定めるものです。
            </p>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                1. 個人情報の定義
              </h2>
              <p>
                本ポリシーにおいて「個人情報」とは、個人情報の保護に関する法律（以下「個人情報保護法」といいます）第2条第1項に定める個人情報を指します。具体的には、氏名、生年月日、メールアドレス、その他の記述等により特定の個人を識別することができる情報、および他の情報と容易に照合することができ、それにより特定の個人を識別することができる情報をいいます。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                2. 鑑定のために必要な情報について
              </h2>
              <p className="mb-3">
                本サービスでは、インド占星術の計算（ホロスコープの作成および分析）にあたり、以下の情報をお預かりします。
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>生年月日</li>
                <li>出生時刻</li>
                <li>出生地（都市名または緯度経度）</li>
              </ul>
              <p className="mb-4">
                これらの情報は、ご利用者個人の天体配置を計算するために不可欠なものであり、本サービスにおいては鑑定の目的以外には使用しません。氏名・住所等と紐づけて第三者に提供することは一切ありません。
              </p>
              <h3 className="text-base font-medium text-foreground mb-2">
                2-1. 無料診断をご利用いただく場合
              </h3>
              <p className="mb-4">
                当サービスのウェブサイト上で提供する無料診断は、ご入力いただいた出生データをサーバー上に保存いたしません。診断結果の算出に必要な計算をその場で行い、計算終了後にデータを破棄します。
              </p>
              <h3 className="text-base font-medium text-foreground mb-2">
                2-2. メンバー登録をいただく場合
              </h3>
              <p>
                ご利用者がメールアドレスをご入力のうえメンバー登録をされる場合に限り、出生データを鑑定履歴として安全に保管します。これにより、再度の入力なしに過去の診断結果をご参照いただけるようになります。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                3. 取得する個人情報の項目
              </h2>
              <p className="mb-3">
                本サービスでは、上記の出生データに加え、次の情報を取得することがあります。
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>メールアドレス</li>
                <li>ニックネーム等、ご自身で入力された任意の表示名</li>
                <li>お問い合わせフォームにご記入いただいた内容</li>
                <li>
                  有料鑑定をご購入の際の決済情報（決済代行業者を経由するため、当サービスはクレジットカード番号自体を保有しません）
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                4. 利用目的
              </h2>
              <p className="mb-3">
                当サービスは、取得した個人情報を以下の目的のために利用します。
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>鑑定サービスの提供および結果のご案内</li>
                <li>メンバー登録者への鑑定結果のメール送信</li>
                <li>メールマガジンおよびサービスに関するお知らせの配信</li>
                <li>お問い合わせへの対応</li>
                <li>本サービスの品質向上およびコンテンツ改善のための分析</li>
                <li>利用規約に違反する行為への対応</li>
                <li>法令に基づく対応</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                5. AI（人工知能）による処理について
              </h2>
              <p>
                本サービスでは、鑑定文の生成および補助的な分析のために、当サービスが選定したAIサービスを利用することがあります。AI処理にあたっては、ご利用者の出生データおよび鑑定結果のテキストを当該AIサービスに送信する場合がありますが、氏名・メールアドレス等の識別情報は送信しません。また、当サービスが利用するAIサービスは、送信されたデータをAIモデルの学習目的に使用しないことを利用条件として明示している事業者のみを選定します。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                6. 第三者提供について
              </h2>
              <p className="mb-3">
                当サービスは、ご利用者の個人情報を、ご本人の同意を得ることなく第三者に提供することはありません。ただし、次の各号のいずれかに該当する場合はこの限りではありません。
              </p>
              <ol className="list-decimal pl-6 space-y-1">
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
              <h2 className="text-lg font-medium text-foreground mb-3">
                7. 個人情報の取扱いの委託について
              </h2>
              <p className="mb-3">
                当サービスは、サービスの運営にあたり、以下の事業者に個人情報の取扱いを委託しています。各委託先との間では、個人情報の適切な取扱いに関する契約を締結し、必要かつ適切な監督を行います。
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 font-medium text-foreground">
                        委託先
                      </th>
                      <th className="text-left py-2 pr-4 font-medium text-foreground">
                        所在地
                      </th>
                      <th className="text-left py-2 font-medium text-foreground">
                        委託する業務の内容
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="py-2 pr-4">Supabase, Inc.</td>
                      <td className="py-2 pr-4">アメリカ合衆国</td>
                      <td className="py-2">
                        データベースおよび認証基盤の提供
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Railway Corp.</td>
                      <td className="py-2 pr-4">アメリカ合衆国</td>
                      <td className="py-2">
                        バックエンドサーバーの提供
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Vercel Inc.</td>
                      <td className="py-2 pr-4">アメリカ合衆国</td>
                      <td className="py-2">
                        フロントエンド配信基盤の提供
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Cloudflare, Inc.</td>
                      <td className="py-2 pr-4">アメリカ合衆国</td>
                      <td className="py-2">
                        DNSおよびネットワーク基盤の提供
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">MailerLite Limited</td>
                      <td className="py-2 pr-4">アイルランド</td>
                      <td className="py-2">
                        メールマガジン配信および顧客管理
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                8. 外国にある第三者への個人情報の提供について
              </h2>
              <p>
                前項に記載のとおり、当サービスは個人情報の取扱いの一部を外国に所在する事業者に委託しています。これは、個人情報保護法第28条にいう「外国にある第三者への個人データの提供」に該当します。
              </p>
              <p className="mt-3">
                各委託先の所在国における個人情報の保護に関する制度については、個人情報保護委員会のウェブサイトにて公表されている情報をご参照ください。各委託先は、いずれもプライバシーに関する国際的な基準に準拠した個人情報保護措置を講じており、当サービスはその実施状況を継続的に確認します。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                9. Cookie およびアクセス解析について
              </h2>
              <p>
                当サービスは、本ポリシー制定時点においては Cookie
                を用いたアクセス解析ツール（Google Analytics
                等）を導入していません。将来これらを導入する場合には、本ポリシーを改定し、サイト上で告知します。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
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
              <h2 className="text-lg font-medium text-foreground mb-3">
                11. 個人情報の保有期間および削除
              </h2>
              <p className="mb-3">
                当サービスは、個人情報を以下の期間保有します。
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <span className="font-medium">
                    無料診断のご利用時にお預かりする出生データ
                  </span>
                  ：保存しません（計算終了後に破棄します）
                </li>
                <li>
                  <span className="font-medium">
                    メンバー登録者の個人情報
                  </span>
                  ：最終ログインから3年が経過した時点で自動的に削除します
                </li>
                <li>
                  <span className="font-medium">
                    退会のお申し出をいただいた場合
                  </span>
                  ：原則として速やかに削除します
                </li>
                <li>
                  <span className="font-medium">お問い合わせ対応の記録</span>
                  ：対応完了から1年間
                </li>
                <li>
                  <span className="font-medium">取引に関する記録</span>
                  ：法令で定められた期間（最長7年）
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                12. 匿名加工情報の作成および利用について
              </h2>
              <p>
                当サービスは、サービスの品質向上、傾向分析、コンテンツ改善等を目的として、診断ログ等を個人を特定できないように加工した匿名加工情報を作成し、利用することがあります。匿名加工情報の作成にあたっては、個人情報保護法および関連ガイドラインに従い、適切な安全管理措置を講じます。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                13. 開示・訂正・利用停止等のご請求
              </h2>
              <p>
                ご利用者は、当サービスが保有するご自身の個人情報について、開示、訂正、追加、削除、利用停止、第三者提供の停止を請求することができます。ご請求は、本ポリシー末尾に記載のお問い合わせ窓口までご連絡ください。
              </p>
              <p className="mt-3">
                ご請求を受けた場合、当サービスは合理的な期間内にご本人であることを確認したうえで対応します。本人確認のため、追加の情報のご提供をお願いする場合があります。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                14. 本ポリシーの改定について
              </h2>
              <p>
                当サービスは、法令の改正、サービス内容の変更、その他必要に応じて本ポリシーを改定することがあります。改定後の本ポリシーは、当サービスのウェブサイトに掲載した時点から効力を生じるものとします。重要な変更を行う場合には、ウェブサイト上での告知またはメンバー登録者へのメール通知を行います。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                15. お問い合わせ窓口
              </h2>
              <p className="mb-3">
                本ポリシーおよび個人情報の取扱いに関するお問い合わせは、以下の窓口までご連絡ください。
              </p>
              <div>
                <p className="font-medium text-foreground">■桂乃星術館</p>
                <p>代表者：中島一磨</p>
                <p>
                  所在地：大阪府大阪市北区梅田1丁目1番3号　大阪駅前第3ビル11階2号室
                </p>
                <p>
                  メールアドレス：
                  <a
                    href="mailto:info@parama-jyotish.jp"
                    className="text-foreground underline underline-offset-2 hover:opacity-70 transition-opacity"
                  >
                    info@parama-jyotish.jp
                  </a>
                </p>
              </div>
            </section>

            <hr className="border-border" />

            <p className="text-sm text-muted">
              制定日：2026年6月6日
              <br />
              最終改定日：2026年6月6日
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
