import { useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, ArrowRight, Zap, Clock, FileText, Mail } from "lucide-react";
import { siteConfig } from "@/config/content";
import { trackLead } from "@/utils/fbPixel";

const DankePage = () => {
  useEffect(() => {
    document.title = "Vielen Dank - Flowstack Systems";
    window.scrollTo(0, 0);
    // FB Pixel: Lead Event (Conversion)
    trackLead();
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

      <main className="flex items-center justify-center min-h-[80vh] px-6 pt-28 pb-16">
        <div className="max-w-3xl mx-auto">
          {/* Success Animation */}
          <div className="text-center mb-12">
            <div className="relative inline-block mb-8">
              <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Vielen Dank für deine{" "}
              <span className="text-purple-400">Anfrage!</span>
            </h1>

            <p className="text-lg text-gray-400 max-w-lg mx-auto">
              Deine Anfrage ist bei uns eingegangen. Wir melden uns innerhalb von 48 Stunden bei dir.
            </p>
          </div>

          {/* Process Steps */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-purple-600/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-gray-900/50 rounded-2xl p-6 border border-gray-800/50 h-full">
                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                  <CheckCircle className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-xs text-purple-400 font-semibold mb-2">SCHRITT 1</div>
                <h3 className="text-white font-semibold mb-2">Anfrage eingegangen</h3>
                <p className="text-gray-500 text-sm">Deine Daten sind sicher bei uns angekommen.</p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-purple-600/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-gray-900/50 rounded-2xl p-6 border border-gray-800/50 h-full">
                <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center mb-4">
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
                <div className="text-xs text-gray-500 font-semibold mb-2">SCHRITT 2</div>
                <h3 className="text-white font-semibold mb-2">Prüfung</h3>
                <p className="text-gray-500 text-sm">Wir prüfen, ob wir dir helfen können.</p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-purple-600/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-gray-900/50 rounded-2xl p-6 border border-gray-800/50 h-full">
                <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center mb-4">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <div className="text-xs text-gray-500 font-semibold mb-2">SCHRITT 3</div>
                <h3 className="text-white font-semibold mb-2">Terminvorschlag</h3>
                <p className="text-gray-500 text-sm">Du erhältst einen Terminvorschlag per E-Mail.</p>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-6 mb-10">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Was passiert als nächstes?</h4>
                <p className="text-gray-400 text-sm">
                  Unser Team prüft deine Anfrage und meldet sich innerhalb von 48 Stunden mit einem Terminvorschlag für dein kostenloses Erstgespräch.
                </p>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gray-900/50 border border-gray-800/50 text-white rounded-xl hover:bg-gray-800/50 transition-all"
            >
              Zurück zur Startseite
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
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

export default DankePage;
