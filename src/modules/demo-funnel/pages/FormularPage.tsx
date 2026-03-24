import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Check, ArrowRight, Zap, Shield, Clock, Star } from "lucide-react";
import { siteConfig } from "@/config/content";
import { trackAddToCart } from "@/utils/fbPixel";

const FormularPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    telefon: "",
    firma: "",
    nachricht: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  useEffect(() => {
    document.title = "Erstgespräch anfragen - Flowstack Systems";
    window.scrollTo(0, 0);
    // FB Pixel: AddToCart Event
    trackAddToCart();
  }, []);

  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwuWXRv4p1s62FUBNIuAE7-O5E2qWZZRsWgqsOZbHxfCkDB9yP8mWY9EUCKlXGk5Df5ow/exec";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(false);

    try {
      // Formulardaten als URL-encoded senden (Google Apps Script erwartet dieses Format)
      const params = new URLSearchParams();
      params.append("name", formData.name);
      params.append("email", formData.email);
      params.append("telefon", formData.telefon);
      params.append("firma", formData.firma);
      params.append("nachricht", formData.nachricht);

      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: params,
        mode: "no-cors",
      });

      // Bei Erfolg zur Danke-Seite navigieren
      navigate("/danke");
    } catch (error) {
      console.error("Fehler beim Senden:", error);
      setSubmitError(true);
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Left: Info */}
            <div>
              <span className="inline-block px-4 py-2 bg-purple-500/10 text-purple-400 rounded-full text-sm font-semibold mb-6 border border-purple-500/20">
                Kostenlose Prozess-Analyse
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                Lass uns besprechen, wie viel{" "}
                <span className="text-purple-400">Potenzial</span> in deiner Agentur steckt
              </h1>
              <p className="text-lg text-gray-400 mb-10 leading-relaxed">
                In einem kurzen Gespräch analysieren wir gemeinsam deine aktuellen Prozesse und zeigen dir, welche Automatisierungshebel für dich am meisten Sinn machen.
              </p>

              {/* What to expect */}
              <div className="space-y-4 mb-10">
                <h3 className="font-semibold text-white">Das erwartet dich:</h3>
                <ul className="space-y-3">
                  {[
                    "15-20 Minuten Call mit einem Flowstack-Experten",
                    "Analyse deiner 3 größten Automatisierungs-Hebel",
                    "Konkrete Einschätzung deiner möglichen Umsatzrendite",
                    "Ehrliche Antwort, ob wir dir helfen können"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-purple-500/20 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                        <Check className="w-3 h-3 text-purple-400" />
                      </div>
                      <span className="text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Trust Elements */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 text-center">
                  <Shield className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">100% kostenlos</p>
                </div>
                <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 text-center">
                  <Clock className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Antwort in 48h</p>
                </div>
                <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 text-center">
                  <Star className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Unverbindlich</p>
                </div>
              </div>
            </div>

            {/* Right: Form */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-[2rem] blur-xl" />
              <div className="relative bg-gray-900/80 border border-gray-800/50 rounded-2xl p-8 backdrop-blur-sm">
                <h2 className="text-xl font-bold mb-6">Jetzt Erstgespräch anfragen</h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Dein vollständiger Name"
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">E-Mail *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="deine@email.de"
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Telefon *</label>
                    <input
                      type="tel"
                      name="telefon"
                      required
                      value={formData.telefon}
                      onChange={handleChange}
                      placeholder="+49 123 456789"
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Firma</label>
                    <input
                      type="text"
                      name="firma"
                      value={formData.firma}
                      onChange={handleChange}
                      placeholder="Name deines Unternehmens"
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Nachricht</label>
                    <textarea
                      name="nachricht"
                      rows={4}
                      value={formData.nachricht}
                      onChange={handleChange}
                      placeholder="Beschreibe kurz deine aktuelle Situation..."
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      "Wird gesendet..."
                    ) : (
                      <>
                        Anfrage absenden
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  {submitError && (
                    <p className="text-sm text-red-400 text-center">
                      Beim Senden ist ein Fehler aufgetreten. Bitte versuche es erneut.
                    </p>
                  )}

                  <p className="text-xs text-gray-500 text-center">
                    Mit dem Absenden akzeptierst du unsere{" "}
                    <Link to="/datenschutz" className="text-purple-400 hover:underline">
                      Datenschutzerklärung
                    </Link>
                    .
                  </p>
                </form>
              </div>
            </div>
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

export default FormularPage;
