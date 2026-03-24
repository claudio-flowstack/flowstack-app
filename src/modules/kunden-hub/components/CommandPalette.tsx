import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFulfillmentStore } from '../store/fulfillment-store';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: 'client' | 'deliverable' | 'action' | 'nav';
  action: () => void;
}

const ICON_MAP = {
  client: (
    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
    </svg>
  ),
  deliverable: (
    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  action: (
    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
  nav: (
    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  ),
};

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const clients = useFulfillmentStore((s) => s.clients);
  const approvals = useFulfillmentStore((s) => s.approvals);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build command list
  const commands = useMemo((): CommandItem[] => {
    const items: CommandItem[] = [];

    // Navigation commands
    items.push(
      { id: 'nav-home', label: 'Übersicht', description: 'Dashboard öffnen', icon: 'nav', action: () => navigate('/kunden-hub') },
      { id: 'nav-clients', label: 'Kundenliste', description: 'Alle Kunden anzeigen', icon: 'nav', action: () => navigate('/kunden-hub/clients') },
      { id: 'nav-new', label: 'Neuer Kunde', description: 'Onboarding starten', icon: 'action', action: () => navigate('/kunden-hub/onboarding') },
      { id: 'nav-settings', label: 'Einstellungen', icon: 'nav', action: () => navigate('/kunden-hub/settings') },
    );

    // Client commands
    for (const c of clients) {
      items.push({
        id: `client-${c.id}`,
        label: c.company,
        description: `${c.status} — ${c.currentPhase}`,
        icon: 'client',
        action: () => navigate(`/kunden-hub/clients/${c.id}`),
      });
    }

    // Pending approvals
    const pending = approvals.filter((a) => a.status === 'pending');
    for (const a of pending) {
      items.push({
        id: `approval-${a.id}`,
        label: `Freigabe: ${a.deliverableTitle}`,
        description: a.clientName,
        icon: 'action',
        action: () => navigate(`/kunden-hub/clients/${a.clientId}?tab=deliverables`),
      });
    }

    return items;
  }, [clients, approvals, navigate]);

  // Filter by query
  const filtered = useMemo(() => {
    if (!query.trim()) return commands.slice(0, 10);
    const q = query.toLowerCase();
    return commands.filter(
      (c) => c.label.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [commands, query]);

  // Reset selection when results change
  useEffect(() => { setSelectedIndex(0); }, [filtered]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = filtered[selectedIndex];
      if (item) {
        item.action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[20vh]" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className="relative w-full max-w-lg rounded-xl bg-white shadow-2xl border border-gray-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <svg className="h-5 w-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Suche nach Kunden, Aktionen..."
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              Keine Ergebnisse
            </div>
          ) : (
            filtered.map((item, i) => (
              <button
                key={item.id}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  i === selectedIndex ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => { item.action(); onClose(); }}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                {ICON_MAP[item.icon]}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.label}</p>
                  {item.description && (
                    <p className="text-xs text-gray-400 truncate">{item.description}</p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
