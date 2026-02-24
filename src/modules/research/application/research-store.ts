// ── Research Store (Zustand) ──

import { create } from 'zustand'
import type { EnrichedLead, WebsiteResult, EmailResult, BatchProgress, BatchJob } from '../domain/types'
import { API_BASE } from '../domain/constants'

interface ResearchStore {
  // State
  results: EnrichedLead[]
  batchJobs: BatchJob[]
  currentResult: EnrichedLead | null
  batchProgress: BatchProgress | null
  loading: boolean
  error: string | null

  // Single Research
  researchSingle: (firma: string, website?: string, stadt?: string) => Promise<EnrichedLead | null>
  findWebsite: (firma: string, stadt?: string) => Promise<WebsiteResult | null>
  verifyEmail: (gfName: string, domain: string, firma?: string) => Promise<EmailResult | null>

  // Batch
  startBatch: (file: File, delimiter?: string) => void
  cancelBatch: () => void

  // Results
  clearCurrentResult: () => void
  removeResult: (id: string) => void

  // Computed
  stats: () => { total: number; withGF: number; withEmail: number; avgScore: number }
}

let batchAbort: AbortController | null = null

export const useResearchStore = create<ResearchStore>((set, get) => ({
  results: [],
  batchJobs: [],
  currentResult: null,
  batchProgress: null,
  loading: false,
  error: null,

  researchSingle: async (firma, website, stadt) => {
    set({ loading: true, error: null, currentResult: null })
    try {
      const resp = await fetch(`${API_BASE}/single`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firma, website: website || undefined, stadt: stadt || undefined }),
      })
      const text = await resp.text()
      if (!text) throw new Error('Keine Antwort vom Server')
      let data: EnrichedLead
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error('Ungueltige Antwort vom Server')
      }
      if (!resp.ok) {
        throw new Error((data as unknown as { error?: string }).error || 'Recherche fehlgeschlagen')
      }
      if ((data as unknown as { error?: string }).error) {
        throw new Error((data as unknown as { error: string }).error)
      }
      data.id = crypto.randomUUID()
      data.researched_at = new Date().toISOString()

      set((s) => ({
        currentResult: data,
        results: [data, ...s.results],
        loading: false,
      }))
      return data
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unbekannter Fehler'
      set({ error: msg, loading: false })
      return null
    }
  },

  findWebsite: async (firma, stadt) => {
    set({ loading: true, error: null })
    try {
      const resp = await fetch(`${API_BASE}/find-website`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firma, stadt: stadt || undefined }),
      })
      if (!resp.ok) throw new Error('Website-Suche fehlgeschlagen')
      const data: WebsiteResult = await resp.json()
      set({ loading: false })
      return data
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Fehler'
      set({ error: msg, loading: false })
      return null
    }
  },

  verifyEmail: async (gfName, domain, firma) => {
    set({ loading: true, error: null })
    try {
      const resp = await fetch(`${API_BASE}/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gf_name: gfName, domain, firma: firma || undefined }),
      })
      if (!resp.ok) throw new Error('Email-Verifikation fehlgeschlagen')
      const data: EmailResult = await resp.json()
      set({ loading: false })
      return data
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Fehler'
      set({ error: msg, loading: false })
      return null
    }
  },

  startBatch: (file, delimiter = ',') => {
    batchAbort = new AbortController()
    const formData = new FormData()
    formData.append('file', file)
    formData.append('delimiter', delimiter)

    const job: BatchJob = {
      job_id: '',
      status: 'running',
      total: 0,
      current: 0,
      gf_found: 0,
      emails_found: 0,
      websites_found: 0,
      started_at: new Date().toISOString(),
    }

    set((s) => ({
      batchProgress: { current: 0, total: 0, firma: '', gf_found: 0, emails_found: 0, websites_found: 0, rate: 0, eta_seconds: 0, has_gf: false, has_email: false, score: 0 },
      batchJobs: [job, ...s.batchJobs],
      error: null,
    }))

    fetch(`${API_BASE}/batch`, {
      method: 'POST',
      body: formData,
      signal: batchAbort.signal,
    })
      .then(async (resp) => {
        if (!resp.ok) {
          const err = await resp.json()
          set({ error: err.error || 'Batch fehlgeschlagen', batchProgress: null })
          return
        }
        const reader = resp.body?.getReader()
        if (!reader) return
        const decoder = new TextDecoder()
        let buffer = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })

            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6))
                  // Check if it's a progress event
                  if (data.current !== undefined && data.total !== undefined) {
                    set({ batchProgress: data as BatchProgress })
                  }
                  // Check if it's a complete event
                  if (data.job_id && data.duration_seconds !== undefined) {
                    set((s) => {
                      const jobs = [...s.batchJobs]
                      if (jobs[0]) {
                        jobs[0] = { ...jobs[0], ...data, status: 'complete' }
                      }
                      return { batchJobs: jobs, batchProgress: null }
                    })
                  }
                  // Check if it's a start event
                  if (data.job_id && data.total && !data.duration_seconds) {
                    set((s) => {
                      const jobs = [...s.batchJobs]
                      if (jobs[0]) {
                        jobs[0] = { ...jobs[0], job_id: data.job_id, total: data.total }
                      }
                      return { batchJobs: jobs }
                    })
                  }
                } catch {
                  // ignore parse errors
                }
              }
            }
          }
        } catch (streamErr) {
          set({ error: streamErr instanceof Error ? streamErr.message : 'Stream-Fehler', batchProgress: null })
        }
      })
      .catch((e) => {
        if (e.name !== 'AbortError') {
          set({ error: e.message, batchProgress: null })
        }
      })
  },

  cancelBatch: () => {
    if (batchAbort) {
      batchAbort.abort()
      batchAbort = null
    }
    set({ batchProgress: null })
  },

  clearCurrentResult: () => set({ currentResult: null }),

  removeResult: (id) =>
    set((s) => ({ results: s.results.filter((r) => r.id !== id) })),

  stats: () => {
    const r = get().results
    const total = r.length
    const withGF = r.filter((l) => l.geschaeftsfuehrer).length
    const withEmail = r.filter((l) => l.gf_email).length
    const avgScore = total > 0 ? Math.round(r.reduce((s, l) => s + (l.score || 0), 0) / total) : 0
    return { total, withGF, withEmail, avgScore }
  },
}))
