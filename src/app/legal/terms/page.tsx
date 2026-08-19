import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "利用規約 | Parama",
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-background">
        <div className="max-w-lg min-[900px]:max-w-2xl mx-auto px-6 py-12 sm:py-20">
          <h1 className="text-2xl font-normal text-c-teal mb-8 text-center">
            利用規約
          </h1>
          <div className="py-8 sm:py-10 px-[22px] text-c-teal-deep leading-relaxed space-y-8 font-ryotext text-[0.9375rem]">
            <p>
              本利用規約（以下「本規約」といいます）は、桂乃星術館（以下「当方」といいます）が提供するインド占星術（ジョーティシュ）に基づく鑑定サービス「Parama」（以下「本サービス」といいます）の利用条件を定めるものです。本サービスを利用されるすべての方（以下「利用者」といいます）は、本規約に同意したうえでご利用ください。
            </p>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                第1条（適用範囲）
              </h2>
              <p>
                本規約は、当方と利用者との間の本サービスの利用に関する一切の関係に適用されます。当方が本サービスに関して別途定めるガイドライン、注意事項その他の規定は、本規約の一部を構成するものとします。
              </p>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                第2条（本サービスの内容）
              </h2>
              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  本サービスは、インド占星術（ジョーティシュ）の古典体系に基づき、利用者が入力した出生データ（生年月日、出生時刻、出生地）をもとに鑑定結果を提供するものです。
                </li>
                <li>
                  現在は無料のラグナ（上昇宮）自動診断サービスを提供しております。有料サービスについては、今後提供を開始する予定です。有料サービスの内容、料金、支払方法等については、提供開始の際に本ページまたは各サービスページにてご案内いたします。
                </li>
              </ol>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                第3条（サービスの法的性質）
              </h2>
              <p>
                本サービスに基づく契約は、民法上の準委任契約に該当するものとし、当方は鑑定業務の実施を目的としてサービスを提供します。特定の結果の実現または保証を目的とするものではありません。
              </p>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                第4条（利用登録）
              </h2>
              <p>
                利用者は、当方が定める方法により必要事項を入力し、本サービスの利用を開始するものとします。
              </p>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                第5条（未成年者の利用）
              </h2>
              <p>
                未成年者（18歳未満の方）が本サービスを利用する場合は、事前に親権者その他の法定代理人の同意を得るものとします。
              </p>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                第6条（鑑定結果の性質）
              </h2>
              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  本サービスで提供する鑑定結果は、インド占星術（ジョーティシュ）の古典体系に基づく解釈情報であり、その効果、正確性、完全性、信頼性、有効性、または利用者の特定の目的への適合性について、いかなる保証もいたしません。
                </li>
                <li>
                  鑑定結果は、利用者の自己理解の手がかりとして提供するものであり、利用者はこれを参考情報として自己の判断と責任において利用するものとします。鑑定結果の受け止め方には個人差があります。
                </li>
                <li>
                  鑑定結果に基づいて利用者が行った判断および行動の結果について、当方は一切の責任を負いません。ただし、当方の故意または重大な過失による場合はこの限りではありません。
                </li>
              </ol>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                第7条（鑑定の対象外事項）
              </h2>
              <p className="mb-3">
                本サービスは、以下に該当する事項に関する助言、判断、予測を行うものではありません。とくに<span className="underline">医療・健康、法律、投資・資産運用に関する事項</span>については、利用者は必ず各分野の専門家にご相談ください。
              </p>
              <ol className="list-decimal pl-6 space-y-1">
                <li>医療、健康に関する診断・治療の判断</li>
                <li>法律、訴訟に関する判断</li>
                <li>投資、資産運用に関する判断</li>
                <li>生死に関する断定的な予言</li>
                <li>その他、専門的資格を要する事項に関する判断</li>
              </ol>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                第8条（禁止事項）
              </h2>
              <p className="mb-3">
                利用者は、本サービスの利用にあたり、以下の行為を行ってはならないものとします。
              </p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  虚偽の出生データまたは他人の出生データを、当該他人の同意なく入力する行為
                </li>
                <li>
                  鑑定結果の全部または一部を、当方の事前の書面による承諾なく、転載、複製または二次利用する行為。ただし、利用者が自己の鑑定結果を、私的かつ非営利の目的でSNS等に共有する行為は、この限りではありません。
                </li>
                <li>
                  当方、本サービスの他の利用者、または第三者の名誉・信用を毀損し、またはプライバシーを侵害する行為
                </li>
                <li>
                  本サービスを利用して、同業他社のサービス開発のための情報収集を行う行為
                </li>
                <li>
                  本サービスを通じて、宗教活動、政治活動、営業活動、その他の勧誘行為を行うこと
                </li>
                <li>
                  本サービスのシステムに対する不正アクセス、過度な負荷をかける行為、その他本サービスの運営を妨害する行為
                </li>
                <li>
                  法令もしくは公序良俗に違反する行為、またはそのおそれのある行為
                </li>
                <li>その他、当方が不適切と合理的に判断する行為</li>
              </ol>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                第9条（利用の停止・拒否）
              </h2>
              <p>
                当方は、利用者が前条の禁止事項に該当する行為を行ったと合理的に判断した場合、事前の通知なく当該利用者の本サービスの利用を停止または拒否することができるものとします。これにより利用者に生じた損害について、当方は一切の責任を負いません。ただし、当方の故意または重大な過失による場合はこの限りではありません。
              </p>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                第10条（知的財産権）
              </h2>
              <p>
                本サービスに関するコンテンツ（鑑定結果のテキスト、ウェブサイトのデザイン、ロゴ、文章、画像等を含みますがこれに限りません）に関する著作権、商標権その他の知的財産権は、すべて当方に帰属します。
              </p>
              {/*
                【仮】第三者の権利物の表示（確定はカズマ）。
                出生地データ2件はいずれも CC BY 4.0 で、表示が利用条件に含まれるため公開前に必須。
                CC BY 4.0 §3(a)(1) が求めるもの: 作成者の表示 / ライセンスへの参照 /
                免責への言及 / 素材への URI / **改変した旨の明示**（§3(a)(1)(b)）。
                当方は町字を市区町村へ集約し代表点を算出しているため改変に該当する。
                CODH は配布ページで『Geoshape市区町村IDデータセット』（CODH作成）という
                表記を指定しているため、その形をそのまま使っている。
                星座画像は Freepik の premium ライセンス（docs/14 Part B）。
                クレジット表記義務は無いが、当方帰属ではないことを明示する趣旨で併記する。
              */}
              <p className="mt-3">
                ただし、以下に挙げるものについては、それぞれの提供者に著作権が帰属し、各提供者の定める利用規定が適用されます。当方に権利が帰属するものではありません。
              </p>
              <ul className="list-disc pl-6 space-y-3 mt-3">
                <li>
                  出生地の座標を判定するために利用している次のデータ。いずれも
                  クリエイティブ・コモンズ 表示 4.0 国際（CC BY 4.0）ライセンスのもとで
                  提供されています。当方は、これらのデータを町字単位から市区町村単位へ集約し、
                  その代表点となる座標を算出するなどの改変を行ったうえで利用しています。
                  保証の否認を含むライセンスの全文は、次のページをご参照ください。
                  <br />
                  <a
                    href="https://creativecommons.org/licenses/by/4.0/deed.ja"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-c-teal underline underline-offset-2 hover:opacity-70 transition-opacity break-all"
                  >
                    https://creativecommons.org/licenses/by/4.0/deed.ja
                  </a>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>
                      『Geolonia 住所データ』（株式会社Geolonia）
                      <br />
                      <a
                        href="https://github.com/geolonia/japanese-addresses"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-c-teal underline underline-offset-2 hover:opacity-70 transition-opacity break-all"
                      >
                        https://github.com/geolonia/japanese-addresses
                      </a>
                    </li>
                    <li>
                      『Geoshape市区町村IDデータセット』（CODH作成）
                      <br />
                      <a
                        href="https://geoshape.ex.nii.ac.jp/city/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-c-teal underline underline-offset-2 hover:opacity-70 transition-opacity break-all"
                      >
                        https://geoshape.ex.nii.ac.jp/city/
                      </a>
                    </li>
                  </ul>
                </li>
                <li>ラグナ鑑定結果表示画面の星座画像</li>
              </ul>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                第11条（個人情報の取扱い）
              </h2>
              <p>
                利用者の個人情報（出生データを含みます）の取扱いについては、当方が別途定めるプライバシーポリシーに従うものとします。
              </p>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                第12条（免責事項）
              </h2>
              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  通信回線、コンピュータ等の障害によるシステムの中断、遅延、中止、データの消失、またはデータへの不正アクセスにより生じた損害について、当方の故意または重大な過失による場合を除き、当方は一切の責任を負いません。
                </li>
                <li>
                  当方は、本サービスの提供の一時的な中断を伴うメンテナンスを実施する場合があります。メンテナンスに起因して利用者に生じた損害について、当方の故意または重大な過失による場合を除き、当方は一切の責任を負いません。
                </li>
                <li>
                  利用者と第三者との間に生じた紛争について、当方は一切の責任を負いません。ただし、当方の故意または重大な過失による場合はこの限りではありません。
                </li>
              </ol>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                第13条（損害賠償の制限）
              </h2>
              <p>
                当方が利用者に対して損害賠償責任を負う場合、その賠償額は、損害の事由が生じた時点から直近の過去1か月間に利用者が当方に支払った利用料金の総額を上限とします。ただし、当方の故意または重大な過失による場合はこの限りではありません。
              </p>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                第14条（サービスの変更・停止・終了）
              </h2>
              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  当方は、利用者に事前に通知することなく、本サービスの内容を変更し、または本サービスの提供を一時的に停止もしくは終了することができるものとします。
                </li>
                <li>
                  当方は、前項の措置により利用者に生じた損害について、当方の故意または重大な過失による場合を除き、一切の責任を負いません。
                </li>
              </ol>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                第15条（規約の変更）
              </h2>
              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  当方は、必要に応じて本規約を変更することができるものとします。
                </li>
                <li>
                  本規約の変更にあたっては、変更後の規約の内容および効力発生日を、本サービスのウェブサイト上に掲示する方法その他の適切な方法により、効力発生日の相当期間前までに利用者に周知するものとします。
                </li>
                <li>
                  前項の効力発生日以降に利用者が本サービスを利用した場合、利用者は変更後の規約に同意したものとみなします。
                </li>
              </ol>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                第16条（準拠法）
              </h2>
              <p>
                本規約の解釈および適用は、日本法に準拠するものとします。
              </p>
            </section>

            <section>
              <h2 className="font-maruminshinano text-[0.9375rem] font-bold text-c-teal-dark mb-3">
                第17条（合意管轄）
              </h2>
              <p>
                本規約に関する一切の紛争については、大阪地方裁判所を第一審の専属的合意管轄裁判所とします。
              </p>
            </section>

            <hr className="border-border" />

            <p className="text-sm text-c-teal-green">制定日：2026年6月6日</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
