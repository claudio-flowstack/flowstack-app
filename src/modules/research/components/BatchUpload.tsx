import { useState, useRef, useCallback } from 'react'
import { useResearchStore } from '../application/research-store'
import { EnrichmentProgress } from './EnrichmentProgress'
import { Upload, FileText, CheckCircle2 } from 'lucide-react'
import { StatusBadge } from '@/shared/components/StatusBadge'

export function BatchUpload() {
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [delimiter, setDelimiter] = useState(',')
  const [preview, setPreview] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const { startBatch, cancelBatch, batchProgress, batchJobs } = useResearchStore()

  const handleFile = useCallback((f: File) => {
    setFile(f)
    // Read first line to preview columns
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      if (!text) return
      const firstLine = text.split('\n')[0] || ''
      // Auto-detect delimiter
      const semiCount = (firstLine.match(/;/g) || []).length
      const commaCount = (firstLine.match(/,/g) || []).length
      const det = semiCount > commaCount ? ';' : ','
      setDelimiter(det)
      setPreview(firstLine.split(det).map((c) => c.trim().replace(/^"|"$/g, '')))
    }
    reader.readAsText(f)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f && (f.name.endsWith('.csv') || f.type === 'text/csv')) {
      handleFile(f)
    }
  }, [handleFile])

  const handleStart = () => {
    if (!file) return
    startBatch(file, delimiter)
  }

  const lastComplete = batchJobs.find((j) => j.status === 'complete')

  return (
    <div className="space-y-6">
      {/* Active progress */}
      {batchProgress && (
        <EnrichmentProgress progress={batchProgress} onCancel={cancelBatch} />
      )}

      {/* Upload area */}
      {!batchProgress && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-5">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`
              relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed
              py-10 px-4 cursor-pointer transition-colors
              ${dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'}
              ${file ? 'border-emerald-500/50 bg-emerald-500/5' : ''}
            `}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {file ? (
              <>
                <FileText className="h-8 w-8 text-emerald-500 mb-2" />
                <p className="text-sm font-medium text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(file.size / 1024).toFixed(1)} KB &middot; Trennzeichen: {delimiter === ';' ? 'Semikolon' : 'Komma'}
                </p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-foreground">CSV-Datei hierher ziehen</p>
                <p className="text-xs text-muted-foreground mt-1">oder klicken zum Auswaehlen</p>
              </>
            )}
          </div>

          {/* Column preview */}
          {preview.length > 0 && (
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Erkannte Spalten ({preview.length})
              </span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {preview.map((col, i) => (
                  <StatusBadge key={i} variant="default">{col}</StatusBadge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Die Spalten Firma, Website und Stadt werden automatisch erkannt.
              </p>
            </div>
          )}

          {/* Start button */}
          {file && (
            <button
              onClick={handleStart}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Enrichment starten
            </button>
          )}
        </div>
      )}

      {/* Last completed job */}
      {lastComplete && !batchProgress && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium text-foreground">Letzter Batch abgeschlossen</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox label="Leads" value={lastComplete.total} />
            <StatBox label="GF gefunden" value={lastComplete.gf_found} />
            <StatBox label="Emails" value={lastComplete.emails_found} />
            <StatBox label="Dauer" value={`${Math.round((lastComplete.duration_seconds || 0) / 60)} Min`} />
          </div>
          {lastComplete.job_id && (
            <a
              href={`/api/research/results/${lastComplete.job_id}/download`}
              className="inline-flex items-center gap-1.5 mt-3 text-sm text-primary hover:underline"
            >
              CSV herunterladen
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2">
      <div className="text-lg font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
