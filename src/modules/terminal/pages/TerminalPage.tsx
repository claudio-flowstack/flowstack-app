import { TerminalSquare } from 'lucide-react'
import { TerminalShell } from '../components/TerminalShell'

export function TerminalPage() {
  return (
    <div className="flex flex-col h-full p-6 gap-4">
      {/* Header */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="p-2 rounded-lg bg-indigo-500/10">
          <TerminalSquare className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Terminal</h1>
          <p className="text-xs text-zinc-500">Befehle & Skripte ausfuehren</p>
        </div>
      </div>

      {/* Terminal */}
      <div className="flex-1 min-h-0 relative">
        <TerminalShell />
      </div>
    </div>
  )
}
