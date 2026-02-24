import { useState } from 'react'
import { useResearchStore } from '../application/research-store'
import { LeadResultCard } from './LeadResultCard'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { SearchInput } from '@/shared/components/SearchInput'
import { EmptyState } from '@/shared/components/EmptyState'
import { PRIORITY_COLORS } from '../domain/constants'
import type { EnrichedLead } from '../domain/types'
import { Database, ChevronDown, ChevronUp, X } from 'lucide-react'

type SortKey = 'firma' | 'score' | 'prioritaet' | 'geschaeftsfuehrer'

export function ResultsTable() {
  const { results, removeResult } = useResearchStore()
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('score')
  const [sortAsc, setSortAsc] = useState(false)
  const [filterPriority, setFilterPriority] = useState<string>('')
  const [selectedLead, setSelectedLead] = useState<EnrichedLead | null>(null)

  // Filter
  let filtered = results
  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(
      (l) =>
        l.firma.toLowerCase().includes(q) ||
        (l.geschaeftsfuehrer || '').toLowerCase().includes(q) ||
        (l.website || '').toLowerCase().includes(q),
    )
  }
  if (filterPriority) {
    filtered = filtered.filter((l) => l.prioritaet === filterPriority)
  }

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0
    if (sortKey === 'score') cmp = (a.score || 0) - (b.score || 0)
    else if (sortKey === 'firma') cmp = a.firma.localeCompare(b.firma)
    else if (sortKey === 'geschaeftsfuehrer') cmp = (a.geschaeftsfuehrer || '').localeCompare(b.geschaeftsfuehrer || '')
    else if (sortKey === 'prioritaet') {
      const order = { Hoch: 0, Mittel: 1, Niedrig: 2 }
      cmp = (order[a.prioritaet] ?? 3) - (order[b.prioritaet] ?? 3)
    }
    return sortAsc ? cmp : -cmp
  })

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(false) }
  }

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (sortAsc ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />) : null

  if (results.length === 0) {
    return (
      <EmptyState
        icon={Database}
        title="Noch keine Ergebnisse"
        description="Starte eine Recherche im Recherche-Tab oder lade eine CSV im Batch-Tab hoch."
      />
    )
  }

  // Detail view
  if (selectedLead) {
    return (
      <div>
        <button
          onClick={() => setSelectedLead(null)}
          className="inline-flex items-center gap-1 mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Zurueck zur Tabelle
        </button>
        <LeadResultCard lead={selectedLead} onClose={() => setSelectedLead(null)} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="Firma, GF oder Website..." className="w-64" />
        <div className="flex gap-1.5">
          {['', 'Hoch', 'Mittel', 'Niedrig'].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                filterPriority === p
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {p || 'Alle'}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground ml-auto">{sorted.length} Ergebnisse</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <Th onClick={() => handleSort('firma')}>Firma <SortIcon k="firma" /></Th>
              <Th onClick={() => handleSort('geschaeftsfuehrer')}>GF <SortIcon k="geschaeftsfuehrer" /></Th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Technologie</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Social</th>
              <Th onClick={() => handleSort('score')}>Score <SortIcon k="score" /></Th>
              <Th onClick={() => handleSort('prioritaet')}>Prio <SortIcon k="prioritaet" /></Th>
              <th className="px-3 py-2.5 w-8" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((lead) => {
              const socialCount = Object.keys(lead.social_media || {}).length
              return (
                <tr
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <td className="px-3 py-2.5 font-medium text-foreground max-w-[200px] truncate">{lead.firma}</td>
                  <td className="px-3 py-2.5 text-muted-foreground max-w-[150px] truncate">{lead.geschaeftsfuehrer || '-'}</td>
                  <td className="px-3 py-2.5 text-muted-foreground max-w-[180px] truncate">{lead.gf_email || (lead.emails?.[0] || '-')}</td>
                  <td className="px-3 py-2.5 text-muted-foreground max-w-[120px] truncate">{lead.technologie || '-'}</td>
                  <td className="px-3 py-2.5">
                    {socialCount > 0 ? (
                      <StatusBadge variant="info">{socialCount} Kanael{socialCount > 1 ? 'e' : ''}</StatusBadge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-bold text-foreground">{lead.score}</td>
                  <td className="px-3 py-2.5">
                    <StatusBadge variant={PRIORITY_COLORS[lead.prioritaet] ?? 'muted'} dot>
                      {lead.prioritaet}
                    </StatusBadge>
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); lead.id && removeResult(lead.id) }}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Th({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <th
      onClick={onClick}
      className="px-3 py-2.5 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
    >
      <span className="inline-flex items-center gap-1">{children}</span>
    </th>
  )
}
