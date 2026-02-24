import { StatusBadge } from '@/shared/components/StatusBadge'
import { PRIORITY_COLORS, SOCIAL_LABELS } from '../domain/constants'
import { ScoreBreakdown } from './ScoreBreakdown'
import type { EnrichedLead } from '../domain/types'
import {
  User, Mail, Phone, Globe, Building2, MapPin, FileText,
  ExternalLink, CheckCircle2, HelpCircle, Smartphone, X,
} from 'lucide-react'

interface Props {
  lead: EnrichedLead
  onClose?: () => void
  expanded?: boolean
}

function InfoRow({ icon: Icon, label, value, href }: {
  icon: typeof User
  label: string
  value: string
  href?: string
}) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <span className="text-muted-foreground shrink-0">{label}:</span>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
          {value}
        </a>
      ) : (
        <span className="text-foreground truncate">{value}</span>
      )}
    </div>
  )
}

export function LeadResultCard({ lead, onClose, expanded = true }: Props) {
  const priority = lead.prioritaet || 'Niedrig'
  const variant = PRIORITY_COLORS[priority] ?? 'muted'
  const socialEntries = Object.entries(lead.social_media || {})

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 p-5 border-b border-border bg-muted/30">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-semibold text-foreground truncate">{lead.firma}</h3>
            <StatusBadge variant={variant} dot>{priority}</StatusBadge>
            <span className="text-lg font-bold text-foreground">{lead.score}</span>
          </div>
          {lead.website && (
            <a href={lead.website} target="_blank" rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mt-1">
              <Globe className="h-3.5 w-3.5" />
              {lead.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {expanded && (
        <div className="p-5 space-y-5">
          {/* Contact info */}
          <div className="space-y-2">
            <InfoRow icon={User} label="GF" value={lead.geschaeftsfuehrer} />
            {lead.gf_email && (
              <div className="flex items-start gap-2.5 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <span className="text-muted-foreground shrink-0">GF-Email:</span>
                <span className="text-foreground">{lead.gf_email}</span>
                {lead.gf_email_status === 'verified' ? (
                  <span className="inline-flex items-center gap-1 text-emerald-500 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5" /> verifiziert
                  </span>
                ) : lead.gf_email_status === 'guessed' ? (
                  <span className="inline-flex items-center gap-1 text-amber-500 text-xs">
                    <HelpCircle className="h-3.5 w-3.5" /> geraten
                  </span>
                ) : null}
              </div>
            )}
            {lead.emails?.length > 0 && (
              <InfoRow icon={Mail} label="Email" value={lead.emails.join(', ')} />
            )}
            {lead.telefone?.length > 0 && (
              <InfoRow icon={Phone} label="Telefon" value={lead.telefone.join(', ')} />
            )}
            {lead.mobilnummer && (
              <InfoRow icon={Smartphone} label="Mobil" value={lead.mobilnummer} />
            )}
            <InfoRow icon={MapPin} label="Adresse" value={lead.adresse} />
            <InfoRow icon={FileText} label="HR" value={lead.handelsregister} />
            <InfoRow icon={Building2} label="Mitarbeiter" value={lead.mitarbeiter_schaetzung ? `ca. ${lead.mitarbeiter_schaetzung}` : ''} />
          </div>

          {/* Tech & Content */}
          {(lead.technologie || lead.hat_blog || lead.hat_karriereseite) && (
            <div className="flex flex-wrap gap-1.5">
              {lead.technologie && lead.technologie !== 'Custom/Unbekannt' && (
                <StatusBadge variant="info">{lead.technologie}</StatusBadge>
              )}
              {lead.hat_blog && <StatusBadge variant="active">Blog</StatusBadge>}
              {lead.hat_karriereseite && <StatusBadge variant="active">Karriereseite</StatusBadge>}
            </div>
          )}

          {/* Social Media */}
          {socialEntries.length > 0 && (
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Social Media</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {socialEntries.map(([platform, url]) => (
                  <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors">
                    {SOCIAL_LABELS[platform] || platform}
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* External Reviews */}
          {(lead.trustpilot || lead.kununu) && (
            <div className="flex gap-3">
              {lead.trustpilot?.score && (
                <a href={lead.trustpilot.url || '#'} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted/50 transition-colors">
                  <span className="font-medium">Trustpilot</span>
                  <span className="text-emerald-500 font-bold">{lead.trustpilot.score}</span>
                </a>
              )}
              {lead.kununu?.rating && (
                <a href={lead.kununu.url || '#'} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted/50 transition-colors">
                  <span className="font-medium">Kununu</span>
                  <span className="text-emerald-500 font-bold">{lead.kununu.rating}</span>
                </a>
              )}
            </div>
          )}

          {/* Score Breakdown */}
          {lead.score_breakdown && (
            <div className="pt-3 border-t border-border">
              <ScoreBreakdown breakdown={lead.score_breakdown} total={lead.score} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
