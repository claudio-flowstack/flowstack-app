import { useState, useEffect, useId, useRef, Suspense, Component, type ReactNode, type ErrorInfo, lazy } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bot, BarChart3, Users, Workflow, ArrowRight, ArrowUpRight,
  CheckCircle2, ChevronRight, Clock, Code2, Database, Globe,
  Loader2, Lock, Server, Zap,
} from "lucide-react"
import { Feature } from "@/components/ui/feature-with-image-comparison"
import DatabaseWithRestApiSvg from "@/components/ui/database-with-rest-api"

// Lazy load heavy components (Three.js, Particles)
const EtherealBeamsHero = lazy(() => import("@/components/ui/ethereal-beams-hero"))
const ShaderAnimation = lazy(() => import("@/components/ui/shader-animation").then(m => ({ default: m.ShaderAnimation })))
const Sparkles = lazy(() => import("@/components/ui/sparkles").then(m => ({ default: m.Sparkles })))

// ============================================================================
// ERROR BOUNDARY (crash-safe Three.js)
// ============================================================================

class CanvasErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[3D Canvas Error]", error, info)
  }
  render() {
    if (this.state.hasError) return this.props.fallback ?? null
    return this.props.children
  }
}

// ============================================================================
// DARK MODE CSS VARIABLES (hardcoded, no theme dependency)
// ============================================================================

const DARK_VARS: React.CSSProperties = {
  "--background": "#09090b",
  "--foreground": "#fafafa",
  "--card": "#111113",
  "--card-foreground": "#fafafa",
  "--popover": "#18181b",
  "--popover-foreground": "#fafafa",
  "--primary": "#818cf8",
  "--primary-foreground": "#ffffff",
  "--secondary": "#1c1c22",
  "--secondary-foreground": "#fafafa",
  "--muted": "#18181b",
  "--muted-foreground": "#a1a1aa",
  "--accent": "#1e1b4b",
  "--accent-foreground": "#e0e7ff",
  "--destructive": "#dc2626",
  "--destructive-foreground": "#ffffff",
  "--border": "#27272a",
  "--input": "#27272a",
  "--ring": "#818cf8",
  colorScheme: "dark",
} as React.CSSProperties

// ============================================================================
// NAVBAR (inline, no external component)
// ============================================================================

function FlowstackNavbar() {
  const [active, setActive] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = [
    {
      label: "Produkt",
      links: [
        { label: "Features", href: "#features" },
        { label: "Automation Engine", href: "#automation" },
        { label: "Performance Tracking", href: "#tracking" },
      ],
    },
    {
      label: "Lösungen",
      links: [
        { label: "Recruiting Agenturen", href: "#recruiting" },
        { label: "Marketing Agenturen", href: "#marketing" },
      ],
    },
    {
      label: "Preise",
      links: [
        { label: "Starter - 2.000/Mo", href: "#starter" },
        { label: "Pro - 3.500/Mo", href: "#pro" },
        { label: "Enterprise - Individuell", href: "#enterprise" },
      ],
    },
  ]

  return (
    <div className="fixed top-6 inset-x-0 max-w-2xl mx-auto z-50 px-4">
      {/* Desktop */}
      <nav
        onMouseLeave={() => setActive(null)}
        className="hidden md:flex relative rounded-full border border-white/[0.08] bg-neutral-950/90 backdrop-blur-xl shadow-lg justify-center items-center space-x-4 px-8 py-3"
      >
        {navItems.map((item) => (
          <div key={item.label} onMouseEnter={() => setActive(item.label)} className="relative">
            <p className="cursor-pointer text-white/70 hover:text-white text-sm font-medium transition-colors">
              {item.label}
            </p>
            <AnimatePresence>
              {active === item.label && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: 10 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute top-[calc(100%+0.8rem)] left-1/2 -translate-x-1/2"
                >
                  <div className="bg-neutral-950/95 backdrop-blur-xl rounded-xl border border-white/[0.08] shadow-2xl shadow-black/50 p-2 min-w-[200px]">
                    {item.links.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        className="block px-3 py-2 text-sm text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.05] transition-colors"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      {/* Mobile */}
      <div className="md:hidden">
        <div className="flex items-center justify-between rounded-full border border-white/[0.08] bg-neutral-950/90 backdrop-blur-xl px-6 py-3">
          <span className="text-white font-bold">Flowstack</span>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white/70 hover:text-white p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 rounded-2xl border border-white/[0.08] bg-neutral-950/95 backdrop-blur-xl p-4 space-y-2"
            >
              {navItems.flatMap((item) =>
                item.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2 text-sm text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.05] transition-colors"
                  >
                    {link.label}
                  </a>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ============================================================================
// BENTO GRID (inline, no external component)
// ============================================================================

interface BentoItem {
  title: string
  description: string
  icon: ReactNode
  status?: string
  tags?: string[]
  meta?: string
  colSpan?: number
  hasPersistentHover?: boolean
}

const bentoItems: BentoItem[] = [
  {
    title: "KI-Automatisierung",
    meta: "v3.0",
    description: "Strategie, Texte, Anzeigen und Funnels - alles automatisch generiert durch unsere KI-Pipeline.",
    icon: <Bot className="w-4 h-4 text-purple-500" />,
    status: "Live",
    tags: ["KI", "Automation", "Pipeline"],
    colSpan: 2,
    hasPersistentHover: true,
  },
  {
    title: "Performance Tracking",
    meta: "Echtzeit",
    description: "CPL, Leads, Conversion Rates - alle KPIs deiner Kunden auf einen Blick.",
    icon: <BarChart3 className="w-4 h-4 text-emerald-500" />,
    status: "Live",
    tags: ["Analytics", "KPIs"],
  },
  {
    title: "Multi-Client Management",
    meta: "Unbegrenzt",
    description: "Verwalte beliebig viele Kunden gleichzeitig. Jeder mit eigenem Pipeline-Status.",
    icon: <Users className="w-4 h-4 text-sky-500" />,
    tags: ["Kunden", "Skalierung"],
    colSpan: 2,
  },
  {
    title: "Workflow Engine",
    meta: "47 Nodes",
    description: "Modulare Automation mit Fehlerbehandlung, Retry-Logik und Live-Monitoring.",
    icon: <Workflow className="w-4 h-4 text-orange-500" />,
    status: "Neu",
    tags: ["Engine", "Nodes"],
  },
]

function BentoGridSection() {
  return (
    <section id="features" className="py-20 bg-black">
      <div className="max-w-4xl mx-auto px-6 text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Alles was deine Agentur braucht
        </h2>
        <p className="text-white/60 text-lg">
          Ein System. Alle Prozesse. Komplett automatisiert.
        </p>
      </div>
      <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        {bentoItems.map((item, index) => (
          <div
            key={index}
            className={`group relative p-6 rounded-xl overflow-hidden bg-gradient-to-b from-neutral-900/80 to-neutral-950/90 border border-white/[0.08] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-white/[0.15] transition-all duration-500 ease-out ${
              item.colSpan === 2 ? "md:col-span-2" : ""
            } ${item.hasPersistentHover ? "shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-white/[0.15]" : ""}`}
          >
            <div className={`absolute inset-0 transition-opacity duration-500 bg-gradient-to-br from-purple-500/[0.03] to-blue-500/[0.03] ${item.hasPersistentHover ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
            <div className="relative space-y-4">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.08] group-hover:border-white/[0.15] transition-colors duration-500 text-white/70 group-hover:text-white/90 ${item.hasPersistentHover ? "border-white/[0.15] text-white/90" : ""}`}>
                  {item.icon}
                </div>
                {item.status && (
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-300/90 border border-purple-500/20">
                    {item.status}
                  </span>
                )}
              </div>
              <div>
                <h3 className={`font-semibold text-white/90 tracking-tight text-lg group-hover:text-white transition-colors duration-500 ${item.hasPersistentHover ? "text-white" : ""}`}>
                  {item.title}
                </h3>
                <p className="text-sm text-white/50 mt-1.5 leading-relaxed font-light">{item.description}</p>
              </div>
              {item.tags && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {item.tags.map((tag, i) => (
                    <span key={i} className={`text-[11px] font-medium px-2 py-0.5 rounded-md bg-white/[0.04] text-white/50 border border-white/[0.06] transition-colors duration-300 group-hover:bg-white/[0.06] group-hover:text-white/60 ${item.hasPersistentHover ? "bg-white/[0.06] text-white/60" : ""}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.06]">
                {item.meta && <span className="text-xs text-white/40 font-light">{item.meta}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ============================================================================
// API VISUALISATION (inline, no external component)
// ============================================================================

interface Endpoint {
  method: "GET" | "POST" | "PUT" | "DELETE"
  path: string
  description: string
  latency: string
  status: "active" | "deprecated" | "beta"
}

const endpoints: Endpoint[] = [
  { method: "GET", path: "/api/v3/clients", description: "Alle Kunden mit Status und KPIs abrufen", latency: "~45ms", status: "active" },
  { method: "POST", path: "/api/v3/execute", description: "KI-Pipeline für neuen Kunden starten", latency: "~120ms", status: "active" },
  { method: "GET", path: "/api/v3/execute/:id", description: "Pipeline-Status und Node-Fortschritt prüfen", latency: "~30ms", status: "active" },
  { method: "PUT", path: "/api/v3/clients/:id/deliverables", description: "Deliverable aktualisieren oder freigeben", latency: "~85ms", status: "active" },
  { method: "DELETE", path: "/api/v3/clients/:id", description: "Kunden-Daten und Kampagnen entfernen", latency: "~65ms", status: "active" },
]

const methodColors: Record<string, string> = {
  GET: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  POST: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  PUT: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  DELETE: "text-red-400 bg-red-500/10 border-red-500/20",
}

const statusIcons: Record<string, { color: string; icon: ReactNode }> = {
  active: { color: "text-emerald-400", icon: <CheckCircle2 className="w-3 h-3" /> },
  deprecated: { color: "text-red-400", icon: <Clock className="w-3 h-3" /> },
  beta: { color: "text-amber-400", icon: <Zap className="w-3 h-3" /> },
}

function ApiSection() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<number | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [activeRequests, setActiveRequests] = useState(0)
  const uniqueId = useId()

  useEffect(() => {
    const timer = setTimeout(() => setIsConnected(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveRequests(Math.floor(Math.random() * 100))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section id="automation" className="py-20 bg-black border-t border-white/5">
      <div className="max-w-4xl mx-auto px-6 text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Nahtlose Integration
        </h2>
        <p className="text-white/60 text-lg">
          Verbinde alle deine Tools über unsere REST API.
        </p>
      </div>
      <div className="flex justify-center px-6">
        <div className="relative w-full max-w-2xl mx-auto rounded-2xl overflow-hidden bg-gradient-to-b from-neutral-950 to-neutral-900 border border-white/[0.08]">
          {/* Header */}
          <div className="relative px-6 pt-5 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20">
                  <Database className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white/90 tracking-tight">Flowstack API</h3>
                  <p className="text-[11px] text-white/40 mt-0.5">Echtzeit-Datenaustausch</p>
                </div>
              </div>
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium ${
                isConnected
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}>
                {isConnected ? <CheckCircle2 className="w-3 h-3" /> : <Loader2 className="w-3 h-3 animate-spin" />}
                {isConnected ? "Connected" : "Connecting..."}
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-white/30" />
                <span className="text-[11px] text-white/50 font-mono">api.flowstack.io</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Code2 className="w-3 h-3 text-white/30" />
                <span className="text-[11px] text-white/50">v3.0</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Server className="w-3 h-3 text-white/30" />
                <span className="text-[11px] text-white/50">{activeRequests} req/s</span>
              </div>
            </div>
          </div>

          {/* Endpoints */}
          <div className="p-3 space-y-1">
            {endpoints.map((ep, index) => {
              const isSelected = selectedEndpoint === index
              return (
                <motion.div
                  key={`${uniqueId}-ep-${index}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.3 }}
                >
                  <button
                    onClick={() => setSelectedEndpoint(isSelected ? null : index)}
                    className={`w-full text-left rounded-lg transition-all duration-200 hover:bg-white/[0.03] ${isSelected ? "bg-white/[0.03]" : ""}`}
                  >
                    <div className="flex items-center gap-3 px-3 py-2.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border font-mono tracking-wide ${methodColors[ep.method]}`}>
                        {ep.method}
                      </span>
                      <span className="text-xs text-white/70 font-mono flex-1 truncate">{ep.path}</span>
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1 text-[10px] ${statusIcons[ep.status].color}`}>
                          {statusIcons[ep.status].icon}
                        </span>
                        <span className="text-[10px] text-white/30 font-mono">{ep.latency}</span>
                        <ChevronRight className={`w-3 h-3 text-white/20 transition-transform ${isSelected ? "rotate-90" : ""}`} />
                      </div>
                    </div>
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 pt-1">
                            <div className="rounded-md bg-white/[0.02] border border-white/[0.06] p-3">
                              <p className="text-[11px] text-white/50 mb-2">{ep.description}</p>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-[10px] text-white/30">
                                  <Lock className="w-3 h-3" /> Bearer Auth
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-violet-400">
                                  <ArrowUpRight className="w-3 h-3" /> Try it
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </motion.div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-[11px] text-white/30">{endpoints.length} endpoints available</span>
            <div className="flex items-center gap-1.5 text-[11px] text-violet-400 font-medium">
              View Full Docs <ArrowUpRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// FEATURES GRID (inline, no external component)
// ============================================================================

const features = [
  {
    title: "Automatische Strategie",
    description: "Von der Zielgruppen-Analyse bis zum Creative Briefing. Alles KI-generiert, von dir freigegeben.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
  },
  {
    title: "Kampagnen auf Knopfdruck",
    description: "Meta Ads, Google Ads, Landing Pages. Automatisch erstellt und optimiert für jeden Kunden.",
    image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&h=400&fit=crop",
  },
  {
    title: "Kunden-Hub",
    description: "Jeder Kunde bekommt sein eigenes Portal mit Echtzeit-Status, Deliverables und Freigaben.",
    image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&h=400&fit=crop",
  },
  {
    title: "Pipeline Monitoring",
    description: "47 Automation-Nodes pro Kunde. Jeder Schritt transparent, jeder Fehler sofort sichtbar.",
    image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=600&h=400&fit=crop",
  },
]

function FeaturesSection() {
  return (
    <section className="py-24 bg-black">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
            Was Flowstack für deine Agentur tut
          </h2>
          <p className="text-lg text-white/60">
            Vom Onboarding bis zur Live-Kampagne. Jeder Schritt automatisiert.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-b from-neutral-900/80 to-neutral-950/90 hover:border-white/[0.15] transition-colors duration-300"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              </div>
              <div className="p-6">
                <h3 className="font-semibold text-lg text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// MOCKUP SECTIONS (inline, no external component)
// ============================================================================

function MockupSection({
  title,
  description,
  reverse = false,
}: {
  title: ReactNode
  description: string
  reverse?: boolean
}) {
  return (
    <section className="py-24 overflow-hidden bg-black">
      <div className="max-w-6xl mx-auto px-6">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center ${reverse ? "direction-rtl" : ""}`}>
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: reverse ? 30 : -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`space-y-6 ${reverse ? "lg:order-2" : ""}`}
            style={{ direction: "ltr" }}
          >
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {title}
            </h2>
            <p className="text-lg text-white/60 leading-relaxed max-w-lg">
              {description}
            </p>
          </motion.div>

          {/* Mockup Placeholder */}
          <motion.div
            initial={{ opacity: 0, x: reverse ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
            className={`relative ${reverse ? "lg:order-1" : ""}`}
            style={{ direction: "ltr" }}
          >
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-neutral-900 to-neutral-950 border border-white/[0.08] aspect-[4/3]">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />
              <div className="absolute top-4 left-4 flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// CTA SECTION (inline, no external component)
// ============================================================================

function CtaSection() {
  return (
    <section className="py-24 bg-black">
      <div className="max-w-5xl mx-auto px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-neutral-900 to-neutral-950 border border-white/[0.08] px-8 py-16 sm:px-16 sm:py-20 text-center">
          {/* Background decorations */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          </div>

          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />

          {/* Content */}
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <span className="inline-block text-xs font-medium px-3 py-1 rounded-full border border-white/20 text-white/70 bg-white/[0.05]">
              Jetzt starten
            </span>

            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Bereit deine Agentur zu skalieren?
            </h2>

            <p className="text-lg text-white/60 leading-relaxed max-w-xl mx-auto">
              Kostenlose Demo vereinbaren. Kein Risiko. Keine Verpflichtung.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a
                href="#demo"
                className="inline-flex items-center gap-2 rounded-xl px-8 h-12 bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
              >
                Kostenlose Demo buchen
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Corner rectangles */}
          <div className="absolute top-6 left-6 w-16 h-16 border border-white/[0.08] rounded-lg" />
          <div className="absolute top-6 right-6 w-16 h-16 border border-white/[0.08] rounded-lg" />
          <div className="absolute bottom-6 left-6 w-16 h-16 border border-white/[0.08] rounded-lg" />
          <div className="absolute bottom-6 right-6 w-16 h-16 border border-white/[0.08] rounded-lg" />
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// MAIN HOMEPAGE
// ============================================================================

export function HomePage() {
  // Override body background (kunden-hub.css sets body to bg-gray-50 globally)
  useEffect(() => {
    const prev = document.body.style.backgroundColor
    document.body.style.backgroundColor = "#000000"
    document.documentElement.classList.add("dark")
    return () => {
      document.body.style.backgroundColor = prev
      document.documentElement.classList.remove("dark")
      document.documentElement.classList.add("light")
    }
  }, [])

  return (
    <main className="dark bg-black min-h-screen text-white" style={DARK_VARS}>
      {/* Floating Navbar */}
      <FlowstackNavbar />

      {/* 1. Hero with 3D Beams */}
      <CanvasErrorBoundary
        fallback={
          <div className="relative min-h-screen bg-black flex items-center justify-center">
            <h1 className="text-5xl font-bold text-white">Flowstack</h1>
          </div>
        }
      >
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
          <EtherealBeamsHero />
        </Suspense>
      </CanvasErrorBoundary>

      {/* 2. Trust/Social-Proof Section with Sparkles */}
      <CanvasErrorBoundary fallback={null}>
        <section className="bg-black pb-16 pt-16 md:pb-32 relative overflow-hidden">
          <div className="max-w-3xl mx-auto px-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center relative z-20">
              <div>
                <div className="text-4xl font-bold text-white mb-2">10x</div>
                <div className="text-white/50 text-sm">Schnellere Kampagnen-Erstellung</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-2">80%</div>
                <div className="text-white/50 text-sm">Weniger manueller Aufwand</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-2">6</div>
                <div className="text-white/50 text-sm">Phasen, komplett automatisiert</div>
              </div>
            </div>
          </div>
          <div className="relative mx-auto max-w-2xl">
            <div className="relative -mt-8 h-64 w-full overflow-hidden [mask-image:radial-gradient(50%_50%,white,transparent)]">
              <div className="absolute inset-0 before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_bottom_center,#818cf8,transparent_70%)] before:opacity-40" />
              <div className="absolute -left-1/2 top-1/2 aspect-[1/0.7] z-10 w-[200%] rounded-[100%] border-t border-white/20 bg-black" />
              <Suspense fallback={null}>
                <Sparkles
                  density={1200}
                  className="absolute inset-x-0 bottom-0 h-full w-full [mask-image:radial-gradient(50%_50%,white,transparent_85%)]"
                  color="#ffffff"
                />
              </Suspense>
            </div>
          </div>
        </section>
      </CanvasErrorBoundary>

      {/* 3. Bento Grid */}
      <BentoGridSection />

      {/* 4. Database SVG Animation */}
      <CanvasErrorBoundary fallback={<ApiSection />}>
        <section className="py-20 bg-black border-t border-white/5">
          <div className="max-w-4xl mx-auto px-6 text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Nahtlose Integration
            </h2>
            <p className="text-white/60 text-lg">
              Verbinde alle deine Tools über unsere REST API.
            </p>
          </div>
          <div className="flex justify-center px-6">
            <DatabaseWithRestApiSvg
              title="Flowstack API - Echtzeit-Datenaustausch"
              circleText="API"
              badgeTexts={{ first: "GET", second: "POST", third: "PUT", fourth: "DELETE" }}
              buttonTexts={{ first: "Flowstack", second: "v3_engine" }}
              lightColor="#818cf8"
            />
          </div>
        </section>
      </CanvasErrorBoundary>

      {/* 5. Features Grid */}
      <FeaturesSection />

      {/* 6. Feature Image Comparison */}
      <CanvasErrorBoundary fallback={null}>
        <section className="bg-black">
          <Feature
            badge="KI-Assistent"
            title="Dein KI-Assistent für jede Frage."
            description="Frag die KI nach Performance-Daten, Kampagnen-Status oder nächsten Schritten. Sofortige Antworten basierend auf echten Kundendaten."
            imageBefore="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&h=1080&fit=crop"
            imageAfter="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&h=1080&fit=crop"
          />
        </section>
      </CanvasErrorBoundary>

      {/* 7. Shader Animation Section */}
      <CanvasErrorBoundary fallback={null}>
        <section className="relative bg-black h-[400px] overflow-hidden">
          <Suspense fallback={<div className="h-[400px] bg-black" />}>
            <ShaderAnimation />
          </Suspense>
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <h2 className="text-5xl md:text-7xl font-semibold tracking-tighter text-white">
                Automation<br />Engine v3
              </h2>
              <p className="mt-4 text-lg text-white/60">
                47 Nodes. 6 Phasen. Von Onboarding bis Live-Kampagne.
              </p>
            </div>
          </div>
        </section>
      </CanvasErrorBoundary>

      {/* 8. Mockup Sections */}
      <MockupSection
        title={<>Performance auf<br />einen Blick.</>}
        description="Recruiting-Funnels, CPL-Tracking, Plattform-Vergleiche. Alles in einem Dashboard. Für jeden Kunden. In Echtzeit."
        reverse
      />

      {/* 9. CTA */}
      <CtaSection />

      {/* 7. Footer */}
      <footer className="border-t border-white/10 bg-black py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-white font-bold text-lg">Flowstack</span>
          <span className="text-white/40 text-sm">2026 Flowstack. Alle Rechte vorbehalten.</span>
        </div>
      </footer>
    </main>
  )
}
