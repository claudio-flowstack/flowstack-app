import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import Badge from '../ui/components/badge/Badge';
import Button from '../ui/components/button/Button';
import { Modal } from '../ui/components/modal';
import TextArea from '../ui/form/input/TextArea';

interface CommunicationTabProps {
  clientId: string;
}

type MessageType = 'slack' | 'email' | 'call';

interface Message {
  id: string;
  type: MessageType;
  from: string;
  content: string;
  timestamp: string;
  channel?: string;
  subject?: string;
}

const initialMessages: Message[] = [
  { id: 'm1', type: 'slack', from: 'Claudio', content: 'Kickoff-Termin steht für Montag 10:00. Bitte Materialien vorbereiten.', timestamp: '2026-03-19T14:30:00Z', channel: '#client-mueller' },
  { id: 'm2', type: 'email', from: 'Sandra Müller', content: 'Vielen Dank für die schnelle Bearbeitung. Die Strategie-Dokumente sehen gut aus. Nur beim Messaging könnten wir noch etwas direkter formulieren.', timestamp: '2026-03-19T11:00:00Z', subject: 'Re: Strategie-Freigabe' },
  { id: 'm3', type: 'slack', from: 'Anak', content: 'Pixel ist eingebaut und feuert korrekt. Events sichtbar im Meta Events Manager.', timestamp: '2026-03-18T16:00:00Z', channel: '#client-mueller' },
  { id: 'm4', type: 'call', from: 'Claudio', content: 'Telefonat mit Herrn Müller: Budget kann auf 3.000\u20AC/Monat erhöht werden ab April. Will vorher aber erste Ergebnisse sehen.', timestamp: '2026-03-18T10:00:00Z' },
  { id: 'm5', type: 'email', from: 'Claudio', content: 'Hallo Frau Müller, anbei die überarbeiteten Anzeigentexte. Bitte um Feedback bis Freitag.', timestamp: '2026-03-17T15:00:00Z', subject: 'Anzeigentexte V2' },
  { id: 'm6', type: 'slack', from: 'System', content: '\u2713 Müller Pflege \u2014 Strategie & Brand wurde fertiggestellt', timestamp: '2026-03-17T12:00:00Z', channel: '#ff-log' },
  { id: 'm7', type: 'slack', from: 'Claudio', content: 'Creative Briefing ist zur Freigabe bereit. @Anak bitte auch drüberschauen.', timestamp: '2026-03-16T14:00:00Z', channel: '#client-mueller' },
  { id: 'm8', type: 'call', from: 'Claudio', content: 'Erstgespräch mit Sandra Müller. Hauptproblem: Pflegekräfte-Mangel. Will in 4 Wochen live sein.', timestamp: '2026-03-15T10:00:00Z' },
];

type FilterType = 'all' | 'slack' | 'email' | 'call';

const CommunicationTab: React.FC<CommunicationTabProps> = ({ clientId: _clientId }) => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendChannel, setSendChannel] = useState<'slack' | 'email'>('slack');
  const [sendContent, setSendContent] = useState('');

  const filters: { key: FilterType; labelKey: string }[] = [
    { key: 'all', labelKey: 'comm.all' },
    { key: 'slack', labelKey: 'comm.slack' },
    { key: 'email', labelKey: 'comm.email' },
    { key: 'call', labelKey: 'comm.calls' },
  ];

  const filtered = filter === 'all' ? messages : messages.filter((m) => m.type === filter);

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSend = () => {
    if (!sendContent.trim()) return;
    const newMsg: Message = {
      id: `m${Date.now()}`,
      type: sendChannel,
      from: 'Claudio',
      content: sendContent.trim(),
      timestamp: new Date().toISOString(),
      ...(sendChannel === 'slack' ? { channel: '#client-mueller' } : { subject: 'Neue Nachricht' }),
    };
    setMessages((prev) => [newMsg, ...prev]);
    setSendContent('');
    setShowSendModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Filter pills + send button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                filter === f.key
                  ? 'bg-brand-500 text-white'
                  : 'text-gray-500 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03]'
              }`}
            >
              {t(f.labelKey)}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setShowSendModal(true)}>
          {t('comm.sendMessage')}
        </Button>
      </div>

      {/* Message list */}
      <div className="space-y-3">
        {filtered.map((msg) => {
          const isExpanded = expandedId === msg.id;
          return (
            <div
              key={msg.id}
              onClick={() => setExpandedId(isExpanded ? null : msg.id)}
              className="flex gap-3 rounded-2xl border border-gray-200 bg-white p-4 cursor-pointer hover:border-gray-300 transition dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-700"
            >
              {/* Type icon */}
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                msg.type === 'slack'
                  ? 'bg-purple-50 text-purple-500 dark:bg-purple-500/15 dark:text-purple-400'
                  : msg.type === 'email'
                    ? 'bg-blue-50 text-blue-500 dark:bg-blue-500/15 dark:text-blue-400'
                    : 'bg-green-50 text-green-500 dark:bg-green-500/15 dark:text-green-400'
              }`}>
                {msg.type === 'slack' && <MessageSquareIcon className="h-4 w-4" />}
                {msg.type === 'email' && <MailIcon className="h-4 w-4" />}
                {msg.type === 'call' && <PhoneIcon className="h-4 w-4" />}
              </div>

              {/* Content area */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {msg.from}
                  </span>
                  {msg.channel && (
                    <Badge size="sm" color="light">{msg.channel}</Badge>
                  )}
                  {msg.subject && (
                    <Badge size="sm" color="info">{msg.subject}</Badge>
                  )}
                </div>
                <p className={`text-sm text-gray-600 dark:text-gray-300 ${isExpanded ? '' : 'line-clamp-2'}`}>
                  {msg.content}
                </p>
                <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                  {formatTimestamp(msg.timestamp)}
                </p>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-12 dark:border-gray-700 dark:bg-gray-800/30">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('comm.noMessages')}</p>
          </div>
        )}
      </div>

      {/* Send modal */}
      <Modal isOpen={showSendModal} onClose={() => setShowSendModal(false)} className="max-w-lg p-6 lg:p-8">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-5">
          {t('comm.sendMessage')}
        </h3>

        {/* Channel select */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('comm.channel')}
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSendChannel('slack')}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                sendChannel === 'slack'
                  ? 'bg-brand-500 text-white'
                  : 'text-gray-500 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:text-gray-400 dark:ring-gray-700'
              }`}
            >
              Slack
            </button>
            <button
              onClick={() => setSendChannel('email')}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                sendChannel === 'email'
                  ? 'bg-brand-500 text-white'
                  : 'text-gray-500 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:text-gray-400 dark:ring-gray-700'
              }`}
            >
              Email
            </button>
          </div>
        </div>

        {/* Message */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('comm.message')}
          </label>
          <TextArea
            placeholder={t('comm.messagePlaceholder')}
            rows={4}
            value={sendContent}
            onChange={(val) => setSendContent(val)}
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button size="sm" variant="outline" onClick={() => setShowSendModal(false)}>
            {t('action.cancel')}
          </Button>
          <Button size="sm" onClick={handleSend} disabled={!sendContent.trim()}>
            {t('comm.send')}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CommunicationTab;

// ---- Inline SVG icon components ----

function MessageSquareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}
