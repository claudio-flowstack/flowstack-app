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
  ChevronUp,
} from "lucide-react"
import { twMerge } from "tailwind-merge"
import { clsx } from "clsx"

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs))
}

// ── Types ────────────────────────────────────────────────────────────────────

export type AdPlatform = "facebook" | "instagram" | "google" | "linkedin" | "tiktok"
export type AdPlacement = "feed" | "story" | "reel"

// ── Props ───────────────────────────────────────────────────────────────────

interface MockupFrameProps {
  kind: string
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

function ProfileAvatar({ src, fallbackBg, size = "w-10 h-10", rounded = "rounded-full" }: { src?: string; fallbackBg: string; size?: string; rounded?: string }) {
  if (src) {
    return <img src={src} alt="" className={cn(size, rounded, "object-cover")} />
  }
  return <div className={cn(size, rounded, fallbackBg)} />
}

// ── Facebook Ad ─────────────────────────────────────────────────────────────

function FacebookAdFrame(props: MockupFrameProps) {
  return (
    <div className={cn("h-full flex flex-col rounded-xl overflow-hidden border-2", borderColor, cardBg)}>
      {/* Header */}
      <div className={cn("flex items-center gap-2 px-3 py-2 border-b bg-gray-100 dark:bg-zinc-800/60", borderStyle)}>
        <ProfileAvatar src={props.profileImage} fallbackBg="bg-[#1877F2]" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate text-gray-900 dark:text-white">
            {props.profileName || "Brand Name"}
          </p>
          <p className={cn("text-xs text-[#65676B]")}>Gesponsert <Globe className="inline w-3 h-3" /></p>
        </div>
      </div>
      {/* Body text */}
      {props.bodyText && (
        <div className="px-3 py-1.5">
          <p className="text-sm leading-snug text-[#050505] dark:text-zinc-300">{props.bodyText}</p>
        </div>
      )}
      {/* Image */}
      <div className="flex-1 overflow-hidden">
        <ImageArea imageUrl={props.imageUrl} fallbackText={props.text || "Bild hier"} />
      </div>
      {/* Headline + Description + CTA */}
      <div className={cn("px-3 py-2 flex items-center gap-2 border-t bg-gray-100 dark:bg-zinc-800/60", borderStyle)}>
        <div className="flex-1 min-w-0">
          {props.browserUrl && (
            <p className={cn("text-xs uppercase truncate text-[#65676B]")}>{props.browserUrl}</p>
          )}
          <p className="text-base font-semibold truncate text-gray-900 dark:text-white">
            {props.headline || "Ad Headline"}
          </p>
          {props.description && (
            <p className="text-sm truncate text-[#65676B] dark:text-zinc-400">{props.description}</p>
          )}
        </div>
        <div className="shrink-0 bg-[#1877F2] text-white text-sm font-semibold px-4 py-2 rounded">
          {props.ctaText || "Mehr dazu"}
        </div>
      </div>
      {/* Like/Comment/Share bar */}
      <div className={cn("flex items-center justify-around py-1.5 border-t", borderStyle)}>
        <span className="text-[13px] font-semibold flex items-center gap-1 text-[#65676B]">
          <ThumbsUp className="w-5 h-5" /> Gefällt mir
        </span>
        <span className="text-[13px] font-semibold flex items-center gap-1 text-[#65676B]">
          <MessageCircle className="w-5 h-5" /> Kommentar
        </span>
        <span className="text-[13px] font-semibold flex items-center gap-1 text-[#65676B]">
          <Share2 className="w-5 h-5" /> Teilen
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
          className="w-9 h-9 rounded-full p-[1.5px]"
          style={{ background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" }}
        >
          {props.profileImage ? (
            <img src={props.profileImage} alt="" className="w-full h-full rounded-full object-cover border-2 border-white dark:border-zinc-900" />
          ) : (
            <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold truncate text-gray-900 dark:text-white">
            {props.profileName || "brand_name"}
          </p>
          <p className="text-[11px] text-[#65676B]">Gesponsert</p>
        </div>
        <MoreHorizontal className={cn("w-5 h-5", subTextClass)} />
      </div>
      {/* Image */}
      <div className="flex-1 overflow-hidden">
        <ImageArea imageUrl={props.imageUrl} fallbackText={props.text || "Bild hier"} />
      </div>
      {/* Icons row */}
      <div className={cn("flex items-center justify-between px-3 py-2 border-t", borderStyle)}>
        <div className="flex items-center gap-3">
          <Heart className="w-6 h-6 text-gray-900 dark:text-white" />
          <MessageCircle className="w-6 h-6 text-gray-900 dark:text-white" />
          <Send className="w-6 h-6 text-gray-900 dark:text-white" />
        </div>
        <Bookmark className="w-6 h-6 text-gray-900 dark:text-white" />
      </div>
      {/* Likes */}
      <div className="px-3 pb-1">
        <p className="text-[13px] font-semibold text-gray-900 dark:text-white">
          Gefällt 128 Mal
        </p>
      </div>
      {/* Headline + body */}
      {props.headline && (
        <div className="px-3 pb-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{props.headline}</p>
        </div>
      )}
      {props.bodyText && (
        <div className="px-3 pb-2">
          <p className="text-[13px] text-gray-700 dark:text-zinc-300">{props.bodyText}</p>
        </div>
      )}
      {/* CTA button */}
      {props.ctaText && (
        <div className="px-3 pb-2">
          <button className="w-full text-sm font-semibold text-white py-2 rounded bg-[#0095f6]">
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
    <div className={cn("h-full flex flex-col rounded-xl overflow-hidden p-5 border-2", borderColor, cardBg)}>
      {/* Ad label + URL */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5 border border-gray-400 rounded px-1.5 py-0.5">
          <span className="text-xs font-medium text-gray-600">Anzeige</span>
        </div>
        <div className="flex items-center gap-1">
          <Globe className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-sm text-green-700 dark:text-green-400">{props.browserUrl || "www.example.com"}</span>
        </div>
      </div>
      {/* Blue headline */}
      <p className="text-xl font-normal mb-1 text-[#1a0dab] hover:underline cursor-pointer leading-tight">
        {props.headline || "Ad Headline – Hier klicken"}
      </p>
      {props.description && (
        <p className="text-base mb-2 text-[#1a0dab]">{props.description}</p>
      )}
      {/* Gray body */}
      <p className="text-sm leading-relaxed text-gray-600 dark:text-zinc-400 mb-4">
        {props.bodyText || "Beschreibung der Werbeanzeige..."}
      </p>
      {/* Sitelinks */}
      <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-3 border-t border-gray-100 dark:border-zinc-700">
        <span className="text-sm font-medium text-[#1a0dab] hover:underline cursor-pointer">Jetzt bewerben</span>
        <span className="text-sm font-medium text-[#1a0dab] hover:underline cursor-pointer">Über uns</span>
        <span className="text-sm font-medium text-[#1a0dab] hover:underline cursor-pointer">FAQ</span>
        <span className="text-sm font-medium text-[#1a0dab] hover:underline cursor-pointer">Kontakt</span>
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
          <p className="text-sm font-semibold truncate text-gray-900 dark:text-white">
            {props.profileName || "Company Name"}
          </p>
          <p className={cn("text-xs", subTextClass)}>Gesponsert · Beworben</p>
        </div>
        <MoreHorizontal className={cn("w-5 h-5", subTextClass)} />
      </div>
      {/* Body text */}
      {props.bodyText && (
        <div className="px-3 py-1.5">
          <p className="text-sm leading-snug text-gray-700 dark:text-zinc-300">{props.bodyText}</p>
        </div>
      )}
      {/* Image */}
      <div className="flex-1 overflow-hidden">
        <ImageArea imageUrl={props.imageUrl} fallbackText={props.text || "Bild hier"} />
      </div>
      {/* Headline + CTA */}
      <div className={cn("px-3 py-2 flex items-center gap-2 border-t bg-gray-100/80 dark:bg-zinc-800/60", borderStyle)}>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold truncate text-gray-900 dark:text-white">
            {props.headline || "Sponsored Content"}
          </p>
          {props.browserUrl && (
            <p className={cn("text-xs truncate", subTextClass)}>{props.browserUrl}</p>
          )}
        </div>
        <div className="shrink-0 bg-[#0A66C2] text-white text-sm font-semibold px-4 py-2 rounded-full">
          {props.ctaText || "Mehr erfahren"}
        </div>
      </div>
      {/* Engagement bar */}
      <div className={cn("flex items-center justify-around py-1.5 border-t", borderStyle)}>
        <span className={cn("text-[13px] font-semibold flex items-center gap-1", subTextClass)}>
          <ThumbsUp className="w-5 h-5" /> Gefällt mir
        </span>
        <span className={cn("text-[13px] font-semibold flex items-center gap-1", subTextClass)}>
          <MessageCircle className="w-5 h-5" /> Kommentar
        </span>
        <span className={cn("text-[13px] font-semibold flex items-center gap-1", subTextClass)}>
          <Repeat2 className="w-5 h-5" /> Teilen
        </span>
        <span className={cn("text-[13px] font-semibold flex items-center gap-1", subTextClass)}>
          <Send className="w-5 h-5" /> Senden
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
            <span className="text-sm text-zinc-500">{props.text || "Video"}</span>
          </div>
        )}
        {/* Right sidebar icons */}
        <div className="absolute right-3 bottom-20 flex flex-col items-center gap-4">
          <div className="flex flex-col items-center">
            <Heart className="w-7 h-7 text-white" />
            <span className="text-white text-xs">1.2K</span>
          </div>
          <div className="flex flex-col items-center">
            <MessageCircle className="w-7 h-7 text-white" />
            <span className="text-white text-xs">348</span>
          </div>
          <div className="flex flex-col items-center">
            <Bookmark className="w-7 h-7 text-white" />
            <span className="text-white text-xs">89</span>
          </div>
          <div className="flex flex-col items-center">
            <Share2 className="w-7 h-7 text-white" />
            <span className="text-white text-xs">245</span>
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
            size="w-8 h-8"
          />
          <span className="text-white text-sm font-semibold">
            @{props.profileName || "brand"}
          </span>
          {props.ctaText && (
            <span className="text-xs text-white bg-red-500 px-2 py-0.5 rounded font-medium">
              Gesponsert
            </span>
          )}
        </div>
        {props.bodyText && (
          <p className="text-white text-sm leading-relaxed mb-1">{props.bodyText}</p>
        )}
        {props.headline && (
          <p className="text-white text-sm flex items-center gap-1">
            <Music className="w-4 h-4" /> {props.headline}
          </p>
        )}
        {props.ctaText && (
          <button className="mt-1.5 w-full text-sm font-bold text-white py-2 rounded-sm bg-[#fe2c55]">
            {props.ctaText}
          </button>
        )}
      </div>
    </div>
  )
}

// ── AdPreview Wrapper ───────────────────────────────────────────────────────

interface AdPreviewProps {
  content: string
  title: string
  placement?: "feed" | "story" | "reel"
  platform?: "facebook" | "instagram" | "google" | "linkedin" | "tiktok"
  headline?: string
  description?: string
  ctaText?: string
  imageUrl?: string
  linkUrl?: string
  profileName?: string
  profileImage?: string
}

// ── Facebook Story Frame ────────────────────────────────────────────────────

function FacebookStoryFrame(props: MockupFrameProps) {
  return (
    <div className="h-full flex flex-col rounded-2xl overflow-hidden relative border-2 border-zinc-300/80 dark:border-zinc-700/50 bg-black">
      <div className="flex-1 overflow-hidden relative">
        {props.imageUrl ? (
          <img src={props.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-zinc-800 to-zinc-900">
            <span className="text-sm text-zinc-500">Story Creative</span>
          </div>
        )}
        {/* Top: dark overlay with profile + Gesponsert */}
        <div className="absolute top-0 left-0 right-0 z-10 px-3 pt-3 pb-6" style={{ background: "linear-gradient(rgba(0,0,0,0.5), transparent)" }}>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full border-2 border-[#1877F2] overflow-hidden">
              {props.profileImage ? (
                <img src={props.profileImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#1877F2]" />
              )}
            </div>
            <div>
              <p className="text-white text-xs font-semibold drop-shadow">{props.profileName || "Brand"}</p>
              <p className="text-[#1877F2] text-[10px] font-medium drop-shadow">Gesponsert</p>
            </div>
          </div>
        </div>
        {/* Bottom: gradient with text + swipe CTA */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.75))" }}>
          {props.bodyText && (
            <p className="text-white text-sm mb-3 line-clamp-3 drop-shadow">{props.bodyText}</p>
          )}
          <div className="flex flex-col items-center gap-1 pt-2 border-t border-white/20">
            <ChevronUp className="w-5 h-5 text-[#1877F2]" />
            <span className="text-white text-sm font-medium">Nach oben wischen</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Instagram Story Frame ──────────────────────────────────────────────────

function InstagramStoryFrame(props: MockupFrameProps) {
  return (
    <div className="h-full flex flex-col rounded-2xl overflow-hidden relative border-2 border-zinc-300/80 dark:border-zinc-700/50 bg-black">
      <div className="flex-1 overflow-hidden relative">
        {props.imageUrl ? (
          <img src={props.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-zinc-800 to-zinc-900">
            <span className="text-sm text-zinc-500">Story Creative</span>
          </div>
        )}
        {/* Top: progress bar segments */}
        <div className="absolute top-0 left-0 right-0 z-10 px-2 pt-2">
          <div className="flex gap-1">
            <div className="flex-1 h-[2px] rounded-full bg-white/90" />
            <div className="flex-1 h-[2px] rounded-full bg-white/30" />
            <div className="flex-1 h-[2px] rounded-full bg-white/30" />
          </div>
          {/* Profile with gradient ring */}
          <div className="flex items-center gap-2 mt-2">
            <div
              className="w-8 h-8 rounded-full p-[1.5px]"
              style={{ background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" }}
            >
              {props.profileImage ? (
                <img src={props.profileImage} alt="" className="w-full h-full rounded-full object-cover border-[1.5px] border-black" />
              ) : (
                <div className="w-full h-full rounded-full bg-zinc-900 border-[1.5px] border-black" />
              )}
            </div>
            <div>
              <p className="text-white text-xs font-semibold drop-shadow">{props.profileName || "brand_name"}</p>
              <p className="text-white/60 text-[10px] drop-shadow">Gesponsert</p>
            </div>
          </div>
        </div>
        {/* Bottom: "Mehr erfahren" swipe-up with gradient */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.6))" }}>
          <div className="flex flex-col items-center gap-1">
            <ChevronUp className="w-5 h-5 text-white" />
            <span className="text-white text-sm font-medium tracking-wide">Mehr erfahren</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Facebook Reel Frame ────────────────────────────────────────────────────

function FacebookReelFrame(props: MockupFrameProps) {
  return (
    <div className="h-full flex flex-col rounded-2xl overflow-hidden relative border-2 border-zinc-300/80 dark:border-zinc-700/50 bg-black">
      <div className="flex-1 overflow-hidden relative">
        {props.imageUrl ? (
          <img src={props.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900">
            <span className="text-sm text-zinc-500">Reel Video</span>
          </div>
        )}
        {/* Center play button */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="h-14 w-14 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center">
            <svg className="w-7 h-7 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </div>
        </div>
        {/* Right sidebar icons */}
        <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 z-10">
          <div className="flex flex-col items-center">
            <ThumbsUp className="w-7 h-7 text-white" />
            <span className="text-white text-[10px]">1.2K</span>
          </div>
          <div className="flex flex-col items-center">
            <MessageCircle className="w-7 h-7 text-white" />
            <span className="text-white text-[10px]">348</span>
          </div>
          <div className="flex flex-col items-center">
            <Share2 className="w-7 h-7 text-white" />
            <span className="text-white text-[10px]">245</span>
          </div>
        </div>
        {/* Bottom overlay: profile + text + Gesponsert badge */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-10" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.8))" }}>
          <div className="flex items-center gap-2 mb-1">
            <ProfileAvatar src={props.profileImage} fallbackBg="bg-[#1877F2]" size="w-8 h-8" />
            <span className="text-white text-sm font-semibold">{props.profileName || "Brand"}</span>
            <span className="text-[10px] text-white bg-[#1877F2] px-1.5 py-0.5 rounded font-medium">Gesponsert</span>
          </div>
          {props.bodyText && <p className="text-white text-sm mb-1 line-clamp-2">{props.bodyText}</p>}
        </div>
      </div>
    </div>
  )
}

// ── Instagram Reel Frame ───────────────────────────────────────────────────

function InstagramReelFrame(props: MockupFrameProps) {
  return (
    <div className="h-full flex flex-col rounded-2xl overflow-hidden relative border-2 border-zinc-300/80 dark:border-zinc-700/50 bg-black">
      <div className="flex-1 overflow-hidden relative">
        {props.imageUrl ? (
          <img src={props.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900">
            <span className="text-sm text-zinc-500">Reel Video</span>
          </div>
        )}
        {/* Gesponsert label top-left */}
        <div className="absolute top-3 left-3 z-10">
          <span className="text-white/70 text-[10px] font-medium">Gesponsert</span>
        </div>
        {/* Right sidebar icons */}
        <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5 z-10">
          <div className="flex flex-col items-center">
            <Heart className="w-7 h-7 text-red-500" fill="currentColor" />
            <span className="text-white text-[10px]">4.2K</span>
          </div>
          <div className="flex flex-col items-center">
            <MessageCircle className="w-7 h-7 text-white" />
            <span className="text-white text-[10px]">128</span>
          </div>
          <div className="flex flex-col items-center">
            <Send className="w-7 h-7 text-white" />
            <span className="text-white text-[10px]">89</span>
          </div>
          <div className="flex flex-col items-center">
            <Bookmark className="w-7 h-7 text-white" />
          </div>
          <div className="flex flex-col items-center">
            <Music className="w-6 h-6 text-white" />
          </div>
        </div>
        {/* Bottom overlay: @username + music info */}
        <div className="absolute bottom-12 left-0 right-0 p-3 z-10" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.7))" }}>
          <div className="flex items-center gap-2 mb-1">
            <ProfileAvatar src={props.profileImage} fallbackBg="bg-gradient-to-br from-pink-500 to-violet-500" size="w-8 h-8" />
            <span className="text-white text-sm font-semibold">@{props.profileName || "brand"}</span>
          </div>
          {props.bodyText && <p className="text-white text-xs mb-1 line-clamp-2">{props.bodyText}</p>}
          <div className="flex items-center gap-1 mt-1">
            <Music className="w-3 h-3 text-white" />
            <span className="text-white text-[10px]">Original Audio</span>
          </div>
        </div>
        {/* CTA bar at bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <button className="w-full text-sm font-bold text-white py-2.5 bg-[#0095f6]">
            {props.ctaText || "Jetzt bewerben"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main AdPreview Component ────────────────────────────────────────────────

export default function AdPreview({ content, title, placement = "feed", platform = "facebook", headline, description, ctaText, imageUrl, linkUrl, profileName, profileImage }: AdPreviewProps) {
  const strippedContent = (content || "").replace(/<[^>]*>/g, "")

  // Extract hostname from linkUrl for browser display
  let browserUrl = "karriere.firma.de"
  if (linkUrl) {
    try { browserUrl = new URL(linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`).hostname; } catch { /* keep default */ }
  }

  const frameProps: MockupFrameProps = {
    kind: platform,
    width: 375,
    height: 500,
    imageUrl,
    text: strippedContent,
    profileImage,
    profileName: profileName || title,
    bodyText: strippedContent,
    headline,
    description,
    ctaText: ctaText || "Jetzt bewerben",
    browserUrl,
  }

  const isVertical = placement === 'story' || placement === 'reel';
  const containerWidth = isVertical ? 280 : 375;
  const containerHeight = isVertical ? 500 : 500;

  return (
    <div className="flex justify-center">
      <div style={{ width: containerWidth, height: containerHeight }}>
        {/* Story placement */}
        {placement === 'story' && (
          <>
            {platform === 'facebook' && <FacebookStoryFrame {...frameProps} />}
            {platform === 'instagram' && <InstagramStoryFrame {...frameProps} />}
            {platform === 'tiktok' && <TikTokAdFrame {...frameProps} />}
            {/* google/linkedin: fall back to feed */}
            {(platform === 'google' || platform === 'linkedin') && (
              <>
                {platform === "google" && <GoogleAdFrame {...frameProps} />}
                {platform === "linkedin" && <LinkedInAdFrame {...frameProps} />}
              </>
            )}
          </>
        )}
        {/* Reel placement */}
        {placement === 'reel' && (
          <>
            {platform === 'facebook' && <FacebookReelFrame {...frameProps} />}
            {platform === 'instagram' && <InstagramReelFrame {...frameProps} />}
            {platform === 'tiktok' && <TikTokAdFrame {...frameProps} />}
          </>
        )}
        {/* Feed placement */}
        {placement === 'feed' && (
          <>
            {platform === "facebook" && <FacebookAdFrame {...frameProps} />}
            {platform === "instagram" && <InstagramAdFrame {...frameProps} />}
            {platform === "google" && <GoogleAdFrame {...frameProps} />}
            {platform === "linkedin" && <LinkedInAdFrame {...frameProps} />}
            {platform === "tiktok" && <TikTokAdFrame {...frameProps} />}
          </>
        )}
      </div>
    </div>
  )
}
