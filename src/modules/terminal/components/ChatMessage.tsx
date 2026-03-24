import { useState, memo } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check } from 'lucide-react'
import type { ChatMessage as ChatMessageType } from '../domain/types'

/** Claude sunburst logo */
function ClaudeLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2C12 2 12 8.5 12 12M12 12C12 12 12 15.5 12 22M12 12C8.5 12 2 12 2 12M12 12C15.5 12 22 12 22 12M12 12C12 12 5.17 5.17 5.17 5.17M12 12C12 12 18.83 18.83 18.83 18.83M12 12C12 12 18.83 5.17 18.83 5.17M12 12C12 12 5.17 18.83 5.17 18.83"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

interface ChatMessageProps {
  message: ChatMessageType
  isStreaming?: boolean
}

export const ChatMessage = memo(function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="px-4 py-4">
        <div className="flex justify-end">
          <div className="bg-[#2a2a35] rounded-2xl px-4 py-3 max-w-[80%]">
            <p className="text-[14px] text-zinc-100 whitespace-pre-wrap leading-relaxed">{message.content}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4">
      <div className="flex gap-3">
        {/* Claude Avatar */}
        <div className="w-7 h-7 rounded-full bg-[#da7756]/10 flex items-center justify-center shrink-0 mt-0.5">
          <ClaudeLogo className="w-3.5 h-3.5 text-[#da7756]" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="text-[14px] text-zinc-300 leading-[1.7]">
            <Markdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '')
                  const code = String(children).replace(/\n$/, '')

                  if (match) {
                    return <CodeBlock language={match[1]} code={code} />
                  }

                  return (
                    <code
                      className="bg-zinc-800 text-zinc-200 px-1.5 py-0.5 rounded text-[13px] font-mono"
                      {...props}
                    >
                      {children}
                    </code>
                  )
                },
                p({ children }) {
                  return <p className="mb-3 last:mb-0 leading-[1.7]">{children}</p>
                },
                ul({ children }) {
                  return <ul className="mb-3 pl-5 space-y-1.5 list-disc marker:text-zinc-600">{children}</ul>
                },
                ol({ children }) {
                  return <ol className="mb-3 pl-5 space-y-1.5 list-decimal marker:text-zinc-600">{children}</ol>
                },
                li({ children }) {
                  return <li className="text-zinc-300 leading-[1.6]">{children}</li>
                },
                h1({ children }) {
                  return <h1 className="text-lg font-semibold text-zinc-100 mb-3 mt-5 first:mt-0">{children}</h1>
                },
                h2({ children }) {
                  return <h2 className="text-base font-semibold text-zinc-100 mb-2.5 mt-4 first:mt-0">{children}</h2>
                },
                h3({ children }) {
                  return <h3 className="text-sm font-semibold text-zinc-200 mb-2 mt-3 first:mt-0">{children}</h3>
                },
                blockquote({ children }) {
                  return <blockquote className="border-l-2 border-[#da7756]/30 pl-4 my-3 text-zinc-400 italic">{children}</blockquote>
                },
                table({ children }) {
                  return (
                    <div className="overflow-x-auto my-3 rounded-lg border border-zinc-800/60">
                      <table className="text-[13px] border-collapse w-full">{children}</table>
                    </div>
                  )
                },
                th({ children }) {
                  return <th className="border-b border-zinc-700/60 bg-zinc-800/40 px-3 py-2 text-left text-zinc-300 font-medium">{children}</th>
                },
                td({ children }) {
                  return <td className="border-b border-zinc-800/40 px-3 py-2 text-zinc-400">{children}</td>
                },
                a({ href, children }) {
                  return <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#da7756] hover:text-[#e88a6a] underline underline-offset-2 decoration-[#da7756]/30">{children}</a>
                },
                hr() {
                  return <hr className="border-zinc-800/50 my-4" />
                },
              }}
            >
              {message.content}
            </Markdown>
            {isStreaming && (
              <span className="inline-block w-1.5 h-5 bg-[#da7756] animate-pulse rounded-sm ml-0.5 align-middle" />
            )}
          </div>

          {/* Cost */}
          {message.cost != null && message.cost > 0 && (
            <div className="mt-2 text-[10px] text-zinc-600 font-mono">
              ${message.cost.toFixed(4)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-zinc-800/60 bg-[#141418]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/25 border-b border-zinc-800/50">
        <span className="text-[11px] text-zinc-500 font-mono">{language}</span>
        <button
          className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
          onClick={handleCopy}
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Kopiert' : 'Kopieren'}
        </button>
      </div>
      <SyntaxHighlighter
        style={oneDark}
        language={language}
        customStyle={{
          margin: 0,
          padding: '16px',
          background: 'transparent',
          fontSize: '13px',
          lineHeight: '1.6',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}
