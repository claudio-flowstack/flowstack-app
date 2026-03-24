/**
 * Landing Page Content Configuration
 * Brand: Flowstack Systems
 * Style: Dark theme with gold accents
 * Content: German - KI-Automatisierung für Agenturen & B2B-Dienstleister
 * Framework: Conversion-optimized
 */

// ============================================
// Section 1: Hero
// ============================================
export const siteConfig = {
  name: "Flowstack Systems",
  eyebrow: "Für Agenturen & B2B-Dienstleister",
  title: "Deine Agentur auf Autopilot",
  titleAccent: "",
  tagline:
    "Automatisiere durch unser Flowstack-System jeden manuellen Handgriff in deiner Agentur vom Onboarding bis zur abgeschlossenen Dienstleistung und steigere deine Umsatzrendite auf 50%+",
  bulletPoints: [
    "Das Flowstack-System ersetzt 80% - 90% deiner zeitfressenden Routineaufgaben durch KI-Workflows, die rund um die Uhr arbeiten",
    "In nur 10 Minuten vom Onboarding bis hin zur fertig deliverten Dienstleistung",
    "Ab sofort läuft dein Fulfillment automatisch. Ohne Krankmeldungen, ohne Urlaubsvertretung, ohne Motivationslöcher.",
    "Nimm bis zu 5x mehr Kunden an ohne deine Personalkosten zu steigern und verwandle deine Agency zu einer Cashflow Agentur",
  ],
  cta: {
    text: "Jetzt kostenlose Prozess-Analyse sichern",
    href: "/kostenlose-beratung",
    isInternal: true,
  },
  ctaSubtext: "Done-for-You KI-Automation für Agenturen",
  available: true,
};

// ============================================
// Navigation Links
// ============================================
export const navLinks = [
  { label: "System", href: "#system" },
  { label: "Leistungen", href: "#leistungen" },
  { label: "Team", href: "#team" },
  { label: "FAQ", href: "#faq" },
];

// ============================================
// Section 2: Trust Strip (Metriken)
// ============================================
export const trustMetrics = {
  metrics: [
    { value: "80%", label: "weniger Routinearbeit möglich" },
    { value: "2-4 Wochen", label: "bis dein System live ist" },
    { value: "30-50%", label: "mehr Umsatzrendite durch Automation" },
    { value: "0", label: "zusätzliche Einstellungen nötig" },
  ],
};

export const tools = [
  { name: "Make", logo: "https://cdn.simpleicons.org/make/ffffff" },
  { name: "Airtable", logo: "https://cdn.simpleicons.org/airtable/ffffff" },
  { name: "Notion", logo: "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png" },
  { name: "Slack", logo: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg" },
  { name: "Zapier", logo: "https://upload.wikimedia.org/wikipedia/commons/f/fd/Zapier_logo.svg" },
  { name: "HubSpot", logo: "https://upload.wikimedia.org/wikipedia/commons/3/3f/HubSpot_Logo.svg" },
  { name: "OpenAI", logo: "https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg" },
  { name: "n8n", logo: "https://cdn.simpleicons.org/n8n/ffffff" },
];

// ============================================
// Section 3: Empathy Opening
// ============================================
export const empathyOpening = {
  headline: "Du arbeitest härter als je zuvor. Und trotzdem bleibt am Monatsende nicht mehr übrig?",
  paragraphs: [
    "Es liegt nicht an dir.",
    "Du hast alles richtig gemacht: Kunden gewonnen, ein Team aufgebaut, Prozesse etabliert. Aber niemand hat dir gesagt, dass \"mehr Kunden = mehr Mitarbeiter = gleiche Umsatzrendite\" eine Sackgasse ist.",
  ],
  painPoints: [
    "Die endlosen Slack-Nachrichten, die dich ständig aus dem Fokus reißen",
    "Mitarbeiter, die für Routine-Aufgaben viel zu lange brauchen",
    "Das Gefühl, selbst der größte Engpass im eigenen Unternehmen zu sein",
    "Die Frage: \"Wann arbeite ich endlich AM statt IM Business?\"",
  ],
  empathy: "DU BIST NICHT ALLEIN.",
  closing: "Viele Agenturinhaber stehen genau da, wo du jetzt stehst. Es gibt einen anderen Weg.\n\nUnd wir zeigen dir, wie.",
};

// ============================================
// Section 4: Problem Mirror (6 Störfaktoren)
// ============================================
export const problemSection = {
  headline: "Welcher dieser 6 Engpässe bremst dein Wachstum?",
  subheadline: "Was wäre, wenn dein stagnierendes Wachstum nicht an dir liegt, sondern an einem dieser Störfaktoren, die deine Skalierung sabotieren?",
  problems: [
    {
      icon: "TrendingDown",
      label: "STÖRFAKTOR 1",
      title: "Deine Umsatzrendite schrumpft mit jedem neuen Kunden",
      description: "Mehr Umsatz, aber nicht mehr Gewinn? Jeder neue Kunde bedeutet: neuer Mitarbeiter. Deine Umsatzrendite bleibt bei 15-25%, egal wie viel du umsetzt.",
    },
    {
      icon: "User",
      label: "STÖRFAKTOR 2",
      title: "Du bist der Flaschenhals",
      description: "Ohne dich läuft nichts. Jede Entscheidung, jede Freigabe, jedes Problem landet auf deinem Tisch. Urlaub? Nur mit Laptop.",
    },
    {
      icon: "Clock",
      label: "STÖRFAKTOR 3",
      title: "Dein Team ertrinkt in Routinearbeit",
      description: "Deine besten Leute verbringen 60% ihrer Zeit mit Copy-Paste, Datenübertragung und Kleinkram. Nicht mit dem, wofür du sie eingestellt hast.",
    },
    {
      icon: "Layers",
      label: "STÖRFAKTOR 4",
      title: "Tool-Chaos frisst Zeit",
      description: "12 Tools, die nicht miteinander sprechen. Daten manuell hin- und herkopieren. Fehler durch Medienbrüche. Jeden. Einzelnen. Tag.",
    },
    {
      icon: "AlertTriangle",
      label: "STÖRFAKTOR 5",
      title: "Qualität schwankt mit der Tagesform",
      description: "Montags liefert Team-Mitglied A perfekt. Dienstags macht B den gleichen Job, halb so gut. Kein Standard, keine Konstanz.",
    },
    {
      icon: "XCircle",
      label: "STÖRFAKTOR 6",
      title: "Du lehnst Neukunden ab",
      description: "Die Anfragen sind da. Aber du weißt: Mehr Kunden = mehr Chaos. Also sagst du ab und lässt Umsatz auf der Straße liegen.",
    },
  ],
  conclusion: "",
};

// ============================================
// Section 5: Solution Preview (NEU)
// ============================================
export const solutionPreview = {
  headline: "Stell dir vor, das wäre ab nächsten Monat deine Realität:",
  benefits: [
    {
      icon: "DollarSign",
      title: "DOPPELTE MARGE BEI GLEICHEM UMSATZ",
      description: "Deine Gewinnmarge springt von 20% auf 40-50%+, weil KI-Workflows für Centbeträge arbeiten, nicht für Gehälter. Bei 100k Umsatz sind das 20-30k mehr Gewinn. Jeden Monat.",
    },
    {
      icon: "Zap",
      title: "DEIN TEAM ARBEITET NUR NOCH AN DEM, WAS ZÄHLT",
      description: "80% der Routinearbeit läuft automatisch. Deine Leute konzentrieren sich auf Strategie, Kundenbeziehungen und kreative Arbeit. Nicht auf Copy-Paste und Datenpflege.",
    },
    {
      icon: "TrendingUp",
      title: "7-STELLIGE JAHRESUMSÄTZE ALS AGENTUR MIT 1-2 MITARBEITERN",
      description: "KI übernimmt 90% der Aufgaben für die du vorher teure Mitarbeiter gebraucht hast. So kannst du deine Agentur schlank führen oder bestehende Mitarbeiter für umsatzbringende Aktivitäten umschichten, während du gleichzeitig mehr Freizeit und weniger Stress hast.",
    },
  ],
  closing: "Das ist keine Zukunftsmusik. Das passiert, wenn das Flowstack-System in deiner Agentur läuft.",
};

// ============================================
// Section 6: Flowstack System (4 Stufen)
// ============================================
export const flowstackSystem = {
  headline: "Das Flowstack-System: Dein Weg zu 50%+ Umsatzrendite in 4 klaren Stufen",
  subheadline: "Wir implementieren KI-Workflows, die deine Routineprozesse automatisieren. Done-for-You, schlüsselfertig, in 2-4 Wochen live.",
  stages: [
    {
      number: "1",
      icon: "Search",
      title: "ANALYSE",
      subtitle: "Deine Prozesse auf dem Prüfstand",
      duration: "Woche 1",
      description: "Wir finden die größten Zeitfresser in deiner Agentur.",
      items: [
        "Identifikation der Prozesse mit dem höchsten Automatisierungspotenzial",
        "Klare Roadmap: Was wird automatisiert, in welcher Reihenfolge",
      ],
      result: "Du weißt genau, wo das meiste Potenzial liegt.",
    },
    {
      number: "2",
      icon: "PenTool",
      title: "ARCHITEKTUR",
      subtitle: "Dein Fulfillment wird systematisiert",
      duration: "Woche 1-2",
      description: "Wir übersetzen deine Agenturprozesse in ein automatisiertes System.",
      items: [
        "Strukturierung deines kompletten Fulfillment-Ablaufs von Lead → Onboarding → Umsetzung",
        "Definition aller Automations-Schritte inkl. Datenflüsse, KI-Verarbeitung und Übergabepunkte",
      ],
      result: "Ein klarer End-to-End-Prozess, der reproduzierbar, kontrollierbar und skalierbar funktioniert.",
    },
    {
      number: "3",
      icon: "Rocket",
      title: "AUTOMATION",
      subtitle: "Wir bauen, du lehnst dich zurück",
      duration: "Woche 2-4",
      description: "Done-for-You Implementation durch unser Team.",
      items: [
        "Komplette technische Umsetzung aller Workflows",
        "Testing und Feinabstimmung bis alles läuft",
      ],
      result: "Dein System ist live und arbeitet für dich.",
    },
    {
      number: "4",
      icon: "TrendingUp",
      title: "SKALIERUNG",
      subtitle: "Dein System wächst mit",
      duration: "Ongoing",
      description: "Kontinuierliche Optimierung und Erweiterung.",
      items: [
        "Support und regelmäßige Check-ins",
        "Erweiterung auf weitere Prozesse bei Bedarf",
      ],
      result: "Ein System, das immer besser wird.",
    },
  ],
  closing: "",
};

// ============================================
// Section 7: Case Studies
// ============================================
export const caseStudiesSection = {
  headline: "Echte Ergebnisse von echten Agenturen:",
  headlineAccent: "",
  subheadline: "",
};

export interface CaseStudy {
  category: string;
  teamSize: string;
  problem: string;
  solution: string;
  results: {
    value: string;
    label: string;
  }[];
  quote: string;
  author: {
    role: string;
    name?: string;
    title?: string;
    company?: string;
    image?: string;
  };
  // Legacy properties for backward compatibility
  title?: string;
  challenge?: string;
  videoThumbnail?: string;
  metrics?: { value: string; label: string }[];
}

export const caseStudies: CaseStudy[] = [
  {
    category: "SOCIAL-MEDIA-AGENTUR",
    teamSize: "8 Mitarbeiter",
    problem: "\"Wir haben 30+ Kunden betreut und für jeden manuell Reports erstellt, Content eingeplant und Ads hochgeladen. 2 Vollzeit-Leute nur für Routine.\"",
    solution: "Automatisiertes Reporting, KI-Content-Planung, Auto-Upload mit Freigabe-Workflow",
    results: [
      { value: "73%", label: "weniger Zeitaufwand" },
      { value: "1.5", label: "Mitarbeiter umgeschichtet" },
      { value: "18% → 41%", label: "Umsatzrenditen-Steigerung" },
    ],
    quote: "\"Wir betreuen jetzt 45 Kunden mit weniger Aufwand als vorher bei 30.\"",
    author: { role: "Geschäftsführer", name: "Max M.", title: "Geschäftsführer", company: "Social Media Agentur", image: "https://via.placeholder.com/80x80?text=MM" },
    title: "73% weniger Zeitaufwand",
    challenge: "30+ Kunden mit manuellen Reports betreut",
    videoThumbnail: "https://via.placeholder.com/640x360?text=Case+Study",
    metrics: [{ value: "73%", label: "weniger Zeitaufwand" }, { value: "41%", label: "Umsatzrendite" }],
  },
  {
    category: "RECRUITING-AGENTUR",
    teamSize: "12 Mitarbeiter",
    problem: "\"Unser Kunden-Onboarding dauerte 10 Tage. Briefings aufnehmen, Stellenanzeigen schreiben, Kampagnen aufsetzen. Alles manuell.\"",
    solution: "KI-generierte Stellenanzeigen aus Briefing, automatisiertes Kampagnen-Setup, Self-Service Portal für Kunden",
    results: [
      { value: "48h", label: "statt 10 Tage Onboarding" },
      { value: "3x", label: "mehr Kundenkapazität" },
      { value: "22% → 47%", label: "Umsatzrenditen-Steigerung" },
    ],
    quote: "\"Der Game-Changer: Kunden sind in 2 Tagen live statt 2 Wochen.\"",
    author: { role: "Inhaberin", name: "Sandra L.", title: "Inhaberin", company: "Recruiting Agentur", image: "https://via.placeholder.com/80x80?text=SL" },
    title: "Onboarding in 48h statt 10 Tagen",
    challenge: "Kunden-Onboarding dauerte 10 Tage",
    videoThumbnail: "https://via.placeholder.com/640x360?text=Case+Study",
    metrics: [{ value: "48h", label: "Onboarding" }, { value: "47%", label: "Umsatzrendite" }],
  },
  {
    category: "PERFORMANCE-AGENTUR",
    teamSize: "6 Mitarbeiter",
    problem: "\"Projektmanagement war unser Albtraum. Ständig fehlten Infos, Kunden fragten nach Status, wir hatten keinen Überblick.\"",
    solution: "Automatische Status-Updates, KI-Meeting-Zusammenfassungen, intelligente Task-Zuweisung und Erinnerungen",
    results: [
      { value: "85%", label: "weniger Status-Rückfragen" },
      { value: "-35%", label: "Projektdauer" },
      { value: "+40%", label: "Kundenzufriedenheit" },
    ],
    quote: "\"Unsere Kunden fragen nicht mehr 'Wie ist der Stand?' Sie wissen es.\"",
    author: { role: "Creative Director", name: "Tom R.", title: "Creative Director", company: "Performance Agentur", image: "https://via.placeholder.com/80x80?text=TR" },
    title: "85% weniger Status-Rückfragen",
    challenge: "Projektmanagement ohne Überblick",
    videoThumbnail: "https://via.placeholder.com/640x360?text=Case+Study",
    metrics: [{ value: "85%", label: "weniger Rückfragen" }, { value: "-35%", label: "Projektdauer" }],
  },
];

// ============================================
// Section 8: CTA Inline
// ============================================
export const ctaInline = {
  primary: {
    headline: "Bereit herauszufinden, wie viel Potenzial in deiner Agentur steckt?",
    text: "In einem kostenlosen 15-20 Minuten Call analysieren wir:",
    bullets: [
      "Welche deiner Prozesse das größte Automatisierungs-Potenzial haben",
      "Wie viel Zeit und Geld du realistisch einsparen kannst",
      "Ob das Flowstack-System für deine Situation Sinn macht",
    ],
    closing: "",
    cta: "Jetzt kostenlose Prozess-Analyse buchen",
    subtext: "⏱️ Nur noch wenige Plätze für diesen Monat",
  },
  secondary: {
    headline: "Der beste Zeitpunkt war gestern. Der zweitbeste ist jetzt.",
    text: "In 15-20 Minuten weißt du:",
    bullets: [
      "Welche 3 Prozesse du zuerst automatisieren solltest",
      "Wie viel Umsatzrendite realistisch drin ist",
      "Ob wir die Richtigen für dich sind",
    ],
    cta: "Jetzt Termin für Prozess-Analyse wählen",
    subtext: "Kostenlos und unverbindlich.",
  },
};

// ============================================
// Section 9: Outcomes (Vorher/Nachher)
// ============================================
export const outcomes = {
  headline: "Das verändert sich, wenn das Flowstack-System läuft:",
  comparison: [
    {
      left: { icon: "TrendingUp", title: "Umsatzrendite:", highlight: "40%+", subtitle: "Mehr bleibt bei dir hängen" },
      right: { icon: "TrendingDown", title: "Umsatzrendite:", highlight: "15-25%", subtitle: "Kosten fressen den Gewinn" }
    },
    {
      left: { icon: "Shield", title: "", highlight: "Fehlerquote nahe null", subtitle: "Prozesse laufen jedes Mal gleich ab" },
      right: { icon: "AlertTriangle", title: "", highlight: "Fehler passieren täglich", subtitle: "Menschen vergessen, übersehen, vertun sich" }
    },
    {
      left: { icon: "Rocket", title: "", highlight: "Kunde in 10 Minuten abgewickelt", subtitle: "Schnelle Abwicklung, zufriedene Kunden" },
      right: { icon: "Clock", title: "", highlight: "4-8 Wochen bis zur Fertigstellung", subtitle: "Ständig warten, nachfragen, hinterherlaufen" }
    },
    {
      left: { icon: "Zap", title: "", highlight: "90% Fulfillment = ein Klick", subtitle: "System macht den Rest" },
      right: { icon: "RefreshCw", title: "", highlight: "Fulfillment = Handarbeit", subtitle: "Jeder Schritt manuell" }
    },
    {
      left: { icon: "TrendingUp", title: "", highlight: "Mehr Kunden = gleiche Leute", subtitle: "Besserer Output ohne Neueinstellungen" },
      right: { icon: "Users", title: "", highlight: "Mehr Kunden = mehr Leute", subtitle: "Output begrenzt durch Teamgröße" }
    },
    {
      left: { icon: "Eye", title: "Dein Alltag:", highlight: "Kontrolle", subtitle: "Du steuerst, statt zu rennen" },
      right: { icon: "Flame", title: "Dein Alltag:", highlight: "Stress", subtitle: "Ständig im operativen Chaos" }
    },
  ],
  stats: {
    headline: "Was KI-Automation für Agenturen verändert:",
    items: [
      "Onboarding, Reporting, Content-Erstellung, Kampagnen-Setup? Läuft automatisch im Hintergrund.",
      "Deine Umsatzrendite steigt, weil KI-Tools für wenige Euro im Monat arbeiten statt für Gehälter.",
      "Du kannst mehr Kunden annehmen ohne dein Team zu vergrößern. Das System skaliert mit.",
      "Weniger operative Arbeit für dich. Mehr Zeit für Strategie, Akquise und Kundenbeziehungen.",
    ],
  },
};

// ============================================
// Section 10: Target Audience
// ============================================
export const targetAudience = {
  headline: "Das Flowstack-System ist nicht für jeden.",
  subheadline: "Wir arbeiten nur mit Agenturen, die diese Voraussetzungen erfüllen:",
  requirements: [
    "Du führst eine Agentur oder B2B-Dienstleistung und willst auf das nächste Level",
    "Dein Monatsumsatz liegt bei 15.000€+ und du bist bereit zu skalieren",
    "Du willst mehr Kunden bedienen, ohne dafür mehr Leute einstellen zu müssen",
    "Du siehst Automation als Investment, nicht als Kostenfaktor",
  ],
  notFor: {
    headline: "Das Flowstack-System ist NICHT das Richtige für dich, wenn:",
    items: [
      "Dein Monatsumsatz liegt unter 10.000€ (Automation lohnt sich noch nicht)",
      "Jedes deiner Projekte ist 100% individuell ohne wiederholbare Prozesse",
      "Du suchst ein günstiges Tool zum Selbstbauen statt einer Done-for-You Lösung",
      "Du erwartest Wunder über Nacht statt nachhaltiger Transformation",
    ],
  },
  cta: {
    text: "Du erfüllst die Voraussetzungen? Dann lass uns herausfinden, wie viel Potenzial in deiner Agentur steckt.",
    button: "Jetzt Potenzial-Check starten",
  },
};

// ============================================
// Section 11: Services
// ============================================
export const services = {
  headline: "Was im Flowstack-System enthalten ist:",
  items: [
    {
      icon: "Search",
      title: "PROZESS-AUDIT & STRATEGIE",
      items: [
        "Vollständiges Audit aller Workflows",
        "Engpass-Identifikation & ROI-Priorisierung",
        "Strategische Automatisierungs-Roadmap",
        "Tool-Stack-Analyse und Empfehlungen",
      ],
    },
    {
      icon: "PenTool",
      title: "WORKFLOW-DESIGN & BLUEPRINTS",
      items: [
        "Individuelle Workflow-Architektur",
        "KI-Prompt-Engineering für deine Use Cases",
        "Integration-Spezifikationen",
        "Dokumentation & SOPs",
      ],
    },
    {
      icon: "Code",
      title: "DONE-FOR-YOU IMPLEMENTATION",
      items: [
        "Komplette technische Umsetzung",
        "n8n/Make Workflow-Entwicklung",
        "KI-Integration & Automatisierung",
        "API-Anbindungen & Tool-Verknüpfungen",
      ],
    },
    {
      icon: "Rocket",
      title: "GO-LIVE & FEINABSTIMMUNG",
      items: [
        "Testing unter realen Bedingungen",
        "Team-Einweisung & Übergabe",
        "14 Tage Feinabstimmung nach Go-Live",
        "Performance-Dashboard",
      ],
    },
    {
      icon: "Headphones",
      title: "ONGOING SUPPORT (OPTIONAL)",
      items: [
        "Regelmäßige Check-in Calls",
        "Priorisierter Support bei Fragen",
        "Kontinuierliche Workflow-Optimierung",
        "Erweiterung auf neue Prozesse",
      ],
    },
  ],
};

// ============================================
// Section 12: Timeline
// ============================================
export const timeline = {
  headline: "So läuft die Zusammenarbeit ab:",
  steps: [
    {
      icon: "Phone",
      title: "Kostenlose Prozess-Analyse (15-20 Min)",
      description: "Wir schauen gemeinsam auf deine Situation und identifizieren deine größten Automatisierungs-Hebel.",
    },
    {
      icon: "Target",
      title: "Strategie-Session (bei Match)",
      description: "Wenn es passt, gehen wir tiefer: 60-90 Minuten Deep-Dive in deine Prozesse. Du erhältst eine konkrete Roadmap.",
    },
    {
      icon: "FileText",
      title: "Angebot & Kick-Off",
      description: "Individuelles Angebot basierend auf deinem Scope. Bei Zusage: Sofortiger Projektstart.",
    },
    {
      icon: "Rocket",
      title: "Implementation (2-4 Wochen)",
      description: "Wir bauen dein Flowstack-System. Du gibst Feedback. Wir iterieren. Du lehnst dich zurück.",
    },
    {
      icon: "TrendingUp",
      title: "Go-Live & Skalierung",
      description: "Dein System geht live. Wir optimieren. Du genießt die neue Freiheit.",
    },
  ],
};

// ============================================
// Section 13: Team
// ============================================
export const teamContent = {
  headline: "Über uns",
  intro: "",
  members: [
    {
      name: "Claudio Di Franco",
      role: "Gründer, Vertrieb & Systemarchitekt",
      image: "/claudio.jpg",
      bio: "Claudio hat selbst eine Agentur aufgebaut und dabei am eigenen Leib erfahren, wie schnell \"mehr Kunden\" zu \"mehr Chaos\" wird. Statt weitere Mitarbeiter einzustellen, hat er angefangen, Prozesse zu automatisieren — und dabei festgestellt, dass die meisten Agenturen an denselben Stellen kämpfen.\n\nHeute hilft er anderen Agenturinhabern dabei, ihre operativen Prozesse so aufzubauen, dass sie auch ohne ständiges Micromanagement funktionieren. Sein Fokus: Systeme, die skalieren — nicht Systeme, die von einer Person abhängen.",
    },
    {
      name: "Anak Wannaphaschaiyong",
      role: "Automation & AI Engineer",
      image: "/anak.jpg",
      bio: "Anak ist studierter Machine Learning Spezialist mit einem Master der Florida Atlantic University. Er hat Cloud-basierte Systeme für Fortune-500-Unternehmen gebaut und ist publizierter Forscher im Bereich künstlicher Intelligenz.\n\nBei Flowstack ist er der technische Kopf hinter jeder Automation. Von AWS-Architekturen über Python-Skripte bis hin zu n8n und Make — Anak baut die Systeme, die unter Last performen und zuverlässig laufen.",
    },
  ],
};

// ============================================
// Section 14: Final CTA
// ============================================
export const finalCta = {
  headline: "Bereit für eine Agentur, die für dich arbeitet statt umgekehrt?",
  subheadline: "Sichere dir jetzt deine kostenlose Prozess-Analyse und erfahre, wie viel Potenzial in deiner Agentur steckt.",
  description: "",
  bullets: [
    "15-20 Minuten Call mit einem Flowstack-Experten",
    "Analyse deiner 3 größten Automatisierungs-Hebel",
    "Konkrete Einschätzung deiner möglichen Umsatzrendite",
    "Ehrliche Antwort, ob wir dir helfen können",
  ],
  cta: {
    text: "Jetzt kostenlose Prozess-Analyse sichern",
    href: "/kostenlose-beratung",
    isInternal: true,
  },
  trustElements: [
    "🔒 100% kostenlos und unverbindlich",
    "📞 Persönlicher Call mit einem Flowstack-Experten",
    "⏱️ Nur 3-4 Plätze pro Woche verfügbar",
  ],
  riskReversals: [
    "Kostenlos und unverbindlich",
    "Konkrete Analyse deiner Prozesse",
    "Kein Risiko für dich",
  ],
  trust: "Done-for-You in 2-4 Wochen",
};

// ============================================
// Section 15: FAQ
// ============================================
export interface FAQItem {
  question: string;
  answer: string;
}

export const faqItems: FAQItem[] = [
  {
    question: "Was kostet das Flowstack-System?",
    answer: "Das hängt von deinem Scope ab. Nach der kostenlosen Prozess-Analyse erstellen wir ein individuelles Angebot. Was wir sagen können: Die meisten Kunden erreichen den ROI innerhalb von 60-90 Tagen durch eingesparte Personalkosten und höhere Effizienz.",
  },
  {
    question: "Wie lange dauert die Implementation?",
    answer: "2-4 Wochen, abhängig vom Projektumfang. Kleinere Automationen können sogar schneller live gehen. Du siehst erste Ergebnisse oft schon nach wenigen Tagen.",
  },
  {
    question: "Muss ich technisch fit sein?",
    answer: "Nein. Wir machen alles Done-for-You. Du erklärst uns deine Prozesse, wir bauen die Automation. Null Technik-Skills erforderlich auf deiner Seite.",
  },
  {
    question: "Was wenn etwas nicht funktioniert?",
    answer: "Wir bieten 14 Tage Feinabstimmung nach Go-Live. Wenn ein Workflow nicht wie erwartet performt, optimieren wir ihn ohne Zusatzkosten.",
  },
  {
    question: "Funktioniert das auch für meine Branche?",
    answer: "Wir haben Erfahrung mit Marketing-Agenturen, Recruiting-Agenturen, Webdesign-Studios, Performance-Agenturen, Beratungen und anderen B2B-Dienstleistern. Im Erstgespräch klären wir, ob deine Prozesse automatisierbar sind.",
  },
  {
    question: "Ersetzt das Flowstack-System meine Mitarbeiter?",
    answer: "Es befreit sie. KI-Workflows übernehmen die langweilige Routine, sodass deine Leute sich auf wertvolle Arbeit konzentrieren können. Die meisten unserer Kunden stellen nicht weniger ein, sie setzen ihre Leute smarter ein.",
  },
  {
    question: "Ich nutze schon Zapier/Make. Was bringt mir das?",
    answer: "Super Basis! Das Flowstack-System hebt deine bestehenden Automationen auf das nächste Level: bessere Architektur, KI-Integration, professionelle Prompts und jemand, der das Ganze strategisch durchdenkt.",
  },
  {
    question: "Wie unterscheidet ihr euch von anderen Anbietern?",
    answer: "Drei Dinge: (1) Wir machen Done-for-You, nicht DIY-Kurse. (2) Wir kommen aus dem Agentur-Business, verstehen deine Welt. (3) Wir liefern in 2-4 Wochen, nicht in 6 Monaten.",
  },
];

// ============================================
// Footer
// ============================================
export const footerLinks = {
  social: [
    { label: "LinkedIn", href: "https://linkedin.com", icon: "Linkedin" },
  ],
  legal: [
    { label: "Datenschutz", href: "/datenschutz" },
    { label: "Impressum", href: "/impressum" },
  ],
};

// ============================================
// Meta / SEO
// ============================================
export const metaContent = {
  title: "KI-Automatisierung für Agenturen | Done-for-You in 2-4 Wochen | Flowstack Systems",
  description: "Verdopple deine Gewinnmarge durch KI-Automatisierung. Das Flowstack-System ersetzt zeitfressende Routineaufgaben. Done-for-You, schlüsselfertig. ✓ 80% weniger Routinearbeit ✓ 30-50% mehr Umsatzrendite ✓ 2-4 Wochen bis Go-Live",
};

// ============================================
// Legacy exports for backward compatibility
// ============================================
export const emotionalReframe = {
  headline: empathyOpening.headline,
  subheadline: "",
  content: empathyOpening.paragraphs.join("\n\n"),
};
export const problemMirror = problemSection;
export const differentiator = flowstackSystem;
export const benefits = {
  headline: outcomes.headline,
  items: outcomes.comparison.map((c) => ({
    icon: "Check",
    title: `${c.left.title} ${c.left.highlight}`,
    description: `Statt: ${c.right.title} ${c.right.highlight}`,
    metric: "",
  })),
};
export const comparison = {
  headline: "Das verändert sich, wenn das Flowstack-System läuft:",
  before: { title: "Manuell", items: outcomes.comparison.map(c => `${c.right.title} ${c.right.highlight}`) },
  after: { title: "Mit Flowstack", items: outcomes.comparison.map(c => `${c.left.title} ${c.left.highlight}`) },
};
export const processSteps = timeline.steps.map((s, idx) => ({
  step: String(idx + 1).padStart(2, '0'),
  title: s.title,
  subtitle: "",
  description: s.description,
  items: [] as string[],
}));
export const testimonials = caseStudies;

// Additional legacy exports
export const aboutContent = {
  title: "Über",
  description: teamContent.intro,
  stats: trustMetrics.metrics,
};

export const expertContent = {
  label: "Wer hinter Flowstack Systems steht",
  headline: teamContent.members[0].name,
  name: teamContent.members[0].name,
  experience: "Ex-Agenturinhaber",
  image: teamContent.members[0].image,
  paragraphs: teamContent.intro.split("\n\n"),
  credentials: trustMetrics.metrics,
};

export const consequences = {
  headline: "Die Kosten des Abwartens",
  subheadline: "",
  items: ["Verlorene Umsatzrendite", "Gebundene Zeit", "Verpasste Chancen"],
  costPerDay: {
    headline: "",
    items: [] as { metric: string; description: string }[],
  },
};

export const roiSection = {
  headline: "Skalierung ist eine strukturelle Entscheidung.",
  subheadline: "",
  items: [] as { metric: string; cost: string }[],
};

export const relief = {
  headline: "Was wegfällt",
  items: [
    "Manuelle Übergaben zwischen Abteilungen",
    "Wiederkehrende Rückfragen zu identischen Themen",
    "Individuelle Sonderlösungen für Standardprozesse",
    "Abhängigkeit von einzelnen Schlüsselpersonen",
    "Operatives Nacharbeiten durch unsaubere Abläufe",
    "Wachstum mit steigender Unsicherheit",
  ],
};

export const falseSolutions = {
  headline: "Diese Lösungen funktionieren nicht.",
  subheadline: "",
  solutions: [] as { title: string; icon: string; problem: string }[],
  conclusion: "",
  transition: { headline: "", text: "" },
};
