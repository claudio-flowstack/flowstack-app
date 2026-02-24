import type { YouTubeVideo } from '../domain/content-types'
import { ExternalLink, Eye, ThumbsUp, MessageCircle, Clock } from 'lucide-react'

interface Props {
  videos: YouTubeVideo[]
}

export function YouTubeResults({ videos }: Props) {
  if (videos.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        YouTube Ergebnisse ({videos.length})
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  )
}

function VideoCard({ video }: { video: YouTubeVideo }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-colors">
      {/* Thumbnail */}
      {video.thumbnail && (
        <a href={video.url} target="_blank" rel="noopener noreferrer" className="block relative">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-40 object-cover"
          />
          {video.duration_string && (
            <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
              {video.duration_string}
            </span>
          )}
        </a>
      )}

      <div className="p-3.5 space-y-2">
        {/* Title */}
        <a href={video.url} target="_blank" rel="noopener noreferrer"
          className="text-sm font-medium text-foreground hover:text-primary line-clamp-2 transition-colors">
          {video.title}
          <ExternalLink className="inline h-3 w-3 ml-1 opacity-50" />
        </a>

        {/* Channel */}
        <a href={video.channel_url} target="_blank" rel="noopener noreferrer"
          className="block text-xs text-muted-foreground hover:text-foreground transition-colors">
          {video.channel}
        </a>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {video.views_formatted}
          </span>
          <span className="inline-flex items-center gap-1">
            <ThumbsUp className="h-3 w-3" />
            {video.likes_formatted}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            {video.comments?.toLocaleString('de-DE') ?? '0'}
          </span>
        </div>

        {/* Engagement + Date */}
        <div className="flex items-center justify-between text-xs">
          {video.engagement_rate > 0 && (
            <span className={`font-medium ${
              video.engagement_rate >= 5 ? 'text-emerald-500' :
              video.engagement_rate >= 2 ? 'text-amber-500' : 'text-muted-foreground'
            }`}>
              {video.engagement_rate.toFixed(1)}% Engagement
            </span>
          )}
          {video.upload_date && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              {video.upload_date}
            </span>
          )}
        </div>

        {/* Tags */}
        {video.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {video.tags.slice(0, 5).map((tag) => (
              <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                {tag}
              </span>
            ))}
            {video.tags.length > 5 && (
              <span className="text-[10px] text-muted-foreground">+{video.tags.length - 5}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
