import type { NewsArticle } from '../domain/content-types'
import { ExternalLink, Newspaper } from 'lucide-react'

interface Props {
  articles: NewsArticle[]
}

export function NewsResults({ articles }: Props) {
  if (articles.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        News Ergebnisse ({articles.length})
      </h3>
      <div className="space-y-2">
        {articles.map((article, i) => (
          <ArticleRow key={`${article.url}-${i}`} article={article} />
        ))}
      </div>
    </div>
  )
}

function ArticleRow({ article }: { article: NewsArticle }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 rounded-xl border border-border bg-card p-3.5 hover:border-primary/30 transition-colors"
    >
      {/* Image or icon */}
      {article.image ? (
        <img
          src={article.image}
          alt=""
          className="h-16 w-24 rounded-lg object-cover shrink-0"
        />
      ) : (
        <div className="h-16 w-24 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <Newspaper className="h-6 w-6 text-muted-foreground" />
        </div>
      )}

      <div className="min-w-0 flex-1 space-y-1">
        {/* Title */}
        <h4 className="text-sm font-medium text-foreground line-clamp-2">
          {article.title}
          <ExternalLink className="inline h-3 w-3 ml-1 opacity-40" />
        </h4>

        {/* Body preview */}
        {article.body && (
          <p className="text-xs text-muted-foreground line-clamp-2">{article.body}</p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {article.source && <span className="font-medium">{article.source}</span>}
          {article.source && article.date && <span>·</span>}
          {article.date && <span>{article.date}</span>}
        </div>
      </div>
    </a>
  )
}
