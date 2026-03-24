import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";

// Countdown Timer Component
const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 23,
    minutes: 7,
    seconds: 54,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  return (
    <div className="flex items-center justify-center gap-4 md:gap-8">
      <div className="text-center">
        <div className="text-4xl md:text-6xl font-bold text-white">{formatNumber(timeLeft.days)}</div>
      </div>
      <div className="text-4xl md:text-6xl font-bold text-gray-600">:</div>
      <div className="text-center">
        <div className="text-4xl md:text-6xl font-bold text-white">{formatNumber(timeLeft.hours)}</div>
      </div>
      <div className="text-4xl md:text-6xl font-bold text-gray-600">:</div>
      <div className="text-center">
        <div className="text-4xl md:text-6xl font-bold text-white">{formatNumber(timeLeft.minutes)}</div>
      </div>
      <div className="text-4xl md:text-6xl font-bold text-gray-600">:</div>
      <div className="text-center">
        <div className="text-4xl md:text-6xl font-bold text-white">{formatNumber(timeLeft.seconds)}</div>
      </div>
    </div>
  );
};

export const LandingPage = () => {
  const features = [
    "Die Templates und Inhalte für das Funnel-System hinter 520 Millionen Euro Portfolioumsatz.",
    "Strategien und Methoden aus über 30 Millionen Euro Werbeausgaben nur auf Facebook und Instagram.",
    "Exakte Schritt-für-Schritt-Anleitung, mit der du deine Landingpage in eine Gelddruckmaschine verwandelst.",
    "BONUS: Die häufigsten Facebook-Ads-Fehler, die dein Wachstum und deine Kundengewinnung massiv ausbremsen.",
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0e] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0e]/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold">
            <span className="text-purple-500">finest</span>
            <span className="text-white">audience</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          {/* Small Badge */}
          <div className="mb-8">
            <span className="inline-block px-4 py-2 text-xs uppercase tracking-widest text-purple-400 border border-purple-500/30 rounded-full bg-purple-500/10">
              Kopiere unseren 7-stelligen Funnel
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            COPY-PASTE FUNNEL-VORLAGEN, DIE{" "}
            <span className="text-purple-500">AUTOMATISIERT 70-350 QUALIFIZIERTE LEADS</span>{" "}
            PRO MONAT GENERIEREN
          </h1>

          {/* Subheadline */}
          <p className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto mb-10">
            In 30 Minuten hast du unsere bewährten Funnel-Vorlagen kopiert und kannst sofort starten — ohne Designer, ohne Entwickler, ohne Technik-Frust.
          </p>

          {/* CTA Button */}
          <div className="mb-16">
            <a
              href="#formular"
              className="inline-block px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all shadow-[0_0_30px_rgba(147,51,234,0.4)] hover:shadow-[0_0_40px_rgba(147,51,234,0.6)]"
            >
              Jetzt kostenlos sichern
            </a>
          </div>

          {/* Laptop Mockup */}
          <div className="relative max-w-4xl mx-auto mb-12">
            <div className="relative">
              {/* Screen */}
              <div className="bg-[#1a1a20] rounded-t-xl p-2 border border-gray-800">
                <div className="bg-[#0f0f14] rounded-xl overflow-hidden">
                  {/* Browser dots */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a20] border-b border-gray-800">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  {/* Dashboard Content */}
                  <div className="aspect-[16/9] p-4 bg-[#0f0f14]">
                    <div className="grid grid-cols-4 gap-3 h-full">
                      {/* Sidebar */}
                      <div className="col-span-1 bg-[#1a1a24] rounded-xl p-3 space-y-3">
                        <div className="h-8 bg-purple-600/30 rounded"></div>
                        <div className="h-4 bg-gray-700/30 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-700/30 rounded"></div>
                        <div className="h-4 bg-gray-700/30 rounded w-2/3"></div>
                        <div className="h-4 bg-gray-700/30 rounded w-4/5"></div>
                      </div>
                      {/* Main */}
                      <div className="col-span-3 space-y-3">
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-purple-600/20 border border-purple-500/30 rounded-xl p-3">
                            <div className="h-3 bg-purple-500/40 rounded w-1/2 mb-2"></div>
                            <div className="h-6 bg-white/20 rounded w-3/4"></div>
                          </div>
                          <div className="bg-[#1a1a24] rounded-xl p-3">
                            <div className="h-3 bg-gray-600/40 rounded w-1/2 mb-2"></div>
                            <div className="h-6 bg-white/10 rounded w-2/3"></div>
                          </div>
                          <div className="bg-[#1a1a24] rounded-xl p-3">
                            <div className="h-3 bg-gray-600/40 rounded w-1/2 mb-2"></div>
                            <div className="h-6 bg-white/10 rounded w-3/4"></div>
                          </div>
                        </div>
                        {/* Chart */}
                        <div className="bg-[#1a1a24] rounded-xl p-3 flex-1">
                          <div className="h-3 bg-gray-700/30 rounded w-1/4 mb-3"></div>
                          <div className="flex items-end gap-1 h-20">
                            {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 80].map((h, i) => (
                              <div
                                key={i}
                                className="flex-1 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t"
                                style={{ height: `${h}%` }}
                              ></div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Laptop Base */}
              <div className="h-4 bg-gradient-to-b from-[#2a2a30] to-[#1a1a20] rounded-b-xl mx-12"></div>
              <div className="h-2 bg-[#0f0f14] rounded-b-xl mx-6"></div>
            </div>
            {/* Glow */}
            <div className="absolute -inset-10 bg-purple-600/20 blur-[80px] -z-10 rounded-full"></div>
          </div>

          {/* Trust Logos */}
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
            <span className="text-gray-400 font-semibold">Meta</span>
            <span className="text-gray-400 font-semibold">Google</span>
            <span className="text-gray-400 font-semibold">YouTube</span>
            <span className="text-gray-400 font-semibold">TikTok</span>
            <span className="text-gray-400 font-semibold">funnel<span className="text-purple-500">cockpit</span></span>
            <span className="text-gray-400 font-semibold">HubSpot</span>
          </div>
        </div>
      </section>

      {/* Divider Line */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
      </div>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Headline */}
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-4">
            DAS ERWARTET DICH IN DER GRATIS
          </h2>
          <h3 className="text-2xl md:text-4xl font-bold text-center text-purple-500 mb-16">
            COPY-PASTE-VORLAGE
          </h3>

          {/* 2 Column Layout */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Laptop Mockup */}
            <div className="relative">
              <div className="relative">
                {/* Screen */}
                <div className="bg-[#1a1a20] rounded-t-xl p-2 border border-gray-800">
                  <div className="bg-[#0f0f14] rounded-xl overflow-hidden">
                    {/* Browser dots */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a20] border-b border-gray-800">
                      <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                    </div>
                    {/* Dashboard Content */}
                    <div className="aspect-[16/10] p-4 bg-[#0f0f14]">
                      <div className="grid grid-cols-4 gap-3 h-full">
                        {/* Sidebar */}
                        <div className="col-span-1 bg-[#1a1a24] rounded-xl p-3 space-y-3">
                          <div className="h-8 bg-purple-600/30 rounded"></div>
                          <div className="h-4 bg-gray-700/30 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-700/30 rounded"></div>
                          <div className="h-4 bg-gray-700/30 rounded w-2/3"></div>
                          <div className="h-4 bg-gray-700/30 rounded w-4/5"></div>
                        </div>
                        {/* Main */}
                        <div className="col-span-3 space-y-3">
                          {/* Stats */}
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-purple-600/20 border border-purple-500/30 rounded-xl p-3">
                              <div className="h-3 bg-purple-500/40 rounded w-1/2 mb-2"></div>
                              <div className="h-6 bg-white/20 rounded w-3/4"></div>
                            </div>
                            <div className="bg-[#1a1a24] rounded-xl p-3">
                              <div className="h-3 bg-gray-600/40 rounded w-1/2 mb-2"></div>
                              <div className="h-6 bg-white/10 rounded w-2/3"></div>
                            </div>
                            <div className="bg-[#1a1a24] rounded-xl p-3">
                              <div className="h-3 bg-gray-600/40 rounded w-1/2 mb-2"></div>
                              <div className="h-6 bg-white/10 rounded w-3/4"></div>
                            </div>
                          </div>
                          {/* Chart */}
                          <div className="bg-[#1a1a24] rounded-xl p-3 flex-1">
                            <div className="h-3 bg-gray-700/30 rounded w-1/4 mb-3"></div>
                            <div className="flex items-end gap-1 h-16">
                              {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 80].map((h, i) => (
                                <div
                                  key={i}
                                  className="flex-1 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t"
                                  style={{ height: `${h}%` }}
                                ></div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Laptop Base */}
                <div className="h-4 bg-gradient-to-b from-[#2a2a30] to-[#1a1a20] rounded-b-xl mx-12"></div>
                <div className="h-2 bg-[#0f0f14] rounded-b-xl mx-6"></div>
              </div>
              {/* Glow */}
              <div className="absolute -inset-10 bg-purple-600/20 blur-[80px] -z-10 rounded-full"></div>
            </div>

            {/* Right: Benefits List */}
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4">
                  {/* Green Checkmark */}
                  <div className="flex-shrink-0 mt-1">
                    <Check className="w-6 h-6 text-green-500" strokeWidth={3} />
                  </div>
                  {/* Text */}
                  <p className="text-gray-300 text-base leading-relaxed">{feature}</p>
                </div>
              ))}

              {/* CTA Button */}
              <div className="pt-6">
                <a
                  href="#formular"
                  className="inline-block w-full text-center px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all shadow-[0_0_30px_rgba(147,51,234,0.4)] hover:shadow-[0_0_40px_rgba(147,51,234,0.6)]"
                >
                  Jetzt Funnel-Vorlagen gratis sichern!
                  <span className="block text-sm font-normal mt-1 opacity-80">Inklusive Videoanleitung</span>
                </a>
                <p className="text-center text-gray-500 text-sm mt-4">100% SICHER. KEIN SPAM.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider Line */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
      </div>

      {/* About Section */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text + Stats */}
            <div>
              <h2 className="text-2xl md:text-4xl font-bold mb-6 leading-tight">
                WER SIND WIR, UM SO ETWAS ANZUBIETEN?
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-10">
                Wir sind keine Theoretiker. Wir sind Praktiker, die selbst Millionen an Werbebudget verwaltet und siebenstellige Umsätze für unsere Kunden generiert haben. Diese Funnels nutzen wir selbst jeden Tag — und jetzt geben wir sie dir.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#12121a] border border-gray-800/50 rounded-xl p-5">
                  <div className="text-3xl font-bold text-white">520 Mio.</div>
                  <div className="text-gray-500 text-sm">Werbebudget verwaltet</div>
                </div>
                <div className="bg-[#12121a] border border-gray-800/50 rounded-xl p-5">
                  <div className="text-3xl font-bold text-white">30 Mio.</div>
                  <div className="text-gray-500 text-sm">Umsatz generiert</div>
                </div>
                <div className="bg-[#12121a] border border-gray-800/50 rounded-xl p-5">
                  <div className="text-3xl font-bold text-white">6.152+</div>
                  <div className="text-gray-500 text-sm">Kunden gewonnen</div>
                </div>
                <div className="bg-[#12121a] border border-gray-800/50 rounded-xl p-5">
                  <div className="text-3xl font-bold text-white">7+</div>
                  <div className="text-gray-500 text-sm">Jahre Erfahrung</div>
                </div>
              </div>
            </div>

            {/* Right: Team Photo Placeholder */}
            <div className="relative">
              <div className="aspect-[4/5] bg-gradient-to-br from-purple-900/30 to-[#12121a] rounded-2xl border border-gray-800/50 flex items-center justify-center">
                <div className="text-center text-gray-600">
                  <div className="flex justify-center -space-x-4 mb-4">
                    <div className="w-20 h-20 rounded-full bg-purple-600/30 border-4 border-[#0a0a0e]"></div>
                    <div className="w-20 h-20 rounded-full bg-purple-600/30 border-4 border-[#0a0a0e]"></div>
                  </div>
                  <p className="text-sm">Team Foto</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Countdown Section */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <CountdownTimer />
        </div>
      </section>

      {/* Final CTA Section */}
      <section id="formular" className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-bold mb-2">
            SICHERE DIR JETZT DEINE GRATIS
          </h2>
          <h3 className="text-2xl md:text-4xl font-bold text-purple-500 mb-2">
            COPY-PASTE-VORLAGE
          </h3>
          <p className="text-xl text-gray-400 mb-12">
            BEVOR WIR DEN ZUGANG SPERREN.
          </p>

          {/* Dashboard + Team */}
          <div className="grid md:grid-cols-2 gap-6 items-end mb-12">
            {/* Small Laptop Mockup */}
            <div className="relative">
              <div className="bg-[#1a1a20] rounded-t-lg p-1.5 border border-gray-800">
                <div className="bg-[#0f0f14] rounded overflow-hidden">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a20] border-b border-gray-800">
                    <div className="w-2 h-2 rounded-full bg-red-500/80"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500/80"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500/80"></div>
                  </div>
                  <div className="aspect-[16/10] p-3 bg-[#0f0f14]">
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div className="h-8 bg-purple-600/20 border border-purple-500/30 rounded"></div>
                      <div className="h-8 bg-[#1a1a24] rounded"></div>
                      <div className="h-8 bg-[#1a1a24] rounded"></div>
                    </div>
                    <div className="bg-[#1a1a24] rounded p-2">
                      <div className="flex items-end gap-0.5 h-12">
                        {[50, 70, 45, 85, 60, 90, 75].map((h, i) => (
                          <div key={i} className="flex-1 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t" style={{ height: `${h}%` }}></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-2 bg-gradient-to-b from-[#2a2a30] to-[#1a1a20] rounded-b-lg mx-8"></div>
              <div className="absolute -inset-6 bg-purple-600/10 blur-[40px] -z-10 rounded-full"></div>
            </div>

            {/* Team Photo */}
            <div className="bg-gradient-to-t from-purple-900/20 to-[#12121a] rounded-xl border border-gray-800/50 p-6 min-h-[200px] flex items-center justify-center">
              <div className="flex -space-x-4">
                <div className="w-16 h-16 rounded-full bg-purple-600/30 border-4 border-[#0a0a0e]"></div>
                <div className="w-16 h-16 rounded-full bg-purple-600/30 border-4 border-[#0a0a0e]"></div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <a
            href="#formular"
            className="inline-block px-10 py-5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg rounded-xl transition-all shadow-[0_0_40px_rgba(147,51,234,0.4)] hover:shadow-[0_0_50px_rgba(147,51,234,0.6)]"
          >
            Jetzt kostenlos sichern
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-gray-800/50">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div>
            <span className="text-purple-500">finest</span>
            <span className="text-gray-400">audience</span>
            <span className="mx-2">|</span>
            <span>&copy; {new Date().getFullYear()} Alle Rechte vorbehalten</span>
          </div>
          <div className="flex gap-6">
            <Link to="/impressum" className="hover:text-white transition-colors">Impressum</Link>
            <Link to="/datenschutz" className="hover:text-white transition-colors">Datenschutz</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
