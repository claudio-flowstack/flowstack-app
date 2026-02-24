import { useState } from 'react'
import { aiChat, AI_MODELS, isPuterAvailable } from '@/core/ai/puter-ai'
import type { AIModel } from '@/core/ai/puter-ai'
import { Sparkles, Loader2, Copy, Check, Cpu, RefreshCw, Megaphone } from 'lucide-react'

// ── Ad-Frameworks mit konkreten Beispielen ──

interface AdFramework {
  name: string
  short: string
  structure: string[]
  promptGuide: string
  exampleAd: string
  bestFor: string
}

const AD_FRAMEWORKS: Record<string, AdFramework> = {
  'pas': {
    name: 'PAS',
    short: 'Problem → Agitate → Solution',
    structure: ['Problem benennen', 'Schmerz verstaerken', 'Loesung zeigen'],
    bestFor: 'Coaching, B2B, Dienstleistungen',
    promptGuide: `Schritt 1 PROBLEM: Nenne das groesste Problem der Zielgruppe in einem Satz. Sei spezifisch — keine generischen Floskeln. Nutze die Sprache die die Zielgruppe selbst benutzt.
Schritt 2 AGITATE: Verstaerke den Schmerz. Was passiert wenn sie NICHTS aendern? Welche Konsequenzen drohen? Male das Worst-Case-Szenario. Nutze "Stell dir vor..." oder "Du weisst genau...".
Schritt 3 SOLUTION: Praesentiere die Loesung als logischen naechsten Schritt. Kein Hard-Sell. Zeige das Ergebnis, nicht das Produkt. Spezifische Zahlen > vage Versprechen.`,
    exampleAd: `Du postest 5x die Woche — aber deine DMs bleiben leer.

Das Problem ist nicht dein Content. Es ist dein System. Ohne klare Strategie verbrennst du Stunden fuer Likes die nie zu Kunden werden. Und jeden Monat ziehen Mitbewerber an dir vorbei die halb so gut sind.

In 12 Wochen bauen wir dein Akquise-System das 15-30 qualifizierte Anfragen pro Monat bringt. Ohne taegliches Posten. Ohne Kaltakquise.

[Kostenloses Erstgespraech buchen]`,
  },
  'aida': {
    name: 'AIDA',
    short: 'Attention → Interest → Desire → Action',
    structure: ['Aufmerksamkeit', 'Interesse', 'Verlangen', 'Handlung'],
    bestFor: 'Universell — Lead-Gen, E-Com, SaaS',
    promptGuide: `Schritt 1 ATTENTION: Stoppe den Scroll. Nutze eine kontroverse Aussage, eine ueberraschende Zahl, oder eine direkte Frage die den Nerv trifft. KEIN generisches "Entdecke jetzt".
Schritt 2 INTEREST: Erklaere das Warum. Warum ist das relevant? Welche Erkenntnis fehlt den meisten? Nutze "Hier ist warum:" oder "Was die meisten nicht wissen:".
Schritt 3 DESIRE: Zeige das Ergebnis. Konkrete Zahlen, Testimonials, vorher/nachher. Der Leser muss denken "Das will ich auch".
Schritt 4 ACTION: Eindeutiger naechster Schritt. Keine Auswahl. Ein CTA. Dringlichkeit nur wenn echt (limitierte Plaetze, Deadline).`,
    exampleAd: `87% der Agenturen unter 50k/Monat machen den gleichen Fehler.

Sie versuchen mehr Kunden zu gewinnen — statt die richtigen. 3 meiner Kunden haben ihren Umsatz verdoppelt, nicht durch mehr Leads, sondern durch bessere Positionierung.

Max: Von 23k auf 61k/Monat in 4 Monaten.
Sarah: Erstmals 6-stellig — mit weniger Kunden als vorher.

Begrenzt auf 5 Plaetze im Maerz.

[Jetzt Strategie-Call sichern]`,
  },
  'bab': {
    name: 'BAB',
    short: 'Before → After → Bridge',
    structure: ['Vorher (Schmerz)', 'Nachher (Wunsch)', 'Bruecke (Angebot)'],
    bestFor: 'Transformation — Coaching, Fitness, Business',
    promptGuide: `Schritt 1 BEFORE: Beschreibe die aktuelle Realitaet der Zielgruppe. Nutze "Du"-Ansprache. Sei ehrlich und konkret — der Leser muss denken "Das bin ich".
Schritt 2 AFTER: Male das Wunschbild. Was waere moeglich? Nutze sensorische Sprache — was sieht, fuehlt, erlebt die Person? Mach es greifbar, nicht abstrakt.
Schritt 3 BRIDGE: Zeige den Weg. Dein Angebot ist die Bruecke von A nach B. Erklaere in 1-2 Saetzen wie. Dann CTA.`,
    exampleAd: `Gerade sitzt du abends am Laptop, schreibst Angebote fuer Kunden die eh nicht zahlen, und fragst dich ob das so weitergeht.

Stell dir vor: Du arbeitest mit 8-10 Premium-Kunden, hast planbar 40k+ im Monat, und dein Kalender hat wieder Luft. Deine Agentur laeuft — auch wenn du mal eine Woche frei nimmst.

Das ist kein Zufall. Das ist ein System. In 90 Tagen zeige ich dir genau welches.

[Kostenlose Analyse anfordern]`,
  },
  'fab': {
    name: 'FAB',
    short: 'Features → Advantages → Benefits',
    structure: ['Was hat es?', 'Was macht es besser?', 'Was bringt es dir?'],
    bestFor: 'SaaS, Produkte, Tools',
    promptGuide: `Schritt 1 FEATURES: Nenne 2-3 konkrete Features. Keine Buzzwords. Was genau ist enthalten/eingebaut?
Schritt 2 ADVANTAGES: Was macht das besser als Alternativen? Vergleiche implizit. "Im Gegensatz zu..." oder "Statt X machst du jetzt Y".
Schritt 3 BENEFITS: Was aendert sich im Alltag des Nutzers? Zeitersparnis in Stunden. Umsatzsteigerung in Euro. Stress-Reduktion. Konkret.`,
    exampleAd: `Automatische Lead-Qualifizierung. CRM-Integration. Echtzeit-Score.

Kein manuelles Sortieren mehr. Kein Copy-Paste zwischen 5 Tools. Dein Vertrieb bekommt nur noch Leads die wirklich kaufbereit sind.

Ergebnis: 3h weniger Admin pro Tag. 40% hoehere Abschlussquote. Ab dem ersten Monat.

[14 Tage kostenlos testen]`,
  },
  '4ps': {
    name: '4Ps',
    short: 'Promise → Picture → Proof → Push',
    structure: ['Versprechen', 'Bild malen', 'Beweis', 'Push/CTA'],
    bestFor: 'High-Ticket, Webinare, Premium-Angebote',
    promptGuide: `Schritt 1 PROMISE: Ein grosses, spezifisches Versprechen. Mit Zahl oder Zeitrahmen. "In X Wochen Y erreichen" — aber nur wenn glaubwuerdig.
Schritt 2 PICTURE: Male ein Bild im Kopf. Nutze "Stell dir vor..." und beschreibe einen konkreten Moment im neuen Leben. Sensorisch.
Schritt 3 PROOF: Belege das Versprechen. Kundenergebnis, Zahl, Testimonial, Methode. Etwas Konkretes das Vertrauen schafft.
Schritt 4 PUSH: Dringlichkeit + CTA. Warum jetzt? Limitierung, Zeitfenster, oder einfach: Der Schmerz geht nicht von allein weg.`,
    exampleAd: `Deine Agentur auf 100k/Monat — ohne neue Mitarbeiter.

Stell dir vor: Du oeffnest Montag morgen dein Dashboard. 4 neue Anfragen ueber Nacht. Alle vorqualifiziert. Du waehlst aus wem du ein Angebot schickst.

Genau das passiert bei 73% unserer Kunden innerhalb von 60 Tagen. Kein Zufall — ein bewiesenes System das seit 2019 funktioniert.

Naechste Runde startet am 1. April. 8 Plaetze.

[Platz sichern — Bewerbung in 2 Min]`,
  },
  'sss': {
    name: 'Story-Ad',
    short: 'Star → Story → Solution',
    structure: ['Held vorstellen', 'Kampf erzaehlen', 'Loesung + Ergebnis'],
    bestFor: 'Facebook/Instagram, Video-Ads, Retargeting',
    promptGuide: `Schritt 1 STAR: Stelle den Helden vor. Das kann ein Kunde oder der Anbieter sein. Ein Satz: Wer, was, wann. Der Leser muss sich identifizieren.
Schritt 2 STORY: Erzaehle den Kampf. Was war das Problem? Was hat nicht funktioniert? Welcher Moment war der Tiefpunkt? Emotionen > Fakten hier.
Schritt 3 SOLUTION: Die Wende. Was hat sich geaendert? Konkretes Ergebnis mit Zahlen. Dann: "Willst du das auch?" → CTA.
WICHTIG: Erzaehle die Story in Ich-Form oder erster Person. Nutze kurze Saetze. Umgangssprache ist OK.`,
    exampleAd: `Vor 8 Monaten wollte Lisa ihre Agentur schliessen.

3 Jahre aufgebaut. 14-Stunden-Tage. Trotzdem kam am Monatsende kaum was rum. Kunden die auf Rabatt draengen. Pitches die ins Leere laufen.

Dann hat sie ihr Angebot umgestellt. Weg vom Bauchladen. Hin zu einem Ergebnis-Paket fuer eine Nische.

Heute: 47k/Monat. 6 Premium-Kunden. Freitags frei.

Kein Geheimnis. Ein System. Willst du wissen welches?

[Hier klicken]`,
  },
}

// ── Plattformen mit striktem Ausgabeformat ──

interface AdPlatform {
  name: string
  outputFormat: string
  charLimits: string
  bestFor: string
  formatInstruction: string
}

const AD_PLATFORMS: Record<string, AdPlatform> = {
  'facebook': {
    name: 'Facebook / Instagram',
    outputFormat: 'Primary Text + Headline + Description + CTA-Button',
    charLimits: 'Primary: max 125 Zeichen sichtbar (kann laenger sein), Headline: max 40 Zeichen, Description: max 30 Zeichen',
    bestFor: 'B2C, Coaching, E-Com',
    formatInstruction: `Gib jede Ad EXAKT in diesem Format aus:

PRIMARY TEXT:
[Der Haupttext der Ad. Darf mehrere Zeilen haben. Die ersten 125 Zeichen muessen den Hook enthalten weil nur die sichtbar sind vor "Mehr anzeigen".]

HEADLINE: [Max 40 Zeichen. Kurz, knackig. Das Kernangebot oder Ergebnis.]
DESCRIPTION: [Max 30 Zeichen. Untertitel oder Verstaerker.]
CTA-BUTTON: [Einer von: Mehr erfahren | Jetzt anmelden | Termin buchen | Kontaktieren | Herunterladen | Jetzt kaufen]`,
  },
  'google-search': {
    name: 'Google Search Ads',
    outputFormat: '3 Headlines + 2 Descriptions',
    charLimits: 'Headlines: je max 30 Zeichen, Descriptions: je max 90 Zeichen',
    bestFor: 'Suchintention, B2B',
    formatInstruction: `Gib jede Ad EXAKT in diesem Format aus:

HEADLINE 1: [Max 30 Zeichen — Hauptkeyword + Benefit]
HEADLINE 2: [Max 30 Zeichen — Differenzierung/USP]
HEADLINE 3: [Max 30 Zeichen — CTA oder Trust-Signal]
DESCRIPTION 1: [Max 90 Zeichen — Hauptargument mit konkretem Nutzen]
DESCRIPTION 2: [Max 90 Zeichen — Social Proof oder zusaetzlicher Benefit + CTA]

WICHTIG: Zaehle die Zeichen. Wenn eine Headline >30 Zeichen hat, kuerze sie. Google schneidet sonst ab.`,
  },
  'linkedin': {
    name: 'LinkedIn Ads',
    outputFormat: 'Intro Text + Headline + Description',
    charLimits: 'Intro: 150 Zeichen sichtbar (max 600), Headline: max 70 Zeichen, Description: max 100 Zeichen',
    bestFor: 'B2B, High-Ticket, Recruiting',
    formatInstruction: `Gib jede Ad EXAKT in diesem Format aus:

INTRO TEXT:
[Die ersten 150 Zeichen muessen stark sein — nur die sind sichtbar. Dann kann es laenger werden. Professioneller Ton. Kein Emoji-Spam. Zahlen und Ergebnisse nutzen.]

HEADLINE: [Max 70 Zeichen — klarer Nutzen oder Frage]
DESCRIPTION: [Max 100 Zeichen — Verstaerker + was passiert beim Klick]
CTA-BUTTON: [Einer von: Mehr erfahren | Anmelden | Herunterladen | Bewerben | Kontaktieren]`,
  },
  'tiktok': {
    name: 'TikTok Ads',
    outputFormat: 'Hook-Script + Ad Text + CTA',
    charLimits: 'Ad Text: max 100 Zeichen, Script: 15-30 Sekunden',
    bestFor: 'Gen Z/Millennials, E-Com',
    formatInstruction: `Gib jede Ad EXAKT in diesem Format aus:

HOOK (erste 2 Sekunden): [Was sagt/zeigt man um den Scroll zu stoppen? Muss sofort greifen.]
SCRIPT: [Kurzes Skript, 15-30 Sek. Umgangssprache. Kein Corporate-Deutsch. So wie ein Creator reden wuerde.]
AD TEXT: [Max 100 Zeichen — wird ueber dem Video angezeigt]
CTA: [Kurz und direkt]

TON: Authentisch, schnell, direkt. Wie ein Freund der einen Tipp gibt. Keine Werbung die sich wie Werbung anfuehlt.`,
  },
  'youtube': {
    name: 'YouTube Ads (Script)',
    outputFormat: 'Hook (5s) + Body + CTA',
    charLimits: '15s / 30s / 60s Script',
    bestFor: 'Brand, Coaching, Webinare',
    formatInstruction: `Gib jede Ad EXAKT in diesem Format aus:

HOOK (0-5 Sek) — Muss vor "Skip" ueberzeugen:
[Erste 5 Sekunden Script. Der Zuschauer entscheidet hier ob er bleibt. Frage, Schock-Aussage, oder Pattern-Interrupt.]

BODY (5-25 Sek):
[Hauptteil. Problem → Loesung → Beweis. Kurze Saetze. Sprich den Zuschauer direkt an.]

CTA (letzte 5 Sek):
[Was soll der Zuschauer tun? Klarer naechster Schritt. URL oder Aktion.]

GESAMT-LAENGE: Schreibe das Script so dass es laut gesprochen ca. 30 Sekunden dauert.`,
  },
}

// ── Hook-Typen ──

const HOOK_TYPES = [
  { value: 'pain', label: 'Pain Point', desc: 'Schmerz direkt ansprechen' },
  { value: 'desire', label: 'Wunschbild', desc: 'Ergebnis zeigen' },
  { value: 'curiosity', label: 'Neugier', desc: 'Open Loop erzeugen' },
  { value: 'proof', label: 'Social Proof', desc: 'Zahlen/Ergebnisse zuerst' },
  { value: 'contrarian', label: 'Kontraer', desc: 'Gegen den Mainstream' },
  { value: 'question', label: 'Frage', desc: 'Direkte Frage stellen' },
]

type AdLength = 'kurz' | 'mittel' | 'lang'

const AD_LENGTHS: { value: AdLength; label: string }[] = [
  { value: 'kurz', label: 'Kurz' },
  { value: 'mittel', label: 'Mittel' },
  { value: 'lang', label: 'Lang' },
]

const TONES = [
  { value: 'direct', label: 'Direkt & Klar' },
  { value: 'casual', label: 'Locker & Nahbar' },
  { value: 'bold', label: 'Provokant' },
  { value: 'fomo', label: 'Dringend (FOMO)' },
  { value: 'story', label: 'Erzaehlend' },
  { value: 'authority', label: 'Experten-Ton' },
]

export function AdsGenerator() {
  const [product, setProduct] = useState('')
  const [audience, setAudience] = useState('')
  const [usp, setUsp] = useState('')
  const [framework, setFramework] = useState('pas')
  const [adPlatform, setAdPlatform] = useState('facebook')
  const [hookType, setHookType] = useState('pain')
  const [length, setLength] = useState<AdLength>('mittel')
  const [tone, setTone] = useState('direct')
  const [model, setModel] = useState<AIModel>('gpt-4o')
  const [variants, setVariants] = useState(3)

  const [generatedAds, setGeneratedAds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  const fw = AD_FRAMEWORKS[framework]
  const pl = AD_PLATFORMS[adPlatform]

  const handleGenerate = async () => {
    if (!product.trim()) return
    if (!isPuterAvailable()) { setError('Puter.js nicht geladen.'); return }

    setLoading(true)
    setError(null)
    setGeneratedAds([])

    try {
      const hookDesc = HOOK_TYPES.find(h => h.value === hookType)
      const toneDesc = TONES.find(t => t.value === tone)
      const lengthMap: Record<AdLength, string> = {
        kurz: 'KURZ: Maximal 2-4 Saetze. Jedes Wort muss sitzen. Kein Filler.',
        mittel: 'MITTEL: 1 Absatz, 4-8 Saetze. Genug Platz fuer Framework-Struktur.',
        lang: 'LANG: Ausfuehrlich, 2-4 Absaetze. Story erzaehlen, Details, Social Proof.',
      }

      const prompt = `Du schreibst Ads die konvertieren. Nicht generische Marketing-Texte — sondern Ads die Leute dazu bringen zu klicken, zu kaufen, sich anzumelden.

═══ KONTEXT ═══
Produkt/Angebot: ${product}
${audience ? `Zielgruppe: ${audience}` : 'Zielgruppe: Leite sie aus dem Produkt ab.'}
${usp ? `USP/Besonderheit: ${usp}` : ''}

═══ FRAMEWORK: ${fw.name} ═══
${fw.promptGuide}

═══ BEISPIEL einer guten ${fw.name}-Ad ═══
${fw.exampleAd}

═══ PLATTFORM: ${pl.name} ═══
${pl.formatInstruction}

═══ EINSTELLUNGEN ═══
Hook-Typ: ${hookDesc?.label} — ${hookDesc?.desc}
Laenge: ${lengthMap[length]}
Ton: ${toneDesc?.label}
Anzahl Varianten: ${variants}

═══ ANTI-PATTERNS — Das darfst du NICHT tun ═══
- KEINE generischen Floskeln: "Entdecke jetzt", "Revolutionaer", "Einzigartig", "Game-Changer"
- KEINE Ausrufezeichen-Inflation (max 1 pro Ad)
- KEINE leeren Versprechen ohne Substanz
- KEINE Corporate-Sprache: "Wir bieten Ihnen erstklassige Loesungen"
- KEINE Emojis ausser bei TikTok/Instagram (dort sparsam)
- STATTDESSEN: Konkrete Zahlen, spezifische Ergebnisse, echte Sprache, kurze Saetze, aktive Verben
- Schreibe "Du/Dein" nicht "Sie/Ihr"
- Jede Variante MUSS einen anderen Hook/Angle haben

═══ AUSGABE ═══
Schreibe ${variants} Varianten. Trenne sie mit:
---VARIANTE 1---
---VARIANTE 2---
etc.

Jede Variante MUSS exakt dem Ausgabeformat der Plattform (${pl.name}) folgen.
Keine Erklaerungen, keine Kommentare. NUR die Ads.`

      const result = await aiChat(prompt, model)

      const parts = result.split(/---\s*VARIANTE\s*\d+\s*---/i).filter(p => p.trim())
      if (parts.length > 0) {
        setGeneratedAds(parts.map(p => p.trim()))
      } else {
        setGeneratedAds([result.trim()])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Ad-Generator</h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Cpu className="h-3.5 w-3.5 text-primary" />
          <select value={model} onChange={(e) => setModel(e.target.value as AIModel)}
            className="h-7 rounded border border-input bg-background px-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring/30">
            {AI_MODELS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <span className="text-[10px] text-emerald-500 font-medium">Free</span>
        </div>
      </div>

      {/* Input */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        {/* Product + Audience + USP */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Produkt / Angebot <span className="text-red-400">*</span></label>
            <textarea value={product} onChange={(e) => setProduct(e.target.value)}
              placeholder="z.B. 12-Wochen Coaching fuer Agenturinhaber die auf 50k+/Monat skalieren wollen. 1:1 Betreuung, bewiesenes System, 73% Erfolgsquote."
              rows={2}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition-colors resize-none" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Zielgruppe</label>
            <textarea value={audience} onChange={(e) => setAudience(e.target.value)}
              placeholder="z.B. Agenturinhaber, 25-45 Jahre, aktuell 10-30k/Monat, 2-5 Mitarbeiter, ueberarbeitet, wollen skalieren"
              rows={2}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition-colors resize-none" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">USP / Besonderheit</label>
            <textarea value={usp} onChange={(e) => setUsp(e.target.value)}
              placeholder="z.B. Einziges Programm mit Geld-zurueck-Garantie. Gruender hat selbst 7-stellige Agentur aufgebaut."
              rows={2}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition-colors resize-none" />
          </div>
        </div>

        {/* Framework */}
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Framework</label>
          <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(AD_FRAMEWORKS).map(([key, f]) => (
              <button key={key} onClick={() => setFramework(key)}
                className={`text-left rounded-lg border p-2 transition-colors ${
                  framework === key ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">{f.name}</span>
                  <span className="text-[9px] text-muted-foreground">{f.bestFor}</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{f.short}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Framework example (collapsible) */}
        {fw && (
          <details className="bg-muted/30 rounded-lg">
            <summary className="px-3 py-2 text-[11px] text-muted-foreground cursor-pointer hover:text-foreground">
              Beispiel-Ad ({fw.name}) ansehen
            </summary>
            <div className="px-3 pb-2 text-[11px] text-foreground whitespace-pre-wrap leading-relaxed border-t border-border/50 mt-1 pt-2">
              {fw.exampleAd}
            </div>
          </details>
        )}

        {/* Platform + Hook + Length + Tone */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Plattform</label>
            <select value={adPlatform} onChange={(e) => setAdPlatform(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-background px-2 text-xs">
              {Object.entries(AD_PLATFORMS).map(([key, p]) => (
                <option key={key} value={key}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Hook-Typ</label>
            <select value={hookType} onChange={(e) => setHookType(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-background px-2 text-xs">
              {HOOK_TYPES.map((h) => (
                <option key={h.value} value={h.value}>{h.label} — {h.desc}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Laenge</label>
            <div className="flex gap-1">
              {AD_LENGTHS.map((l) => (
                <button key={l.value} onClick={() => setLength(l.value)}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                    length === l.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Ton</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-background px-2 text-xs">
              {TONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        {/* Platform format info */}
        {pl && (
          <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground bg-muted/30 rounded-lg px-3 py-1.5">
            <span>Format: {pl.outputFormat}</span>
            <span>·</span>
            <span>Limits: {pl.charLimits}</span>
          </div>
        )}

        {/* Variants + Generate */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Varianten:</span>
            {[1, 3, 5].map((n) => (
              <button key={n} onClick={() => setVariants(n)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  variants === n ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}>
                {n}x
              </button>
            ))}
          </div>

          <button onClick={handleGenerate} disabled={loading || !product.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 ml-auto">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? 'Generiere...' : 'Ads generieren'}
          </button>
        </div>

        {error && <div className="text-xs text-red-500">{error}</div>}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
          <span className="text-sm text-muted-foreground">Schreibt {variants} {fw.name}-Ads fuer {pl.name}...</span>
        </div>
      )}

      {/* Results */}
      {generatedAds.length > 0 && !loading && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">{generatedAds.length} Variante{generatedAds.length > 1 ? 'n' : ''}</h3>
            <button onClick={handleGenerate}
              className="inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-xs hover:bg-muted transition-colors">
              <RefreshCw className="h-3 w-3" /> Neu generieren
            </button>
          </div>

          {generatedAds.map((ad, idx) => (
            <div key={idx} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">#{idx + 1}</span>
                  <span className="text-[10px] text-muted-foreground">{fw.name} · {pl.name} · {HOOK_TYPES.find(h => h.value === hookType)?.label}</span>
                </div>
                <button onClick={() => handleCopy(ad, idx)} className="inline-flex items-center gap-1 px-2 py-0.5 rounded hover:bg-muted transition-colors text-xs text-muted-foreground">
                  {copiedIdx === idx ? <><Check className="h-3 w-3 text-emerald-500" /> Kopiert</> : <><Copy className="h-3 w-3" /> Kopieren</>}
                </button>
              </div>
              <div className="p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed">{ad}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
