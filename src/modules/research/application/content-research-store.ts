// ── Content Research Store ──
// Now uses Puter.js for AI (free, no API key) + Backend for YouTube/News search

import { create } from 'zustand'
import { aiChat, isPuterAvailable } from '@/core/ai/puter-ai'
import type { AIModel } from '@/core/ai/puter-ai'
import type { YouTubeVideo, NewsArticle, ContentFramework, PlatformSpec } from '../domain/content-types'

const API = '/api/content'

// ── Content Frameworks (client-side, no backend needed) ──
const FRAMEWORKS: Record<string, ContentFramework> = {
  'hook-story-offer': {
    name: 'Hook → Story → Offer',
    description: 'Attention hook, relatable story, clear CTA',
    structure: ['HOOK: Kontroverse Aussage oder ueberraschende Statistik', 'STORY: Persoenliche Geschichte oder Case Study', 'OFFER: Loesung + Call-to-Action'],
  },
  'aida': {
    name: 'AIDA',
    description: 'Attention → Interest → Desire → Action',
    structure: ['ATTENTION: Starke Headline', 'INTEREST: Problem vertiefen mit Fakten', 'DESIRE: Loesung + Social Proof', 'ACTION: Klarer CTA'],
  },
  'pas': {
    name: 'PAS',
    description: 'Problem → Agitate → Solution',
    structure: ['PROBLEM: Kernproblem benennen', 'AGITATE: Schmerz verstaerken', 'SOLUTION: Loesung praesentieren'],
  },
  'storytelling': {
    name: 'Storytelling (Heldenreise)',
    description: 'Hero journey narrative',
    structure: ['AUSGANGSLAGE: Wo stand der Held?', 'KONFLIKT: Welches Problem trat auf?', 'WENDEPUNKT: Was hat sich geaendert?', 'ERGEBNIS: Transformation + Lesson'],
  },
  'edu-tainment': {
    name: 'Edu-tainment',
    description: 'Education + Entertainment',
    structure: ['HOOK: Ueberraschende Frage oder Mythos', 'FAKT: Ueberraschendes Wissen teilen', 'BEISPIEL: Konkretes Praxisbeispiel', 'TAKEAWAY: Actionable Tipp'],
  },
}

const PLATFORMS: Record<string, PlatformSpec> = {
  instagram: { name: 'Instagram Reel', max_length: '60-90 Sekunden / 2200 Zeichen Caption', format: 'Vertikal 9:16', style: 'Schnelle Schnitte, Text-Overlays' },
  youtube: { name: 'YouTube', max_length: '8-15 Minuten', format: 'Horizontal 16:9', style: 'Ausfuehrlich, Kapitel, B-Roll' },
  youtube_short: { name: 'YouTube Short', max_length: '30-60 Sekunden', format: 'Vertikal 9:16', style: 'Schnell, Hook in 1s' },
  linkedin: { name: 'LinkedIn', max_length: '3000 Zeichen', format: 'Text + optional Bild', style: 'Professionell, Storytelling' },
  tiktok: { name: 'TikTok', max_length: '15-60 Sekunden', format: 'Vertikal 9:16', style: 'Trend-basiert, schnell, authentisch' },
}

interface ContentResearchStore {
  // State
  videos: YouTubeVideo[]
  articles: NewsArticle[]
  aiAnalysis: string | null
  aiContent: string | null
  aiModel: string | null
  frameworks: Record<string, ContentFramework>
  platforms: Record<string, PlatformSpec>
  loading: boolean
  loadingAI: boolean
  error: string | null
  selectedModel: AIModel

  // Actions
  searchYouTube: (query: string, maxResults?: number, sortBy?: string) => Promise<void>
  searchNews: (query: string, maxResults?: number) => Promise<void>
  analyzeContent: (content: unknown[], task: string, context?: string) => Promise<void>
  createContent: (topic: string, framework: string, platform: string, tone: string, researchData?: unknown) => Promise<void>
  setModel: (model: AIModel) => void
  clearAnalysis: () => void
  clearContent: () => void
}

export const useContentResearchStore = create<ContentResearchStore>((set, get) => ({
  videos: [],
  articles: [],
  aiAnalysis: null,
  aiContent: null,
  aiModel: null,
  frameworks: FRAMEWORKS,
  platforms: PLATFORMS,
  loading: false,
  loadingAI: false,
  error: null,
  selectedModel: 'gpt-4o',

  setModel: (model) => set({ selectedModel: model }),

  searchYouTube: async (query, maxResults = 10, sortBy = 'relevance') => {
    set({ loading: true, error: null })
    try {
      const resp = await fetch(`${API}/youtube`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, max_results: maxResults, sort_by: sortBy }),
      })
      const text = await resp.text()
      if (!text) throw new Error('Keine Antwort')
      const data = JSON.parse(text)
      if (!resp.ok) throw new Error(data.error || 'YouTube-Suche fehlgeschlagen')
      set({ videos: data.videos || [], loading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Fehler', loading: false })
    }
  },

  searchNews: async (query, maxResults = 10) => {
    set({ loading: true, error: null })
    try {
      const resp = await fetch(`${API}/news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, max_results: maxResults }),
      })
      const text = await resp.text()
      if (!text) throw new Error('Keine Antwort')
      const data = JSON.parse(text)
      if (!resp.ok) throw new Error(data.error || 'News-Suche fehlgeschlagen')
      set({ articles: data.articles || [], loading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Fehler', loading: false })
    }
  },

  analyzeContent: async (content, task, context) => {
    set({ loadingAI: true, error: null, aiAnalysis: null })
    try {
      if (!isPuterAvailable()) throw new Error('Puter.js nicht geladen. Bitte Seite neu laden.')

      const taskLabels: Record<string, string> = {
        analyze: 'Analysiere die folgenden Inhalte und identifiziere Trends, Muster und Key Takeaways',
        topics: 'Schlage 10 Content-Themen vor basierend auf diesen Recherche-Ergebnissen',
        frameworks: 'Empfehle die besten Content-Frameworks fuer diese Themen und erklaere warum',
        script: 'Schreibe ein detailliertes Video-Skript basierend auf diesen Recherche-Ergebnissen',
      }

      const prompt = `Du bist ein deutscher Content-Marketing-Experte.\n\nAufgabe: ${taskLabels[task] || task}\n\n${context ? `Kontext: ${context}\n\n` : ''}Recherche-Daten:\n${JSON.stringify(content, null, 2)}\n\nAntworte auf Deutsch, strukturiert und praxisnah.`

      const model = get().selectedModel
      const result = await aiChat(prompt, model)
      set({ aiAnalysis: result, aiModel: model, loadingAI: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'AI-Fehler', loadingAI: false })
    }
  },

  createContent: async (topic, framework, platform, tone, researchData) => {
    set({ loadingAI: true, error: null, aiContent: null })
    try {
      if (!isPuterAvailable()) throw new Error('Puter.js nicht geladen. Bitte Seite neu laden.')

      const fw = FRAMEWORKS[framework]
      const pl = PLATFORMS[platform]
      const toneLabels: Record<string, string> = {
        professional: 'professionell und vertrauenswuerdig',
        casual: 'locker und nahbar',
        bold: 'mutig, provokant und polarisierend',
        educational: 'lehrreich und wertvoll',
      }

      const prompt = `Du bist ein deutscher Content-Creator-Experte.

Erstelle Content zum Thema: "${topic}"

Framework: ${fw?.name || framework}
Struktur: ${fw?.structure.join(' → ') || 'Frei'}

Plattform: ${pl?.name || platform}
Format: ${pl?.format || 'Frei'} | Max: ${pl?.max_length || 'Frei'} | Stil: ${pl?.style || 'Frei'}

Ton: ${toneLabels[tone] || tone}

${researchData ? `\nRecherche-Daten als Inspiration:\n${JSON.stringify(researchData, null, 2)}` : ''}

Erstelle den vollstaendigen Content inkl. Hook, Body und CTA. Nutze das Framework strikt. Antworte auf Deutsch.`

      const model = get().selectedModel
      const result = await aiChat(prompt, model)
      set({ aiContent: result, aiModel: model, loadingAI: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'AI-Fehler', loadingAI: false })
    }
  },

  clearAnalysis: () => set({ aiAnalysis: null }),
  clearContent: () => set({ aiContent: null }),
}))
