import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Zap, ArrowRight } from "lucide-react";
import { siteConfig } from "@/config/content";

const ImpressumPage = () => {
  useEffect(() => {
    document.title = "Impressum - Flowstack Systems";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0e] text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-4 mt-4">
          <div className="max-w-7xl mx-auto bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-gray-800/50 shadow-2xl px-6 py-3">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">{siteConfig.name}</span>
              </Link>

              <div className="hidden md:flex items-center gap-1">
                <Link to="/" className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all font-medium text-sm">
                  Startseite
                </Link>
                <Link to="/#system" className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all font-medium text-sm">
                  System
                </Link>
                <Link to="/#leistungen" className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all font-medium text-sm">
                  Leistungen
                </Link>
              </div>

              <Link to="/kostenlose-beratung" className="group bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-purple-500/25 transition-all hover:-translate-y-0.5 flex items-center gap-2">
                Prozess-Analyse
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-28 pb-16 md:pt-32 md:pb-24">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-12">
            <span className="text-purple-400">Impressum</span>
          </h1>

          <div className="space-y-6 text-gray-400">
            {/* Angaben gemäß § 5 TMG */}
            <section className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">
                Angaben gemäß § 5 TMG
              </h2>
              <div className="space-y-1">
                <p className="text-white font-medium">Claudio Di Franco</p>
                <p>Vertrieb Dienstleistungen im Online Marketing Bereich</p>
                <p>Falkenweg 2</p>
                <p>76327 Pfinztal</p>
              </div>
            </section>

            {/* Kontakt */}
            <section className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">Kontakt</h2>
              <div className="space-y-1">
                <p>
                  Telefon:{" "}
                  <a href="tel:+4917358379 27" className="text-purple-400 hover:underline">
                    0173 583 79 27
                  </a>
                </p>
                <p>
                  E-Mail:{" "}
                  <a href="mailto:kontakt@flowstack-systems.de" className="text-purple-400 hover:underline">
                    kontakt@flowstack-systems.de
                  </a>
                </p>
              </div>
            </section>

            {/* Umsatzsteuer-ID */}
            <section className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">Umsatzsteuer-ID</h2>
              <p>Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:</p>
              <p className="text-white font-medium mt-2">DE315947038</p>
            </section>

            {/* EU-Streitschlichtung */}
            <section className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">EU-Streitschlichtung</h2>
              <p>
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
                <a
                  href="https://ec.europa.eu/consumers/odr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:underline"
                >
                  https://ec.europa.eu/consumers/odr/
                </a>
              </p>
              <p className="mt-2">Unsere E-Mail-Adresse finden Sie oben im Impressum.</p>
            </section>

            {/* Verbraucherstreitbeilegung */}
            <section className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">
                Verbraucherstreitbeilegung / Universalschlichtungsstelle
              </h2>
              <p>
                Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
                Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </section>

            {/* Haftungsausschluss */}
            <section className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">Haftung für Inhalte</h2>
              <p>
                Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten
                nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als
                Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
                Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
                Tätigkeit hinweisen.
              </p>
              <p className="mt-3">
                Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den
                allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch
                erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei
                Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend
                entfernen.
              </p>
            </section>

            {/* Haftung für Links */}
            <section className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">Haftung für Links</h2>
              <p>
                Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen
                Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr
                übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder
                Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der
                Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum
                Zeitpunkt der Verlinkung nicht erkennbar.
              </p>
              <p className="mt-3">
                Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete
                Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von
                Rechtsverletzungen werden wir derartige Links umgehend entfernen.
              </p>
            </section>

            {/* Urheberrecht */}
            <section className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">Urheberrecht</h2>
              <p>
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen
                dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art
                der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen
                Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind
                nur für den privaten, nicht kommerziellen Gebrauch gestattet.
              </p>
              <p className="mt-3">
                Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die
                Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche
                gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden,
                bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen
                werden wir derartige Inhalte umgehend entfernen.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-800/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link to="/" className="hover:text-white transition-colors">Startseite</Link>
              <a href="/impressum" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Impressum</a>
              <a href="/datenschutz" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Datenschutz</a>
            </div>
            <p className="text-sm text-gray-600">&copy; {new Date().getFullYear()} {siteConfig.name}</p>
          </div>
        </div>
      </footer>

      {/* Meta Disclaimer */}
      <div className="bg-[#0a0a0e] py-6 border-t border-gray-800/30">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-[11px] text-gray-600 text-center leading-relaxed">
            Diese Website ist kein Teil der Facebook-Website oder von Facebook Inc. Darüber hinaus wird diese Website in keiner Weise von Facebook unterstützt. Facebook ist eine Marke von Facebook, Inc. Wir verwenden auf dieser Website Remarketing-Pixel/Cookies von Google, um erneut mit den Besuchern unserer Website zu kommunizieren und sicherzustellen, dass wir sie in Zukunft mit relevanten Nachrichten und Informationen erreichen können. Google schaltet unsere Anzeigen auf Websites Dritter im Internet, um unsere Botschaft zu kommunizieren und die richtigen Personen zu erreichen, die in der Vergangenheit Interesse an unseren Informationen gezeigt haben.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImpressumPage;
