import { useEffect, useState, useMemo } from "react";

/* ── Icon helper (Material Symbols) ── */
const Icon = ({ name, size = 20, className = "" }: { name: string; size?: number; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`} style={{ fontSize: size, lineHeight: 1 }}>{name}</span>
);

/* ── Data Types ── */
interface AdData {
  title: string;
  desc: string;
  src: string;
  srcIcon: string;
  srcBg: string;
  srcColor: string;
  spend: number;
  klicks: number;
  bew: number;
  qual: number;
  gesp: number;
  ein: number;
}

/* ── Demo Data ── */
const ADS_30: AdData[] = [
  { title: "Senior React Dev – München", desc: "Carousel · \"Werde Teil unseres Teams\"", src: "LinkedIn", srcIcon: "work", srcBg: "bg-blue-50", srcColor: "text-blue-600", spend: 1840, klicks: 1420, bew: 48, qual: 22, gesp: 9, ein: 3 },
  { title: "DevOps Engineer – Remote", desc: "Single Image · \"100% Remote möglich\"", src: "LinkedIn", srcIcon: "work", srcBg: "bg-blue-50", srcColor: "text-blue-600", spend: 1260, klicks: 980, bew: 38, qual: 14, gesp: 6, ein: 2 },
  { title: "Fullstack Dev – Hamburg", desc: "Video · \"Ein Tag bei uns im Office\"", src: "Meta", srcIcon: "groups", srcBg: "bg-indigo-50", srcColor: "text-indigo-600", spend: 1480, klicks: 2180, bew: 42, qual: 12, gesp: 5, ein: 2 },
  { title: "Backend Entwickler – Frankfurt", desc: "Single Image · \"Dein nächster Karriereschritt\"", src: "LinkedIn", srcIcon: "work", srcBg: "bg-blue-50", srcColor: "text-blue-600", spend: 1180, klicks: 890, bew: 56, qual: 16, gesp: 6, ein: 2 },
  { title: "Frontend Dev – Berlin", desc: "Carousel · \"Gestalte die Zukunft\"", src: "Meta", srcIcon: "groups", srcBg: "bg-indigo-50", srcColor: "text-indigo-600", spend: 1200, klicks: 1860, bew: 40, qual: 12, gesp: 4, ein: 1 },
  { title: "QA Engineer – Stuttgart", desc: "Sponsored · \"Qualität hat Priorität\"", src: "Indeed", srcIcon: "person_search", srcBg: "bg-purple-50", srcColor: "text-purple-600", spend: 980, klicks: 750, bew: 28, qual: 8, gesp: 3, ein: 1 },
  { title: "IT Projektleiter – Köln", desc: "Story Ad · \"Führungsrolle übernehmen\"", src: "Meta", srcIcon: "groups", srcBg: "bg-indigo-50", srcColor: "text-indigo-600", spend: 680, klicks: 1540, bew: 18, qual: 4, gesp: 1, ein: 0 },
  { title: "Software Engineer – DACH", desc: "Search Ad · \"Software Jobs DACH\"", src: "Google", srcIcon: "search", srcBg: "bg-red-50", srcColor: "text-red-600", spend: 510, klicks: 620, bew: 12, qual: 3, gesp: 1, ein: 1 },
];

const ADS_90: AdData[] = [
  ...ADS_30,
  { title: "Data Engineer – Berlin", desc: "Carousel · \"Daten sind die Zukunft\"", src: "LinkedIn", srcIcon: "work", srcBg: "bg-blue-50", srcColor: "text-blue-600", spend: 2100, klicks: 1680, bew: 62, qual: 28, gesp: 12, ein: 4 },
  { title: "Mobile Dev – München", desc: "Video · \"Apps die begeistern\"", src: "Meta", srcIcon: "groups", srcBg: "bg-indigo-50", srcColor: "text-indigo-600", spend: 1950, klicks: 2840, bew: 55, qual: 18, gesp: 7, ein: 3 },
  { title: "Security Engineer – Remote", desc: "Single Image · \"Sicherheit zuerst\"", src: "Indeed", srcIcon: "person_search", srcBg: "bg-purple-50", srcColor: "text-purple-600", spend: 1420, klicks: 1100, bew: 35, qual: 12, gesp: 5, ein: 2 },
  { title: "UX Designer – Hamburg", desc: "Carousel · \"Design mit Wirkung\"", src: "LinkedIn", srcIcon: "work", srcBg: "bg-blue-50", srcColor: "text-blue-600", spend: 890, klicks: 720, bew: 24, qual: 9, gesp: 4, ein: 1 },
];

const CHART_30 = [
  { label: "KW 48", imp: 62, bew: 22, ein: 4 },
  { label: "KW 49", imp: 74, bew: 30, ein: 6 },
  { label: "KW 50", imp: 86, bew: 36, ein: 8 },
  { label: "KW 51", imp: 98, bew: 48, ein: 12 },
  { label: "KW 52", imp: 70, bew: 26, ein: 5 },
  { label: "KW 1", imp: 110, bew: 52, ein: 14 },
  { label: "KW 2", imp: 90, bew: 40, ein: 10 },
];

const CHART_90 = [
  { label: "Jan", imp: 70, bew: 22, ein: 7 },
  { label: "Feb", imp: 84, bew: 30, ein: 9 },
  { label: "Mär", imp: 78, bew: 26, ein: 8 },
  { label: "Apr", imp: 95, bew: 38, ein: 11 },
  { label: "Mai", imp: 105, bew: 44, ein: 14 },
  { label: "Jun", imp: 89, bew: 32, ein: 10 },
  { label: "Jul", imp: 98, bew: 36, ein: 12 },
  { label: "Aug", imp: 110, bew: 48, ein: 16 },
  { label: "Sep", imp: 92, bew: 34, ein: 11 },
  { label: "Okt", imp: 100, bew: 42, ein: 13 },
  { label: "Nov", imp: 88, bew: 30, ein: 10 },
  { label: "Dez", imp: 80, bew: 26, ein: 9 },
];

const NAV_ITEMS = [
  { id: "dashboard", icon: "dashboard", label: "Dashboard" },
  { id: "campaigns", icon: "campaign", label: "Kampagnen" },
  { id: "sources", icon: "ads_click", label: "Anzeigenquellen" },
  { id: "candidates", icon: "group", label: "Kandidaten" },
  { id: "roi", icon: "monitoring", label: "ROI-Berichte" },
];

const fmt = (n: number) => n.toLocaleString("de-DE");
const fmtEuro = (n: number) => `€${fmt(n)}`;

/* ── Helpers ── */
function aggregateSources(ads: AdData[]) {
  const map = new Map<string, { name: string; icon: string; bg: string; color: string; spend: number; bew: number; qual: number; gesp: number; ein: number }>();
  for (const ad of ads) {
    const existing = map.get(ad.src);
    if (existing) {
      existing.spend += ad.spend;
      existing.bew += ad.bew;
      existing.qual += ad.qual;
      existing.gesp += ad.gesp;
      existing.ein += ad.ein;
    } else {
      map.set(ad.src, { name: ad.src, icon: ad.srcIcon, bg: ad.srcBg, color: ad.srcColor, spend: ad.spend, bew: ad.bew, qual: ad.qual, gesp: ad.gesp, ein: ad.ein });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.ein - a.ein);
}

/* ══════════════════════════════════════════════ */
/*  MAIN COMPONENT                                */
/* ══════════════════════════════════════════════ */
const RecruitingDashboardPage = () => {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [timeRange, setTimeRange] = useState<"30" | "90">("30");
  const [adFilter, setAdFilter] = useState<"all" | "hired" | "none">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [exportToast, setExportToast] = useState(false);

  useEffect(() => {
    document.title = "Recruiting Ad Performance – Dashboard";
    window.scrollTo(0, 0);
  }, []);

  // Data based on time range
  const allAds = timeRange === "30" ? ADS_30 : ADS_90;
  const chartData = timeRange === "30" ? CHART_30 : CHART_90;

  // Filtered ads
  const filteredAds = useMemo(() => {
    let result = allAds;
    if (adFilter === "hired") result = result.filter((a) => a.ein > 0);
    if (adFilter === "none") result = result.filter((a) => a.ein === 0);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((a) => a.title.toLowerCase().includes(q) || a.src.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q));
    }
    if (sortCol) {
      result = [...result].sort((a, b) => {
        const av = a[sortCol as keyof AdData] as number;
        const bv = b[sortCol as keyof AdData] as number;
        return sortDir === "asc" ? av - bv : bv - av;
      });
    }
    return result;
  }, [allAds, adFilter, searchQuery, sortCol, sortDir]);

  // Aggregated KPIs
  const totalSpend = allAds.reduce((s, a) => s + a.spend, 0);
  const totalBew = allAds.reduce((s, a) => s + a.bew, 0);
  const totalQual = allAds.reduce((s, a) => s + a.qual, 0);
  const totalGesp = allAds.reduce((s, a) => s + a.gesp, 0);
  const totalEin = allAds.reduce((s, a) => s + a.ein, 0);
  const cph = totalEin > 0 ? Math.round(totalSpend / totalEin) : 0;
  const totalKlicks = allAds.reduce((s, a) => s + a.klicks, 0);

  const sources = useMemo(() => aggregateSources(allAds), [allAds]);

  // Sort handler
  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  };

  const SortHeader = ({ col, label, align = "right" }: { col: string; label: string; align?: string }) => (
    <th
      className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 transition-colors select-none ${align === "right" ? "text-right" : ""}`}
      onClick={() => handleSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortCol === col && (
          <Icon name={sortDir === "asc" ? "arrow_upward" : "arrow_downward"} size={14} className="text-[#136dec]" />
        )}
      </span>
    </th>
  );

  // Export handler
  const handleExport = () => {
    setExportToast(true);
    setTimeout(() => setExportToast(false), 2500);
  };

  // Funnel data
  const funnelSteps = [
    { label: "Ad Impressionen", value: fmt(totalKlicks * 50), pct: "100%", pctColor: "text-slate-700", barPct: 100, barColor: "bg-slate-400" },
    { label: "Klicks zur Seite", value: fmt(totalKlicks), pct: `${((totalKlicks / (totalKlicks * 50)) * 100).toFixed(1)}%`, pctColor: "text-amber-600", barPct: 60, barColor: "bg-blue-400" },
    { label: "Bewerbungen", value: fmt(totalBew), pct: `${((totalBew / totalKlicks) * 100).toFixed(1)}%`, pctColor: "text-blue-600", barPct: 42, barColor: "bg-[#136dec]" },
    { label: "Qualifizierte Kandidaten", value: fmt(totalQual), pct: `${totalBew > 0 ? ((totalQual / totalBew) * 100).toFixed(0) : 0}%`, pctColor: "text-violet-600", barPct: 28, barColor: "bg-violet-500" },
    { label: "Bewerbungsgespräche", value: fmt(totalGesp), pct: `${totalQual > 0 ? ((totalGesp / totalQual) * 100).toFixed(0) : 0}%`, pctColor: "text-orange-600", barPct: 18, barColor: "bg-orange-400" },
    { label: "Einstellungen", value: fmt(totalEin), pct: `${totalGesp > 0 ? ((totalEin / totalGesp) * 100).toFixed(0) : 0}%`, pctColor: "text-emerald-600", barPct: 10, barColor: "bg-emerald-500" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f7f8] text-slate-900 antialiased" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Toast ── */}
      {exportToast && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-[fadeIn_0.2s_ease-out]">
          <Icon name="check_circle" size={22} className="text-emerald-400" />
          <span className="text-sm font-medium">PDF wird erstellt und heruntergeladen...</span>
        </div>
      )}

      {/* ── Side Navigation ── */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#136dec] flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Icon name="rocket_launch" size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">RecruitFlow</h1>
              <p className="text-xs text-slate-500 font-medium">Analytics Console</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-left ${
                activeNav === item.id
                  ? "bg-[#136dec]/10 text-[#136dec] font-semibold shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon name={item.icon} size={20} />
              <span className="text-sm">{item.label}</span>
              {activeNav === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#136dec]"></div>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-1">
          <button
            onClick={() => setActiveNav("settings")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
              activeNav === "settings" ? "bg-slate-100 text-slate-900 font-semibold" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Icon name="settings" size={20} />
            <span className="text-sm">Einstellungen</span>
          </button>
          <div className="flex items-center gap-3 px-3 py-4 mt-2 border-t border-slate-100">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-sm">MK</div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate">Marie Koch</p>
              <p className="text-xs text-slate-500 truncate">HR Marketing Lead</p>
            </div>
            <Icon name="expand_more" size={18} className="text-slate-400" />
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-y-auto bg-[#f6f7f8]">

        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-5 bg-white/90 backdrop-blur-md border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Recruiting Ad Performance</h2>
            <p className="text-sm text-slate-500 mt-0.5">Aktualisiert vor 12 Minuten · {timeRange === "30" ? "Letzte 30 Tage" : "Letzte 90 Tage"}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
              <button
                onClick={() => setTimeRange("30")}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${timeRange === "30" ? "bg-white shadow-sm border border-slate-200 text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
              >
                30 Tage
              </button>
              <button
                onClick={() => setTimeRange("90")}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${timeRange === "90" ? "bg-white shadow-sm border border-slate-200 text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
              >
                90 Tage
              </button>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 px-4 py-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors">
              <Icon name="calendar_month" size={18} className="text-slate-500" />
              <span className="text-sm font-medium">{timeRange === "30" ? "01.01. – 31.01.2025" : "01.10.2024 – 31.01.2025"}</span>
            </div>
            <button
              onClick={handleExport}
              className="bg-[#136dec] text-white text-sm font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-[#1060d4] active:scale-[0.97] transition-all shadow-sm"
            >
              <Icon name="download" size={18} />
              PDF Export
            </button>
          </div>
        </header>

        {/* Content varies by nav */}
        {activeNav === "dashboard" ? (
          <div className="p-8 max-w-[1400px] mx-auto space-y-8">

            {/* ── KPI Row ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: "Ad Spend", value: fmtEuro(totalSpend), icon: "payments", iconColor: "text-blue-500", bgColor: "bg-blue-50", change: "+12%", up: true, barColor: "bg-[#136dec]", pct: 65 },
                { label: "Bewerbungen", value: fmt(totalBew), icon: "description", iconColor: "text-blue-500", bgColor: "bg-blue-50", change: "+18%", up: true, barColor: "bg-[#136dec]", pct: 78 },
                { label: "Qualifiziert", value: fmt(totalQual), icon: "verified", iconColor: "text-violet-500", bgColor: "bg-violet-50", change: "+9%", up: true, barColor: "bg-violet-500", pct: 55 },
                { label: "Gespräche", value: fmt(totalGesp), icon: "videocam", iconColor: "text-orange-500", bgColor: "bg-orange-50", change: "+21%", up: true, barColor: "bg-orange-400", pct: 62 },
                { label: "Einstellungen", value: fmt(totalEin), icon: "person_add", iconColor: "text-emerald-500", bgColor: "bg-emerald-50", change: "+33%", up: true, barColor: "bg-emerald-500", pct: 80 },
                { label: "Kosten/Hire", value: fmtEuro(cph), icon: "savings", iconColor: "text-emerald-500", bgColor: "bg-emerald-50", change: "-8%", up: false, barColor: "bg-emerald-500", pct: 40, accent: true },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className={`bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-default ${kpi.accent ? "border-l-4 border-l-[#136dec]" : ""}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{kpi.label}</p>
                    <div className={`h-7 w-7 rounded-lg ${kpi.bgColor} flex items-center justify-center`}>
                      <Icon name={kpi.icon} size={16} className={kpi.iconColor} />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">{kpi.value}</span>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${kpi.up ? "text-emerald-600 bg-emerald-50" : "text-emerald-600 bg-emerald-50"}`}>
                      <Icon name={kpi.up ? "trending_up" : "arrow_downward"} size={14} />
                      {kpi.change}
                    </span>
                  </div>
                  <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${kpi.barColor} rounded-full transition-all duration-500`} style={{ width: `${kpi.pct}%` }}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Chart + Funnel ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Bar Chart */}
              <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-900">
                    {timeRange === "30" ? "Bewerbungen pro Kalenderwoche" : "Bewerbungen pro Monat"}
                  </h3>
                  <div className="flex items-center gap-5">
                    {[
                      { color: "bg-slate-300", label: "Impressionen" },
                      { color: "bg-blue-400", label: "Bewerbungen" },
                      { color: "bg-[#136dec]", label: "Einstellungen" },
                    ].map((l) => (
                      <div key={l.label} className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-sm ${l.color}`}></span>
                        <span className="text-xs font-medium text-slate-500">{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative h-80 w-full bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                  {/* Y-Axis labels */}
                  <div className="absolute left-0 inset-y-0 w-10 flex flex-col justify-between py-6 pointer-events-none z-10">
                    {["200", "150", "100", "50", "0"].map((v) => (
                      <span key={v} className="text-[10px] text-slate-400 text-right pr-2">{v}</span>
                    ))}
                  </div>
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between py-6 ml-10 pointer-events-none">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="border-t border-dashed border-slate-200 w-full"></div>
                    ))}
                  </div>
                  {/* Bars container */}
                  <div className="absolute inset-0 ml-12 mr-4 flex items-end gap-3 pb-2">
                    {chartData.map((w) => (
                      <div key={w.label} className="flex-1 flex flex-col justify-end gap-1 group relative pb-8">
                        <div className="w-full bg-slate-300 rounded-t-md group-hover:bg-slate-400 transition-colors cursor-pointer" style={{ height: w.imp }}></div>
                        <div className="w-full bg-blue-400 rounded-t-md group-hover:bg-blue-500 transition-colors cursor-pointer" style={{ height: w.bew }}></div>
                        <div className="w-full bg-[#136dec] rounded-t-md group-hover:bg-[#1a7af7] transition-colors cursor-pointer" style={{ height: w.ein }}></div>
                        <span className="text-xs text-slate-500 mt-3 text-center font-semibold">{w.label}</span>
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                          <div className="font-bold mb-1">{w.label}</div>
                          <div>Impressionen: {w.imp}k</div>
                          <div>Bewerbungen: {w.bew}</div>
                          <div>Einstellungen: {w.ein}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chart summary stats */}
                <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xl font-bold text-slate-900">{fmt(chartData.reduce((s, w) => s + w.bew, 0))}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Bewerbungen gesamt</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-[#136dec]">{fmt(chartData.reduce((s, w) => s + w.ein, 0))}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Einstellungen gesamt</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-emerald-600">
                      {chartData.reduce((s, w) => s + w.bew, 0) > 0
                        ? ((chartData.reduce((s, w) => s + w.ein, 0) / chartData.reduce((s, w) => s + w.bew, 0)) * 100).toFixed(1)
                        : "0"}%
                    </p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Ø Einstellungsrate</p>
                  </div>
                </div>
              </div>

              {/* Recruiting Funnel */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-slate-900">Recruiting Funnel</h3>
                  <div className="relative group">
                    <Icon name="info" size={20} className="text-slate-400 cursor-help hover:text-slate-600 transition-colors" />
                    <div className="absolute right-0 top-full mt-2 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48 shadow-lg z-10">
                      Konversionsraten zwischen den einzelnen Recruiting-Stufen
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  {funnelSteps.map((step, i) => (
                    <div key={step.label}>
                      {i > 0 && (
                        <div className="flex justify-center py-0.5">
                          <Icon name="keyboard_arrow_down" size={18} className="text-slate-300" />
                        </div>
                      )}
                      <div className="flex justify-between items-end mb-1">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{step.label}</p>
                        <p className={`text-sm font-bold ${step.pctColor}`}>{step.pct}</p>
                      </div>
                      <div className="h-10 w-full bg-slate-100 rounded-lg relative overflow-hidden flex items-center group cursor-default">
                        <div
                          className={`absolute inset-y-0 left-0 ${step.barColor} rounded-lg transition-all duration-500`}
                          style={{ width: `${step.barPct}%` }}
                        ></div>
                        <span className={`relative z-10 text-sm font-bold px-4 ${step.barPct > 30 ? "text-white" : "text-slate-700"}`}>
                          {step.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex items-start gap-2 bg-rose-50 border border-rose-100 rounded-lg p-3">
                    <Icon name="warning" size={18} className="text-rose-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm font-medium text-rose-700 leading-snug">Absprungrate bei Formular­schritt 2 ("Erfahrung") erhöht – 42% brechen ab.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Anzeigenquellen Tabelle ── */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Anzeigenquellen – Übersicht</h3>
                <span className="text-xs text-slate-400 font-medium">CPH = Cost per Hire</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Quelle</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ausgaben</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Bewerbungen</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Qualifiziert</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Gespräche</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Einstellungen</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Performance</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">CPH</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sources.map((src) => {
                      const maxEin = Math.max(...sources.map((s) => s.ein));
                      const perfPct = maxEin > 0 ? Math.round((src.ein / maxEin) * 100) : 0;
                      const srcCph = src.ein > 0 ? Math.round(src.spend / src.ein) : null;
                      return (
                        <tr key={src.name} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`h-9 w-9 rounded-lg ${src.bg} flex items-center justify-center`}>
                                <Icon name={src.icon} size={18} className={src.color} />
                              </div>
                              <span className="text-sm font-bold text-slate-800">{src.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-semibold text-slate-600">{fmtEuro(src.spend)}</td>
                          <td className="px-6 py-4 text-right text-sm font-bold text-slate-900">{fmt(src.bew)}</td>
                          <td className="px-6 py-4 text-right text-sm font-bold text-slate-900">{fmt(src.qual)}</td>
                          <td className="px-6 py-4 text-right text-sm font-bold text-slate-900">{fmt(src.gesp)}</td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100">{src.ein}</span>
                          </td>
                          <td className="px-6 py-4 w-44">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-[#136dec] rounded-full transition-all duration-500" style={{ width: `${perfPct}%` }}></div>
                              </div>
                              <span className="text-xs font-bold text-slate-500 w-8 text-right">{perfPct}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-bold text-slate-900">{srcCph ? fmtEuro(srcCph) : "–"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Einzelne Anzeigen ── */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Einzelne Anzeigen – Funnel-Tracking</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Welche Anzeige bringt Leads und tatsächliche Einstellungen?</p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Filter Tabs */}
                  <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                    {([
                      { key: "all", label: "Alle" },
                      { key: "hired", label: "Mit Einstellungen" },
                      { key: "none", label: "Ohne Ergebnis" },
                    ] as const).map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setAdFilter(f.key)}
                        className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
                          adFilter === f.key ? "bg-white shadow-sm border border-slate-200 text-slate-900" : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  {/* Search */}
                  <div className="relative">
                    <input
                      className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg w-52 focus:ring-2 focus:ring-[#136dec]/20 focus:border-[#136dec] outline-none transition-all"
                      placeholder="Anzeige suchen..."
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Icon name="search" size={18} className="absolute left-2.5 top-2.5 text-slate-400" />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-2.5">
                        <Icon name="close" size={16} className="text-slate-400 hover:text-slate-600" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Anzeige</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Quelle</th>
                      <SortHeader col="spend" label="Ausgaben" />
                      <SortHeader col="klicks" label="Klicks" />
                      <SortHeader col="bew" label="Bewerbungen" />
                      <SortHeader col="qual" label="Qualifiziert" />
                      <SortHeader col="gesp" label="Gespräche" />
                      <SortHeader col="ein" label="Einst." />
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Funnel</th>
                      <SortHeader col="cph" label="CPH" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAds.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-12 text-center">
                          <Icon name="search_off" size={32} className="text-slate-300 mx-auto mb-2" />
                          <p className="text-sm text-slate-500">Keine Anzeigen gefunden</p>
                          <button onClick={() => { setSearchQuery(""); setAdFilter("all"); }} className="text-sm text-[#136dec] font-semibold mt-2 hover:underline">
                            Filter zurücksetzen
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredAds.map((ad) => {
                        const adCph = ad.ein > 0 ? Math.round(ad.spend / ad.ein) : null;
                        const maxBew = Math.max(...allAds.map((a) => a.bew));
                        const funnelSegs = [
                          { pct: 100, color: "bg-slate-400" },
                          { pct: maxBew > 0 ? Math.round((ad.bew / maxBew) * 100) : 0, color: "bg-blue-400" },
                          { pct: ad.bew > 0 ? Math.round((ad.qual / ad.bew) * 100) : 0, color: "bg-violet-500" },
                          { pct: ad.qual > 0 ? Math.round((ad.gesp / ad.qual) * 100) : 0, color: "bg-orange-400" },
                          { pct: ad.gesp > 0 ? Math.round((ad.ein / ad.gesp) * 100) : 0, color: ad.ein > 0 ? "bg-emerald-500" : "bg-slate-200" },
                        ];
                        return (
                          <tr
                            key={ad.title}
                            className={`hover:bg-slate-50 transition-colors ${ad.ein >= 2 ? "bg-emerald-50/30" : ""}`}
                          >
                            <td className="px-6 py-4">
                              <div>
                                <span className="text-sm font-bold text-slate-800">{ad.title}</span>
                                <p className="text-xs text-slate-500 mt-0.5">{ad.desc}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className={`h-7 w-7 rounded-lg ${ad.srcBg} flex items-center justify-center`}>
                                  <Icon name={ad.srcIcon} size={14} className={ad.srcColor} />
                                </div>
                                <span className="text-xs font-semibold text-slate-600">{ad.src}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-semibold text-slate-600">{fmtEuro(ad.spend)}</td>
                            <td className="px-6 py-4 text-right text-sm font-bold text-slate-900">{fmt(ad.klicks)}</td>
                            <td className="px-6 py-4 text-right text-sm font-bold text-slate-900">{fmt(ad.bew)}</td>
                            <td className="px-6 py-4 text-right text-sm font-bold text-slate-900">{fmt(ad.qual)}</td>
                            <td className="px-6 py-4 text-right text-sm font-bold text-slate-900">{fmt(ad.gesp)}</td>
                            <td className="px-6 py-4 text-right">
                              {ad.ein > 0 ? (
                                <span className={`text-sm font-bold px-2.5 py-1 rounded border ${ad.ein >= 2 ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-amber-600 bg-amber-50 border-amber-100"}`}>
                                  {ad.ein}
                                </span>
                              ) : (
                                <span className="text-sm font-bold text-slate-300 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">0</span>
                              )}
                            </td>
                            <td className="px-6 py-4 w-36">
                              <div className="flex gap-0.5 items-center">
                                {funnelSegs.map((seg, j) => (
                                  <div
                                    key={j}
                                    className={`h-3 flex-1 bg-slate-100 overflow-hidden ${j === 0 ? "rounded-l-full" : ""} ${j === 4 ? "rounded-r-full" : ""}`}
                                  >
                                    <div className={`h-full ${seg.color} transition-all duration-300`} style={{ width: `${seg.pct}%` }}></div>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className={`text-sm font-bold ${ad.ein >= 2 ? "text-emerald-600" : ad.ein === 1 ? "text-amber-600" : "text-slate-300"}`}>
                                {adCph ? fmtEuro(adCph) : "–"}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <p className="text-xs font-medium text-slate-500">
                    {filteredAds.length} von {allAds.length} Anzeigen
                    {adFilter !== "all" && <span className="text-[#136dec]"> (gefiltert)</span>}
                  </p>
                  <div className="flex items-center gap-4">
                    {[
                      { color: "bg-slate-400", label: "Klicks" },
                      { color: "bg-blue-400", label: "Bewerbungen" },
                      { color: "bg-violet-500", label: "Qualifiziert" },
                      { color: "bg-orange-400", label: "Gespräche" },
                      { color: "bg-emerald-500", label: "Einstellungen" },
                    ].map((l) => (
                      <div key={l.label} className="flex items-center gap-1.5">
                        <div className={`h-3 w-5 ${l.color} rounded-sm`}></div>
                        <span className="text-xs text-slate-500">{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* ── Placeholder für andere Tabs ── */
          <div className="flex-1 flex items-center justify-center p-20">
            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Icon name={NAV_ITEMS.find((n) => n.id === activeNav)?.icon || "settings"} size={32} className="text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {NAV_ITEMS.find((n) => n.id === activeNav)?.label || "Einstellungen"}
              </h3>
              <p className="text-sm text-slate-500 max-w-md">
                Dieser Bereich wird gerade eingerichtet. Wechsle zum Dashboard, um die aktuelle Ad Performance zu sehen.
              </p>
              <button
                onClick={() => setActiveNav("dashboard")}
                className="mt-4 bg-[#136dec] text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-[#1060d4] active:scale-[0.97] transition-all"
              >
                Zurück zum Dashboard
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default RecruitingDashboardPage;
