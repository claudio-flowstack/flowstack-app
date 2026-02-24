import { memo } from "react"
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  ThumbsUp,
  Send,
  Music,
  MoreHorizontal,
  Globe,
  Repeat2,
} from "lucide-react"
import { cn } from "@/shared/lib/utils"
import type { MockupKind } from "@/modules/automation/domain/types"

// ── Props ───────────────────────────────────────────────────────────────────

interface MockupFrameProps {
  kind: MockupKind
  width: number
  height: number
  imageUrl?: string
  text?: string
  profileImage?: string
  profileName?: string
  bodyText?: string
  headline?: string
  description?: string
  ctaText?: string
  browserUrl?: string
  isSelected?: boolean
  className?: string
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const borderColor = "border-zinc-300/80 dark:border-zinc-700/50"
const borderStyle = "border-zinc-300/80 dark:border-zinc-700/50"
const subTextClass = "text-gray-400 dark:text-zinc-500"
const cardBg = "bg-white dark:bg-zinc-800/80"
const contentPlaceholderBg = "bg-gray-100 dark:bg-zinc-800"

function ImageArea({ imageUrl, fallbackText }: { imageUrl?: string; fallbackText: string }) {
  if (imageUrl) {
    return <img src={imageUrl} alt="" className="w-full h-full object-cover" />
  }
  return (
    <div className={cn("w-full h-full flex items-center justify-center border-2 border-dashed", contentPlaceholderBg, borderColor)}>
      <span className={cn("text-xs", subTextClass)}>{fallbackText}</span>
    </div>
  )
}

function ProfileAvatar({ src, fallbackBg, size = "w-8 h-8", rounded = "rounded-full" }: { src?: string; fallbackBg: string; size?: string; rounded?: string }) {
  if (src) {
    return <img src={src} alt="" className={cn(size, rounded, "object-cover")} />
  }
  return <div className={cn(size, rounded, fallbackBg)} />
}

// ── Mobile ──────────────────────────────────────────────────────────────────

function MobileFrame(props: MockupFrameProps) {
  return (
    <div className="h-full flex flex-col rounded-[20px] overflow-hidden border-2 border-zinc-300/80 dark:border-zinc-700/50 bg-gray-50/90 dark:bg-zinc-800/50">
      {/* Status bar */}
      <div className={cn("flex items-center justify-between px-4 py-1.5 border-b", borderStyle)}>
        <span className={cn("text-[8px] font-medium", subTextClass)}>9:41</span>
        <div className="w-16 h-4 rounded-full bg-zinc-900 dark:bg-zinc-600" />
        <div className="flex items-center gap-1">
          <div className={cn("text-[7px]", subTextClass)}>5G</div>
          <div className="flex gap-[1px]">
            {[3, 5, 7, 9].map((h) => (
              <div key={h} className="w-[3px] rounded-sm bg-zinc-400 dark:bg-zinc-500" style={{ height: h }} />
            ))}
          </div>
          <div className="w-4 h-2 rounded-sm border border-zinc-400 dark:border-zinc-500 relative">
            <div className="absolute inset-[1px] rounded-[1px] bg-zinc-400 dark:bg-zinc-500" style={{ width: "60%" }} />
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {props.imageUrl ? (
          <img src={props.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="p-3 space-y-2 h-full flex flex-col">
            {props.browserUrl && (
              <div className={cn("text-[8px] text-center truncate", subTextClass)}>{props.browserUrl}</div>
            )}
            {props.headline && (
              <p className="text-xs font-bold text-center text-gray-900 dark:text-white">{props.headline}</p>
            )}
            {props.bodyText && (
              <p className={cn("text-[9px] text-center", subTextClass)}>{props.bodyText}</p>
            )}
            {!props.headline && !props.bodyText && (
              <div className="flex-1 flex items-center justify-center">
                <span className={cn("text-xs text-center", subTextClass)}>{props.text || "Mobile Preview"}</span>
              </div>
            )}
            {props.ctaText && (
              <div className="mt-auto">
                <div className="bg-purple-600 text-white text-[9px] font-medium text-center py-1.5 rounded-xl">
                  {props.ctaText}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Home indicator */}
      <div className={cn("flex items-center justify-center py-2 border-t", borderStyle)}>
        <div className="w-8 h-1 rounded-full bg-zinc-400/60 dark:bg-zinc-600" />
      </div>
    </div>
  )
}

// ── Desktop ─────────────────────────────────────────────────────────────────

function DesktopFrame(props: MockupFrameProps) {
  return (
    <div className="h-full flex flex-col rounded-xl overflow-hidden border-2 border-zinc-300/80 dark:border-zinc-700/50 bg-gray-50/90 dark:bg-zinc-800/50">
      {/* Title bar with traffic lights + address bar */}
      <div className={cn("flex items-center gap-1.5 px-3 py-2 border-b", borderStyle)}>
        <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
        <div className="flex-1 mx-2 h-5 rounded-md flex items-center px-2 bg-gray-200/80 dark:bg-zinc-700/50">
          {props.browserUrl && (
            <span className={cn("text-[8px] truncate", subTextClass)}>{props.browserUrl}</span>
          )}
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {props.imageUrl ? (
          <img src={props.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="p-4 space-y-3 h-full flex flex-col">
            {props.headline && (
              <p className="text-sm font-bold text-gray-900 dark:text-white">{props.headline}</p>
            )}
            {props.bodyText && (
              <p className={cn("text-[10px]", subTextClass)}>{props.bodyText}</p>
            )}
            {!props.headline && !props.bodyText && (
              <div className="flex-1 flex items-center justify-center">
                <span className={cn("text-xs text-center", subTextClass)}>{props.text || "Desktop Preview"}</span>
              </div>
            )}
            {props.ctaText && (
              <div>
                <div className="bg-purple-600 text-white text-[10px] font-medium text-center py-2 rounded-xl w-32">
                  {props.ctaText}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Tablet ──────────────────────────────────────────────────────────────────

function TabletFrame(props: MockupFrameProps) {
  return (
    <div className="h-full flex flex-col rounded-3xl overflow-hidden border-2 border-zinc-300/80 dark:border-zinc-700/50 bg-gray-50/90 dark:bg-zinc-800/50">
      {/* Camera dot */}
      <div className={cn("flex items-center justify-center py-1.5 border-b", borderStyle)}>
        <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600" />
      </div>
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {props.imageUrl ? (
          <img src={props.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="p-3 space-y-2 h-full flex flex-col">
            {props.headline && (
              <p className="text-xs font-bold text-gray-900 dark:text-white">{props.headline}</p>
            )}
            {props.bodyText && (
              <p className={cn("text-[9px]", subTextClass)}>{props.bodyText}</p>
            )}
            {!props.headline && !props.bodyText && (
              <div className="flex-1 flex items-center justify-center">
                <span className={cn("text-xs text-center", subTextClass)}>{props.text || "Tablet Preview"}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Social Post ─────────────────────────────────────────────────────────────

function SocialPostFrame(props: MockupFrameProps) {
  return (
    <div className={cn("h-full flex flex-col rounded-xl overflow-hidden border-2", borderColor, cardBg)}>
      {/* Profile header */}
      <div className={cn("flex items-center gap-2 px-3 py-2.5 border-b", borderStyle)}>
        <ProfileAvatar src={props.profileImage} fallbackBg="bg-gradient-to-br from-purple-400 to-pink-400" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold truncate text-gray-900 dark:text-white">
            {props.profileName || "Your Brand"}
          </p>
          <p className={cn("text-[8px]", subTextClass)}>Jetzt <Globe className="inline w-2 h-2" /></p>
        </div>
        <MoreHorizontal className={cn("w-3.5 h-3.5", subTextClass)} />
      </div>
      {/* Post text */}
      {props.bodyText && (
        <div className="px-3 py-2">
          <p className="text-[9px] leading-relaxed text-gray-700 dark:text-zinc-300">{props.bodyText}</p>
        </div>
      )}
      {/* Image */}
      <div className="flex-1 overflow-hidden">
        <ImageArea imageUrl={props.imageUrl} fallbackText={props.text || "Bild hier"} />
      </div>
      {/* Engagement stats */}
      <div className={cn("flex items-center justify-between px-3 py-1.5 border-t", borderStyle)}>
        <div className="flex items-center gap-1">
          <ThumbsUp className="w-3 h-3 text-blue-500" />
          <span className={cn("text-[8px]", subTextClass)}>24</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn("text-[8px]", subTextClass)}>5 Kommentare</span>
          <span className={cn("text-[8px]", subTextClass)}>2 Mal geteilt</span>
        </div>
      </div>
      {/* Action bar */}
      <div className={cn("flex items-center justify-around py-1.5 border-t", borderStyle)}>
        <span className={cn("text-[8px] font-medium flex items-center gap-1", subTextClass)}>
          <ThumbsUp className="w-3 h-3" /> Gefällt mir
        </span>
        <span className={cn("text-[8px] font-medium flex items-center gap-1", subTextClass)}>
          <MessageCircle className="w-3 h-3" /> Kommentar
        </span>
        <span className={cn("text-[8px] font-medium flex items-center gap-1", subTextClass)}>
          <Share2 className="w-3 h-3" /> Teilen
        </span>
      </div>
    </div>
  )
}

// ── Ad Mockup (generic) ─────────────────────────────────────────────────────

function AdMockupFrame(props: MockupFrameProps) {
  return (
    <div className={cn("h-full flex flex-col rounded-xl overflow-hidden border-2", borderColor, cardBg)}>
      {/* Sponsor header */}
      <div className={cn("flex items-center gap-2 px-3 py-2 border-b", borderStyle)}>
        <ProfileAvatar src={props.profileImage} fallbackBg="bg-gradient-to-br from-blue-400 to-blue-600" size="w-7 h-7" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold truncate text-gray-900 dark:text-white">
            {props.profileName || "Brand Name"}
          </p>
          <p className={cn("text-[7px]", subTextClass)}>Gesponsert <Globe className="inline w-2 h-2" /></p>
        </div>
        <MoreHorizontal className={cn("w-3.5 h-3.5", subTextClass)} />
      </div>
      {/* Ad text */}
      {props.bodyText && (
        <div className="px-3 py-1.5">
          <p className="text-[9px] leading-relaxed text-gray-700 dark:text-zinc-300">{props.bodyText}</p>
        </div>
      )}
      {/* Ad image */}
      <div className="flex-1 overflow-hidden">
        <ImageArea imageUrl={props.imageUrl} fallbackText={props.text || "Bild hier"} />
      </div>
      {/* Headline + CTA */}
      <div className={cn("px-3 py-2 flex items-center gap-2 border-t bg-gray-50/80 dark:bg-zinc-800/60", borderStyle)}>
        <div className="flex-1 min-w-0">
          {props.browserUrl && (
            <p className={cn("text-[7px] uppercase tracking-wide truncate", subTextClass)}>{props.browserUrl}</p>
          )}
          <p className="text-[10px] font-semibold truncate text-gray-900 dark:text-white">
            {props.headline || "Ad Headline"}
          </p>
          {props.description && (
            <p className={cn("text-[8px] truncate", subTextClass)}>{props.description}</p>
          )}
        </div>
        <div className="shrink-0 bg-blue-600 text-white text-[8px] font-semibold px-2.5 py-1.5 rounded">
          {props.ctaText || "Mehr dazu"}
        </div>
      </div>
      {/* Engagement */}
      <div className={cn("flex items-center justify-around py-1.5 border-t", borderStyle)}>
        <span className={cn("text-[8px] font-medium flex items-center gap-1", subTextClass)}>
          <ThumbsUp className="w-3 h-3" /> Gefällt mir
        </span>
        <span className={cn("text-[8px] font-medium flex items-center gap-1", subTextClass)}>
          <MessageCircle className="w-3 h-3" /> Kommentar
        </span>
        <span className={cn("text-[8px] font-medium flex items-center gap-1", subTextClass)}>
          <Share2 className="w-3 h-3" /> Teilen
        </span>
      </div>
    </div>
  )
}

// ── Facebook Ad ─────────────────────────────────────────────────────────────

function FacebookAdFrame(props: MockupFrameProps) {
  return (
    <div className={cn("h-full flex flex-col rounded-xl overflow-hidden border-2", borderColor, cardBg)}>
      {/* Header */}
      <div className={cn("flex items-center gap-2 px-3 py-2 border-b bg-gray-100 dark:bg-zinc-800/60", borderStyle)}>
        <ProfileAvatar src={props.profileImage} fallbackBg="bg-[#1877F2]" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold truncate text-gray-900 dark:text-white">
            {props.profileName || "Brand Name"}
          </p>
          <p className={cn("text-[7px]", subTextClass)}>Gesponsert <Globe className="inline w-2 h-2" /></p>
        </div>
      </div>
      {/* Body text */}
      {props.bodyText && (
        <div className="px-3 py-1.5">
          <p className="text-[9px] leading-relaxed text-gray-700 dark:text-zinc-300">{props.bodyText}</p>
        </div>
      )}
      {/* Image */}
      <div className="flex-1 overflow-hidden">
        <ImageArea imageUrl={props.imageUrl} fallbackText={props.text || "Bild hier"} />
      </div>
      {/* Headline + CTA */}
      <div className={cn("px-3 py-2 flex items-center gap-2 border-t bg-gray-100 dark:bg-zinc-800/60", borderStyle)}>
        <div className="flex-1 min-w-0">
          {props.browserUrl && (
            <p className={cn("text-[7px] uppercase truncate", subTextClass)}>{props.browserUrl}</p>
          )}
          <p className="text-[10px] font-semibold truncate text-gray-900 dark:text-white">
            {props.headline || "Ad Headline"}
          </p>
        </div>
        <div className="shrink-0 bg-[#1877F2] text-white text-[8px] font-semibold px-2.5 py-1.5 rounded">
          {props.ctaText || "Mehr dazu"}
        </div>
      </div>
      {/* Like/Comment/Share bar */}
      <div className={cn("flex items-center justify-around py-1.5 border-t", borderStyle)}>
        <span className={cn("text-[8px] font-medium flex items-center gap-1", subTextClass)}>
          <ThumbsUp className="w-3 h-3" /> Gefällt mir
        </span>
        <span className={cn("text-[8px] font-medium flex items-center gap-1", subTextClass)}>
          <MessageCircle className="w-3 h-3" /> Kommentar
        </span>
        <span className={cn("text-[8px] font-medium flex items-center gap-1", subTextClass)}>
          <Share2 className="w-3 h-3" /> Teilen
        </span>
      </div>
    </div>
  )
}

// ── Instagram Ad ────────────────────────────────────────────────────────────

function InstagramAdFrame(props: MockupFrameProps) {
  return (
    <div className={cn("h-full flex flex-col rounded-xl overflow-hidden border-2", borderColor, cardBg)}>
      {/* Header with gradient ring */}
      <div className={cn("flex items-center gap-2 px-3 py-2 border-b", borderStyle)}>
        <div
          className="w-7 h-7 rounded-full p-[1.5px]"
          style={{ background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" }}
        >
          {props.profileImage ? (
            <img src={props.profileImage} alt="" className="w-full h-full rounded-full object-cover border-2 border-white dark:border-zinc-900" />
          ) : (
            <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold truncate text-gray-900 dark:text-white">
            {props.profileName || "brand_name"}
          </p>
          <p className={cn("text-[7px]", subTextClass)}>Gesponsert</p>
        </div>
        <MoreHorizontal className={cn("w-3.5 h-3.5", subTextClass)} />
      </div>
      {/* Image */}
      <div className="flex-1 overflow-hidden">
        <ImageArea imageUrl={props.imageUrl} fallbackText={props.text || "Bild hier"} />
      </div>
      {/* Icons row */}
      <div className={cn("flex items-center justify-between px-3 py-2 border-t", borderStyle)}>
        <div className="flex items-center gap-3">
          <Heart className="w-4 h-4 text-gray-900 dark:text-white" />
          <MessageCircle className="w-4 h-4 text-gray-900 dark:text-white" />
          <Send className="w-4 h-4 text-gray-900 dark:text-white" />
        </div>
        <Bookmark className="w-4 h-4 text-gray-900 dark:text-white" />
      </div>
      {/* Likes */}
      <div className="px-3 pb-1">
        <p className={cn("text-[8px] font-semibold text-gray-900 dark:text-white")}>
          Gefällt 128 Mal
        </p>
      </div>
      {/* Headline + body */}
      {props.headline && (
        <div className="px-3 pb-1">
          <p className="text-[9px] font-semibold text-gray-900 dark:text-white">{props.headline}</p>
        </div>
      )}
      {props.bodyText && (
        <div className="px-3 pb-2">
          <p className="text-[8px] text-gray-700 dark:text-zinc-300">{props.bodyText}</p>
        </div>
      )}
      {/* CTA button */}
      {props.ctaText && (
        <div className="px-3 pb-2">
          <button className="w-full text-[9px] font-semibold text-white py-1.5 rounded bg-[#0095f6]">
            {props.ctaText}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Google Ad ───────────────────────────────────────────────────────────────

function GoogleAdFrame(props: MockupFrameProps) {
  return (
    <div className={cn("h-full flex flex-col rounded-xl overflow-hidden p-4 border-2", borderColor, cardBg)}>
      {/* Ad badge + URL */}
      <div className="flex items-center gap-1 mb-1">
        <span className="text-[8px] font-bold text-white bg-zinc-800 dark:bg-zinc-600 px-1.5 py-0.5 rounded">
          Anzeige
        </span>
        <span className="text-[9px] text-zinc-800 dark:text-zinc-400">
          {props.browserUrl || "www.example.com"}
        </span>
      </div>
      {/* Blue headline link */}
      <p className="text-[13px] font-medium mb-1 text-[#1a0dab]">
        {props.headline || "Ad Headline – Hier klicken"}
      </p>
      {/* Optional description line */}
      {props.description && (
        <p className="text-[10px] mb-1 text-[#1a0dab]">{props.description}</p>
      )}
      {/* Gray body text */}
      <p className="text-[9px] leading-relaxed text-gray-600 dark:text-zinc-400">
        {props.bodyText || "Beschreibung der Werbeanzeige. Klicke hier um mehr zu erfahren über unser Angebot."}
      </p>
      {/* Sitelinks */}
      <div className="mt-auto pt-3 flex gap-2">
        {(props.ctaText || "Jetzt entdecken").split(",").map((link, i) => (
          <span key={i} className="text-[8px] font-medium text-[#1a0dab]">
            {">"} {link.trim()}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── LinkedIn Ad ─────────────────────────────────────────────────────────────

function LinkedInAdFrame(props: MockupFrameProps) {
  return (
    <div className={cn("h-full flex flex-col rounded-xl overflow-hidden border-2", borderColor, cardBg)}>
      {/* Header */}
      <div className={cn("flex items-center gap-2 px-3 py-2 border-b", borderStyle)}>
        <ProfileAvatar src={props.profileImage} fallbackBg="bg-[#0A66C2]" rounded="rounded" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold truncate text-gray-900 dark:text-white">
            {props.profileName || "Company Name"}
          </p>
          <p className={cn("text-[7px]", subTextClass)}>Gesponsert · Beworben</p>
        </div>
        <MoreHorizontal className={cn("w-3.5 h-3.5", subTextClass)} />
      </div>
      {/* Body text */}
      {props.bodyText && (
        <div className="px-3 py-1.5">
          <p className="text-[9px] leading-relaxed text-gray-700 dark:text-zinc-300">{props.bodyText}</p>
        </div>
      )}
      {/* Image */}
      <div className="flex-1 overflow-hidden">
        <ImageArea imageUrl={props.imageUrl} fallbackText={props.text || "Bild hier"} />
      </div>
      {/* Headline + CTA */}
      <div className={cn("px-3 py-2 flex items-center gap-2 border-t bg-gray-100/80 dark:bg-zinc-800/60", borderStyle)}>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold truncate text-gray-900 dark:text-white">
            {props.headline || "Sponsored Content"}
          </p>
          {props.browserUrl && (
            <p className={cn("text-[7px] truncate", subTextClass)}>{props.browserUrl}</p>
          )}
        </div>
        <div className="shrink-0 bg-[#0A66C2] text-white text-[8px] font-semibold px-2.5 py-1.5 rounded-full">
          {props.ctaText || "Mehr erfahren"}
        </div>
      </div>
      {/* Engagement bar */}
      <div className={cn("flex items-center justify-around py-1.5 border-t", borderStyle)}>
        <span className={cn("text-[7px] font-medium flex items-center gap-1", subTextClass)}>
          <ThumbsUp className="w-2.5 h-2.5" /> Gefällt mir
        </span>
        <span className={cn("text-[7px] font-medium flex items-center gap-1", subTextClass)}>
          <MessageCircle className="w-2.5 h-2.5" /> Kommentar
        </span>
        <span className={cn("text-[7px] font-medium flex items-center gap-1", subTextClass)}>
          <Repeat2 className="w-2.5 h-2.5" /> Teilen
        </span>
        <span className={cn("text-[7px] font-medium flex items-center gap-1", subTextClass)}>
          <Send className="w-2.5 h-2.5" /> Senden
        </span>
      </div>
    </div>
  )
}

// ── LinkedIn Post ───────────────────────────────────────────────────────────

function LinkedInPostFrame(props: MockupFrameProps) {
  return (
    <div className={cn("h-full flex flex-col rounded-xl overflow-hidden border-2", borderColor, cardBg)}>
      {/* Profile header */}
      <div className={cn("flex items-center gap-2 px-3 py-2.5 border-b", borderStyle)}>
        <ProfileAvatar src={props.profileImage} fallbackBg="bg-gradient-to-br from-[#0A66C2] to-[#004182]" size="w-9 h-9" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold truncate text-gray-900 dark:text-white">
            {props.profileName || "Max Mustermann"}
          </p>
          <p className={cn("text-[7px] truncate", subTextClass)}>
            {props.description || "CEO @ Unternehmen"}
          </p>
          <p className={cn("text-[7px]", subTextClass)}>Jetzt <Globe className="inline w-2 h-2" /></p>
        </div>
        <MoreHorizontal className={cn("w-3.5 h-3.5", subTextClass)} />
      </div>
      {/* Post text */}
      {props.bodyText && (
        <div className="px-3 py-2">
          <p className="text-[9px] leading-relaxed text-gray-700 dark:text-zinc-300">{props.bodyText}</p>
        </div>
      )}
      {/* Image */}
      <div className="flex-1 overflow-hidden">
        <ImageArea imageUrl={props.imageUrl} fallbackText={props.text || "Bild hier"} />
      </div>
      {/* Engagement stats */}
      <div className={cn("flex items-center justify-between px-3 py-1.5 border-t", borderStyle)}>
        <div className="flex items-center gap-1">
          <ThumbsUp className="w-3 h-3 text-blue-600" />
          <Heart className="w-3 h-3 text-red-500" />
          <span className={cn("text-[8px]", subTextClass)}>42</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn("text-[8px]", subTextClass)}>8 Kommentare</span>
          <span className={cn("text-[8px]", subTextClass)}>3 Reposts</span>
        </div>
      </div>
      {/* Action bar */}
      <div className={cn("flex items-center justify-around py-1.5 border-t", borderStyle)}>
        <span className={cn("text-[7px] font-medium flex items-center gap-1", subTextClass)}>
          <ThumbsUp className="w-2.5 h-2.5" /> Gefällt mir
        </span>
        <span className={cn("text-[7px] font-medium flex items-center gap-1", subTextClass)}>
          <MessageCircle className="w-2.5 h-2.5" /> Kommentar
        </span>
        <span className={cn("text-[7px] font-medium flex items-center gap-1", subTextClass)}>
          <Repeat2 className="w-2.5 h-2.5" /> Repost
        </span>
        <span className={cn("text-[7px] font-medium flex items-center gap-1", subTextClass)}>
          <Send className="w-2.5 h-2.5" /> Senden
        </span>
      </div>
    </div>
  )
}

// ── TikTok Ad ───────────────────────────────────────────────────────────────

function TikTokAdFrame(props: MockupFrameProps) {
  return (
    <div className="h-full flex flex-col rounded-2xl overflow-hidden relative border-2 border-zinc-300/80 dark:border-zinc-700/50 bg-black">
      {/* Fullscreen content */}
      <div className="flex-1 overflow-hidden relative">
        {props.imageUrl ? (
          <img src={props.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900">
            <span className="text-xs text-zinc-500">{props.text || "Video"}</span>
          </div>
        )}
        {/* Right sidebar icons */}
        <div className="absolute right-2 bottom-16 flex flex-col items-center gap-3">
          <div className="flex flex-col items-center">
            <Heart className="w-5 h-5 text-white" />
            <span className="text-white text-[7px]">1.2K</span>
          </div>
          <div className="flex flex-col items-center">
            <MessageCircle className="w-5 h-5 text-white" />
            <span className="text-white text-[7px]">348</span>
          </div>
          <div className="flex flex-col items-center">
            <Bookmark className="w-5 h-5 text-white" />
            <span className="text-white text-[7px]">89</span>
          </div>
          <div className="flex flex-col items-center">
            <Share2 className="w-5 h-5 text-white" />
            <span className="text-white text-[7px]">245</span>
          </div>
        </div>
      </div>
      {/* Bottom overlay */}
      <div
        className="absolute bottom-0 left-0 right-0 p-3"
        style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.8))" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <ProfileAvatar
            src={props.profileImage}
            fallbackBg="bg-gradient-to-br from-pink-500 to-violet-500"
            size="w-6 h-6"
          />
          <span className="text-white text-[9px] font-semibold">
            @{props.profileName || "brand"}
          </span>
          {props.ctaText && (
            <span className="text-[7px] text-white bg-red-500 px-1.5 py-0.5 rounded font-medium">
              Gesponsert
            </span>
          )}
        </div>
        {props.bodyText && (
          <p className="text-white text-[8px] leading-relaxed mb-1">{props.bodyText}</p>
        )}
        {props.headline && (
          <p className="text-white text-[8px] flex items-center gap-1">
            <Music className="w-3 h-3" /> {props.headline}
          </p>
        )}
        {props.ctaText && (
          <button className="mt-1.5 w-full text-[9px] font-bold text-white py-1.5 rounded-sm bg-[#fe2c55]">
            {props.ctaText}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Frame Renderer Map ──────────────────────────────────────────────────────

const FRAME_RENDERERS: Record<MockupKind, (props: MockupFrameProps) => JSX.Element> = {
  "mobile": MobileFrame,
  "desktop": DesktopFrame,
  "tablet": TabletFrame,
  "social-post": SocialPostFrame,
  "ad-mockup": AdMockupFrame,
  "facebook-ad": FacebookAdFrame,
  "instagram-ad": InstagramAdFrame,
  "google-ad": GoogleAdFrame,
  "linkedin-ad": LinkedInAdFrame,
  "linkedin-post": LinkedInPostFrame,
  "tiktok-ad": TikTokAdFrame,
}

// ── Exported Component ──────────────────────────────────────────────────────

const MockupFrame = memo(function MockupFrame(props: MockupFrameProps) {
  const Renderer = FRAME_RENDERERS[props.kind] ?? AdMockupFrame

  return (
    <div
      className={cn(
        "relative transition-shadow",
        props.isSelected && "ring-2 ring-blue-500 ring-offset-1 ring-offset-transparent rounded-xl",
        props.className,
      )}
      style={{ width: props.width, height: props.height }}
    >
      <Renderer {...props} />
    </div>
  )
})

export default MockupFrame
