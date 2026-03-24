import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import PageMeta from '../ui/common/PageMeta';
import PageBreadcrumb from '../ui/common/PageBreadCrumb';

interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  content: string;
  createdAt: string;
}

function getAiResponse(message: string, t: (key: string) => string): string {
  const lower = message.toLowerCase();

  // Specific client queries
  if (lower.includes('müller') || lower.includes('mueller') || lower.includes('pflege')) {
    return t('ai.responseMueller');
  }
  if (lower.includes('weber')) {
    return t('ai.responseWeber');
  }
  if (lower.includes('schmidt')) {
    return t('ai.responseSchmidt');
  }

  // Topic-based queries
  if (lower.includes('funnel') || lower.includes('conversion') || lower.includes('bewerbung') || lower.includes('einstellung')) {
    return t('ai.responseFunnel');
  }
  if (lower.includes('kosten') || lower.includes('spend') || lower.includes('ausgaben') || lower.includes('cost')) {
    return t('ai.responseKosten');
  }
  if (lower.includes('budget') || lower.includes('verteilung') || lower.includes('allocation')) {
    return t('ai.responseBudget');
  }
  if (lower.includes('kampagne') || lower.includes('campaign') || lower.includes('anzeige') || lower.includes('ad')) {
    return t('ai.responseKampagne');
  }
  if (lower.includes('roi') || lower.includes('rendite') || lower.includes('wert') || lower.includes('value')) {
    return t('ai.responseRoi');
  }
  if (lower.includes('plattform') || lower.includes('platform') || lower.includes('meta') || lower.includes('google') || lower.includes('vergleich')) {
    return t('ai.responsePlattform');
  }
  if (lower.includes('status') || lower.includes('überblick') || lower.includes('übersicht') || lower.includes('overview') || lower.includes('wie läuft') || lower.includes('wie lauft')) {
    return t('ai.responseStatus');
  }
  if (lower.includes('leads') || lower.includes('performance') || lower.includes('ergebnis')) {
    return t('ai.responseLeads');
  }
  if (lower.includes('freigabe') || lower.includes('offen') || lower.includes('approval') || lower.includes('open') || lower.includes('prüfung') || lower.includes('pending')) {
    return t('ai.responseApprovals');
  }
  if (lower.includes('cpl') || lower.includes('cpa') || lower.includes('cpc')) {
    return t('ai.responseKosten');
  }

  return t('ai.responseDefault');
}

const AiAssistant: React.FC = () => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'ai',
      content: '',
      createdAt: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === 'welcome' ? { ...m, content: t('ai.welcome') } : m
      )
    );
  }, [t]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: getAiResponse(trimmed, t),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <PageMeta title={`${t('ai.title')} | Kunden Hub`} description="" />
      <PageBreadcrumb pageTitle={t('ai.title')} />

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] flex flex-col" style={{ height: 'calc(100vh - 200px)', minHeight: '400px' }}>
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 px-5 py-4">
          <svg className="h-5 w-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
          <span className="text-base font-semibold text-gray-800 dark:text-white/90">
            {t('ai.title')}
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="rounded-xl bg-gray-100 px-4 py-2.5 dark:bg-gray-800">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-5 py-4">
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('ai.placeholder')}
              rows={1}
              className="flex-1 resize-none rounded-xl border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-900 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AiAssistant;
