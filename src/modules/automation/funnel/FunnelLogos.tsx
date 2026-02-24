/**
 * Funnel-specific platform logos and icon resolution helper.
 *
 * All logos from the original FunnelLogos (TikTok, GoogleAds, Instagram,
 * Calendly, Stripe, YouTube, Typeform, Telegram, MicrosoftTeams, Mailchimp,
 * Pipedrive) have been consolidated into ToolLogos.tsx.
 *
 * This file provides:
 * 1. FUNNEL_LOGOS -- registry for any future funnel-only SVG logos
 * 2. renderFunnelIcon() -- unified resolver: ToolLogos -> FUNNEL_LOGOS -> lucide-react
 */

import React from 'react'
import { renderNodeIcon } from '../canvas/ToolLogos'
import {
  Globe,
  Mail,
  FileText,
  Search,
  Video,
  Target,
  Image as ImageIcon,
  Monitor,
  Smartphone,
  Tablet,
  Type,
  Eye,
  BarChart3,
  ShoppingCart,
  MessageSquare,
  Zap,
} from 'lucide-react'

// ── Lucide fallback registry ────────────────────────────────────────────────

const LUCIDE_MAP: Record<string, React.FC<{ size?: number; color?: string; className?: string }>> = {
  'globe': Globe,
  'mail': Mail,
  'file-text': FileText,
  'search': Search,
  'video': Video,
  'target': Target,
  'image': ImageIcon,
  'monitor': Monitor,
  'smartphone': Smartphone,
  'tablet': Tablet,
  'type': Type,
  'eye': Eye,
  'bar-chart': BarChart3,
  'shopping-cart': ShoppingCart,
  'message-square': MessageSquare,
  'zap': Zap,
}

// ── Funnel-specific logos ───────────────────────────────────────────────────
// Currently empty -- all original FunnelLogos SVGs are already in ToolLogos.
// Add future funnel-only logos here with the same inline SVG pattern.

export const FUNNEL_LOGOS: Record<string, (props: { size?: number }) => JSX.Element> = {
  // Example for future additions:
  // 'funnel-custom-logo': ({ size = 20 }) => (
  //   <svg width={size} height={size} viewBox="0 0 24 24" fill="none">...</svg>
  // ),
}

// ── Unified icon resolver ───────────────────────────────────────────────────

/**
 * Renders the appropriate icon for a funnel element.
 *
 * Resolution order:
 * 1. ToolLogos registry (via renderNodeIcon) -- handles all `logo-*` keys
 * 2. FUNNEL_LOGOS registry -- funnel-specific SVGs not in ToolLogos
 * 3. Lucide-react icon map -- for generic keys like 'globe', 'mail', 'search'
 * 4. Provided fallback node
 * 5. null
 */
export function renderFunnelIcon(
  iconKey: string,
  color?: string,
  fallback?: React.ReactNode,
  size?: number,
): React.ReactNode {
  const iconSize = size ?? 20

  // 1. Try ToolLogos (covers all logo-* prefixed keys)
  const toolResult = renderNodeIcon(iconKey, undefined, undefined, iconSize)
  if (toolResult) return toolResult

  // 2. Try funnel-specific logos
  const FunnelLogo = FUNNEL_LOGOS[iconKey]
  if (FunnelLogo) {
    return React.createElement(FunnelLogo, { size: iconSize })
  }

  // 3. Try lucide-react icons
  const LucideIcon = LUCIDE_MAP[iconKey]
  if (LucideIcon) {
    return React.createElement(LucideIcon, {
      size: iconSize,
      ...(color ? { style: { color } } : {}),
    })
  }

  // 4. Fallback
  if (fallback) return fallback

  return null
}
