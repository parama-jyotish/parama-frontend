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
        <div className="max-w-lg min-[900px]:max-w-2xl mx-auto px-6 py-12 sm:py-20">
          <h1 className="text-2xl font-normal text-c-teal mb-8 text-center">
            プライバシーポリシー
          </h1>
          <div className="py-8 sm:py-10 px-[22px] text-c-teal-deep leading-relaxed space-y-8 font-ryotext text-[0.9375rem]">
            <p>
              桂乃星術館（以下「当サービス」といいます）は、インド占星術（ジョーティシュ）に基づく無料のラグナ簡易判定「インド占星術パラマ（PARAMA）」（以下「本サービス」といいます）を提供するにあたり、ご利用者の個人情報の保護を重要な責務と考えています。本ポリシーは、本サービスにおける個人情報の取得、利用、管理に関する方針を定めるものです。
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
                本サービスでは、インド占星術のラグナ（上昇星座）の計算にあたり、生年月日・出生時刻・出生地をお預かりします。
              </p>
              <p className="mb-4">
                ご入力いただいたこれらの情報は、ラグナの計算にのみ使用します。計算はその場で行い、結果を表示したのちはサーバーやデータベースに保存しません。計算結果の表示後、ブラウザを離れた時点でデータは残りません。
              </p>
              <p>
                本サービスでは、氏名・メールアドレス・電話番号等の連絡先を取得しません。会員登録やメール・LINE等によるご連絡先の登録もありません。
              </p>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                3. 取得する個人情報の項目
              </h2>
              <p className="mb-3">本サービスが取り扱う情報は、次のとおりです。</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  ラグナの計算のためにご入力いただく生年月日・出生時刻・出生地（保存せず、計算のみに使用します）
                </li>
                <li>
                  お問い合わせをいただいた場合に、フォームまたはメールにご記入いただいた内容およびご連絡先
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                4. 利用目的
              </h2>
              <p className="mb-3">
                当サービスは、取り扱う情報を以下の目的のために利用します。
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>ラグナの計算および結果の表示</li>
                <li>お問い合わせへの対応</li>
              </ul>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                5. 第三者提供について
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
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                6. サービス運営基盤（委託先）について
              </h2>
              <p className="mb-3">
                当サービスは、ウェブサイトの配信およびラグナ計算のために、以下の事業者のサービスを利用しています。ご入力いただいた出生データは、計算のためにこれらの基盤へ一時的に送信されますが、当サービスはこれをデータベース等に保存しません。
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 font-medium text-c-teal-deep">
                        委託先
                      </th>
                      <th className="text-left py-2 pr-4 font-medium text-c-teal-deep">
                        所在地
                      </th>
                      <th className="text-left py-2 font-medium text-c-teal-deep">
                        役割
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="py-2 pr-4">Railway Corp.</td>
                      <td className="py-2 pr-4">アメリカ合衆国</td>
                      <td className="py-2">
                        ラグナ計算を実行するサーバー基盤の提供
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Vercel Inc.</td>
                      <td className="py-2 pr-4">アメリカ合衆国</td>
                      <td className="py-2">
                        ウェブサイト（フロントエンド）の配信
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Cloudflare, Inc.</td>
                      <td className="py-2 pr-4">アメリカ合衆国</td>
                      <td className="py-2">DNSおよびネットワーク基盤の提供</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-4">
                各委託先との間では、データ処理契約（DPA）を締結し、定期的に各社の安全管理体制を確認することで、必要かつ適切な監督を行います。
              </p>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                7. 外国にある第三者への個人情報の提供について
              </h2>
              <p>
                前項のとおり、ラグナの計算にあたり、ご入力いただいた出生データを米国に所在する事業者の基盤へ一時的に送信します。これは、個人情報保護法第28条にいう「外国にある第三者への個人データの提供」に該当します。送信されたデータは計算のためにのみ用いられ、保存されません。
              </p>
              <p className="mt-3">
                各委託先の所在国における個人情報の保護に関する制度については、個人情報保護委員会のウェブサイト（
                <a
                  href="https://www.ppc.go.jp/personalinfo/legal/kaiseihogohou/#gaikoku"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-c-teal underline underline-offset-2 hover:opacity-70 transition-opacity"
                >
                  https://www.ppc.go.jp/personalinfo/legal/kaiseihogohou/#gaikoku
                </a>
                ）にて公表されている情報をご参照ください。各委託先は、SOC
                2、ISO 27001、GDPRなど国際的に認められた情報セキュリティ・個人情報保護の基準に準拠しており、当サービスとの間で締結したデータ処理契約（標準契約条項を含む）に基づいて個人情報を取り扱います。
              </p>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                8. Cookie およびアクセス解析について
              </h2>
              <p>
                当サービスは、本ポリシー制定時点においては Cookie
                を用いたアクセス解析ツール（Google Analytics
                等）を導入していません。将来これらを導入する場合には、本ポリシーを改定し、サイト上で告知します。
              </p>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                9. 安全管理措置
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
                  計算のために送信される出生データは保存せず、計算終了後に保持しません
                </li>
                <li>
                  委託先事業者の選定にあたっては、十分な安全管理体制を備えていることを確認しています
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                10. 個人情報の保有期間および削除
              </h2>
              <p className="mb-3">
                当サービスは、個人情報を以下の期間保有します。
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <span className="font-medium">
                    ラグナ計算のためにお預かりする出生データ
                  </span>
                  ：保存しません（計算終了後に保持しません）
                </li>
                <li>
                  <span className="font-medium">お問い合わせ対応の記録</span>
                  ：対応完了から1年間
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                11. 開示・訂正・利用停止等のご請求
              </h2>
              <p>
                ご利用者は、当サービスが保有するご自身の個人情報について、開示、訂正、追加、削除、利用停止、第三者提供の停止を請求することができます。ご請求は、本ポリシー末尾に記載のお問い合わせ窓口までご連絡ください。
              </p>
              <p className="mt-3">
                なお、ラグナ計算のためにお預かりする出生データは保存していないため、開示・訂正等の対象となるのは、お問い合わせ対応の記録に限られます。
              </p>
              <p className="mt-3">
                ご請求を受けた場合、当サービスは合理的な期間内にご本人であることを確認したうえで対応します。本人確認のため、追加の情報のご提供をお願いする場合があります。
              </p>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                12. 本ポリシーの改定について
              </h2>
              <p>
                当サービスは、法令の改正、サービス内容の変更、その他必要に応じて本ポリシーを改定することがあります。改定後の本ポリシーは、当サービスのウェブサイトに掲載した時点から効力を生じるものとします。
              </p>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                13. お問い合わせ窓口
              </h2>
              <p className="mb-3">
                本ポリシーおよび個人情報の取扱いに関するお問い合わせは、以下の窓口までご連絡ください。
              </p>
              <div>
                <p className="font-medium text-c-teal-dark">■桂乃星術館</p>
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
              最終改定日：2026年6月11日
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
