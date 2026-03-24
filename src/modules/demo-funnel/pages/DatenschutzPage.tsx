import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Zap, ArrowRight } from "lucide-react";
import { siteConfig } from "@/config/content";

const DatenschutzPage = () => {
  useEffect(() => {
    document.title = "Datenschutz - Flowstack Systems";
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
            <span className="text-purple-400">Datenschutzerklärung</span>
          </h1>

          <div className="space-y-6 text-gray-400">
            {/* Verantwortlicher */}
            <section className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">1. Verantwortlicher</h2>
              <p>Verantwortlicher für die Datenverarbeitung auf dieser Website ist:</p>
              <div className="mt-3 space-y-1">
                <p className="text-white font-medium">Claudio Di Franco</p>
                <p>Flowstack Systems</p>
                <p>Falkenweg 2</p>
                <p>76327 Pfinztal</p>
                <p className="mt-2">
                  E-Mail:{" "}
                  <a href="mailto:kontakt@flowstack-systems.de" className="text-purple-400 hover:underline">
                    kontakt@flowstack-systems.de
                  </a>
                </p>
                <p>
                  Telefon:{" "}
                  <a href="tel:+4917358379 27" className="text-purple-400 hover:underline">
                    0173 583 79 27
                  </a>
                </p>
              </div>
            </section>

            {/* Datenerfassung */}
            <section className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">
                2. Datenerfassung auf dieser Website
              </h2>
              <h3 className="text-lg font-medium text-white mt-4 mb-2">Server-Log-Dateien</h3>
              <p>
                Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten
                Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                <li>Browsertyp und Browserversion</li>
                <li>Verwendetes Betriebssystem</li>
                <li>Referrer URL</li>
                <li>Hostname des zugreifenden Rechners</li>
                <li>Uhrzeit der Serveranfrage</li>
                <li>IP-Adresse</li>
              </ul>
              <p className="mt-3">
                Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen. Die
                Erfassung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO.
              </p>
            </section>

            {/* Kontaktformular */}
            <section className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">
                3. Anfrage per E-Mail oder Kontaktformular
              </h2>
              <p>
                Wenn Sie uns per Kontaktformular oder E-Mail kontaktieren, wird Ihre Anfrage inklusive
                aller daraus hervorgehenden personenbezogenen Daten (Name, E-Mail, Nachricht) zum Zwecke
                der Bearbeitung Ihres Anliegens bei uns gespeichert und verarbeitet.
              </p>
              <p className="mt-3">
                Die Verarbeitung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO,
                sofern Ihre Anfrage mit der Erfüllung eines Vertrags zusammenhängt oder zur Durchführung
                vorvertraglicher Maßnahmen erforderlich ist. In allen übrigen Fällen beruht die
                Verarbeitung auf unserem berechtigten Interesse an der effektiven Bearbeitung der an uns
                gerichteten Anfragen (Art. 6 Abs. 1 lit. f DSGVO) oder auf Ihrer Einwilligung (Art. 6
                Abs. 1 lit. a DSGVO).
              </p>
              <p className="mt-3">
                Die von Ihnen an uns per Kontaktanfragen übersandten Daten verbleiben bei uns, bis Sie
                uns zur Löschung auffordern, Ihre Einwilligung zur Speicherung widerrufen oder der Zweck
                für die Datenspeicherung entfällt. Zwingende gesetzliche Bestimmungen - insbesondere
                gesetzliche Aufbewahrungsfristen - bleiben unberührt.
              </p>
            </section>

            {/* Cookies */}
            <section className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">4. Cookies</h2>
              <p>
                Unsere Internetseiten verwenden so genannte „Cookies". Cookies sind kleine Datenpakete
                und richten auf Ihrem Endgerät keinen Schaden an. Sie werden entweder vorübergehend für
                die Dauer einer Sitzung (Session-Cookies) oder dauerhaft (permanente Cookies) auf Ihrem
                Endgerät gespeichert.
              </p>
              <p className="mt-3">
                Session-Cookies werden nach Ende Ihres Besuchs automatisch gelöscht. Permanente Cookies
                bleiben auf Ihrem Endgerät gespeichert, bis Sie diese selbst löschen oder eine
                automatische Löschung durch Ihren Webbrowser erfolgt.
              </p>
              <p className="mt-3">
                Cookies, die zur Durchführung des elektronischen Kommunikationsvorgangs, zur
                Bereitstellung bestimmter, von Ihnen erwünschter Funktionen oder zur Optimierung der
                Website erforderlich sind, werden auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO
                gespeichert. Wir haben ein berechtigtes Interesse an der Speicherung von Cookies zur
                technisch fehlerfreien und optimierten Bereitstellung unserer Dienste.
              </p>
            </section>

            {/* Hosting */}
            <section className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">5. Hosting</h2>
              <p>Wir hosten die Inhalte unserer Website bei folgendem Anbieter:</p>
              <h3 className="text-lg font-medium text-white mt-4 mb-2">Externes Hosting</h3>
              <p>
                Diese Website wird extern gehostet. Die personenbezogenen Daten, die auf dieser Website
                erfasst werden, werden auf den Servern des Hosters gespeichert. Hierbei kann es sich v.
                a. um IP-Adressen, Kontaktanfragen, Meta- und Kommunikationsdaten, Vertragsdaten,
                Kontaktdaten, Namen, Websitezugriffe und sonstige Daten, die über eine Website generiert
                werden, handeln.
              </p>
              <p className="mt-3">
                Das externe Hosting erfolgt zum Zwecke der Vertragserfüllung gegenüber unseren
                potenziellen und bestehenden Kunden (Art. 6 Abs. 1 lit. b DSGVO) und im Interesse einer
                sicheren, schnellen und effizienten Bereitstellung unseres Online-Angebots durch einen
                professionellen Anbieter (Art. 6 Abs. 1 lit. f DSGVO).
              </p>
            </section>

            {/* Rechte der betroffenen Person */}
            <section className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">6. Ihre Rechte</h2>
              <p>Sie haben gegenüber uns folgende Rechte:</p>
              <ul className="list-disc list-inside mt-3 space-y-2 text-gray-400">
                <li>
                  <strong className="text-white">Auskunftsrecht:</strong> Sie können Auskunft über Ihre
                  von uns verarbeiteten personenbezogenen Daten verlangen.
                </li>
                <li>
                  <strong className="text-white">Recht auf Berichtigung:</strong> Sie können die
                  Berichtigung unrichtiger oder Vervollständigung Ihrer bei uns gespeicherten
                  personenbezogenen Daten verlangen.
                </li>
                <li>
                  <strong className="text-white">Recht auf Löschung:</strong> Sie können die Löschung
                  Ihrer bei uns gespeicherten personenbezogenen Daten verlangen.
                </li>
                <li>
                  <strong className="text-white">Recht auf Einschränkung der Verarbeitung:</strong> Sie
                  können die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten verlangen.
                </li>
                <li>
                  <strong className="text-white">Recht auf Datenübertragbarkeit:</strong> Sie können
                  verlangen, dass wir Ihnen Ihre personenbezogenen Daten in einem strukturierten,
                  gängigen und maschinenlesbaren Format übermitteln.
                </li>
                <li>
                  <strong className="text-white">Widerspruchsrecht:</strong> Sie können der Verarbeitung
                  Ihrer personenbezogenen Daten widersprechen.
                </li>
                <li>
                  <strong className="text-white">Beschwerderecht bei der Aufsichtsbehörde:</strong> Sie
                  haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über die Verarbeitung
                  Ihrer personenbezogenen Daten zu beschweren.
                </li>
              </ul>
            </section>

            {/* SSL-Verschlüsselung */}
            <section className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">7. SSL- bzw. TLS-Verschlüsselung</h2>
              <p>
                Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher
                Inhalte eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie
                daran, dass die Adresszeile des Browsers von „http://" auf „https://" wechselt und an dem
                Schloss-Symbol in Ihrer Browserzeile.
              </p>
              <p className="mt-3">
                Wenn die SSL- bzw. TLS-Verschlüsselung aktiviert ist, können die Daten, die Sie an uns
                übermitteln, nicht von Dritten mitgelesen werden.
              </p>
            </section>

            {/* Meta Marketing API */}
            <section className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">
                8. Nutzung der Meta Marketing API (Facebook / Instagram)
              </h2>
              <p>
                Diese Website sowie die damit verbundenen internen Systeme nutzen Programmierschnittstellen
                der <strong className="text-white">Meta Platforms Ireland Ltd., 4 Grand Canal Square, Dublin 2, Irland</strong>{" "}
                („Meta"), insbesondere die <strong className="text-white">Meta Marketing API</strong>, um Werbekampagnen
                auf Facebook und Instagram automatisiert zu erstellen, zu verwalten, zu optimieren und auszuwerten.
              </p>
              <p className="mt-3">
                Die Anwendung wird sowohl für eigene Werbekonten als auch für Werbekonten von Kunden eingesetzt,
                sofern hierfür eine entsprechende vertragliche Beauftragung sowie eine Berechtigung durch den
                jeweiligen Verantwortlichen vorliegt.
              </p>
              <p className="mt-3">Im Rahmen der Nutzung der Meta Marketing API können insbesondere folgende Daten verarbeitet werden:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                <li>Kampagnen-, Anzeigengruppen- und Anzeigeninformationen (z. B. Namen, IDs, Status, Budgets, Laufzeiten)</li>
                <li>Leistungs- und Statistikdaten aus Werbekampagnen (z. B. Impressionen, Klicks, Reichweite, Ausgaben, Conversions)</li>
                <li>Technische Zuordnungen zu Werbekonten, Pixeln oder Conversion-APIs</li>
              </ul>
              <p className="mt-3">
                Es findet <strong className="text-white">keine Verarbeitung privater Facebook- oder Instagram-Nutzerprofile</strong> statt.
                Insbesondere werden keine privaten Nachrichten, Profildaten, Freundeslisten oder sonstige personenbezogene
                Inhalte von Endnutzern verarbeitet.
              </p>
              <p className="mt-3">
                Die Anwendung richtet sich nicht an Endnutzer und stellt keine öffentliche Plattform oder App für Facebook-
                oder Instagram-Nutzer dar. Sie dient ausschließlich der internen Automatisierung von Marketing-, Reporting-
                und Optimierungsprozessen sowie der Betreuung von Werbekampagnen für Kunden.
              </p>
              <p className="mt-3">
                Die Verarbeitung erfolgt auf Grundlage von <strong className="text-white">Art. 6 Abs. 1 lit. f DSGVO</strong>{" "}
                (berechtigtes Interesse an einer effizienten, wirtschaftlichen und technisch zuverlässigen Verwaltung und
                Auswertung von Werbekampagnen). Sofern die Verarbeitung im Rahmen eines Vertragsverhältnisses mit Kunden erfolgt,
                zusätzlich auf Grundlage von <strong className="text-white">Art. 6 Abs. 1 lit. b DSGVO</strong>{" "}
                (Vertragserfüllung bzw. Durchführung vorvertraglicher Maßnahmen).
              </p>
              <p className="mt-3">
                Eine Weitergabe der über die Meta Marketing API verarbeiteten Daten an unbefugte Dritte findet nicht statt.
                Die Daten werden nur so lange gespeichert, wie dies für die genannten Zwecke erforderlich ist oder gesetzliche
                Aufbewahrungspflichten bestehen.
              </p>
              <p className="mt-3">
                Weitere Informationen zur Datenverarbeitung durch Meta finden Sie unter:{" "}
                <a
                  href="https://www.facebook.com/privacy/policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:underline"
                >
                  https://www.facebook.com/privacy/policy
                </a>
              </p>
            </section>

            {/* Aktualität */}
            <section className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">
                9. Aktualität und Änderung dieser Datenschutzerklärung
              </h2>
              <p>Diese Datenschutzerklärung ist aktuell gültig und hat den Stand Januar 2026.</p>
              <p className="mt-3">
                Durch die Weiterentwicklung unserer Website oder aufgrund geänderter gesetzlicher beziehungsweise
                behördlicher Vorgaben kann es notwendig werden, diese Datenschutzerklärung zu ändern. Die jeweils
                aktuelle Datenschutzerklärung kann jederzeit auf dieser Website abgerufen werden.
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

export default DatenschutzPage;
