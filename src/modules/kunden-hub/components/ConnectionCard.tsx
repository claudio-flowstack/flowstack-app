import { useLanguage } from '../i18n/LanguageContext';
import type { ClientConnection } from '../data/types';

interface ConnectionCardProps {
  connection: ClientConnection;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onEdit?: () => void;
}

function statusConfig(status: ClientConnection['status']) {
  switch (status) {
    case 'connected':
      return {
        dot: 'bg-emerald-500',
        border: 'border-emerald-200 dark:border-emerald-800/40',
        bg: 'bg-white dark:bg-white/[0.03]',
        label: 'Verbunden',
        labelColor: 'text-emerald-600 dark:text-emerald-400',
        labelBg: 'bg-emerald-50 dark:bg-emerald-500/10',
      };
    case 'error':
      return {
        dot: 'bg-red-500',
        border: 'border-red-200 dark:border-red-800/40',
        bg: 'bg-white dark:bg-white/[0.03]',
        label: 'Fehler',
        labelColor: 'text-red-600 dark:text-red-400',
        labelBg: 'bg-red-50 dark:bg-red-500/10',
      };
    case 'disconnected':
      return {
        dot: 'bg-gray-300',
        border: 'border-gray-200 dark:border-gray-800',
        bg: 'bg-gray-50/50 dark:bg-white/[0.02]',
        label: 'Nicht verbunden',
        labelColor: 'text-gray-500 dark:text-gray-400',
        labelBg: 'bg-gray-100 dark:bg-gray-800',
      };
    default:
      return {
        dot: 'bg-gray-200',
        border: 'border-gray-200 dark:border-gray-800',
        bg: 'bg-gray-50/50 dark:bg-white/[0.02]',
        label: 'Optional',
        labelColor: 'text-gray-400 dark:text-gray-500',
        labelBg: 'bg-gray-100 dark:bg-gray-800',
      };
  }
}

// Service icons as inline SVGs for a premium look
function ServiceIcon({ service }: { service: string }) {
  const cls = "h-8 w-8";
  switch (service) {
    case 'meta':
      return <svg className={cls} viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>;
    case 'google_drive':
      return <svg className={cls} viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>;
    case 'google_tag_manager':
      return <svg className={cls} viewBox="0 0 24 24"><path fill="#8AB4F8" d="M12.003 23.196l-7.39-7.39 7.39-7.393 7.39 7.393z" /><path fill="#4285F4" d="M19.393 15.806l-7.39-7.393L4.613 15.806l7.39 7.39z" /><path fill="#246FDB" d="M12.003 8.413l7.39 7.393-3.695 3.695-7.39-7.393z" /></svg>;
    case 'google_analytics':
      return <svg className={cls} viewBox="0 0 24 24"><path fill="#F9AB00" d="M19.5 21h-3a1.5 1.5 0 01-1.5-1.5v-15A1.5 1.5 0 0116.5 3h3A1.5 1.5 0 0121 4.5v15a1.5 1.5 0 01-1.5 1.5z" /><path fill="#E37400" d="M12 21H9a1.5 1.5 0 01-1.5-1.5v-9A1.5 1.5 0 019 9h3a1.5 1.5 0 011.5 1.5v9A1.5 1.5 0 0112 21z" /><circle fill="#E37400" cx="5.25" cy="18.75" r="2.25" /></svg>;
    case 'slack':
      return <svg className={cls} viewBox="0 0 24 24"><path fill="#E01E5A" d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313z" /><path fill="#36C5F0" d="M8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 012.521 2.521 2.527 2.527 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312z" /><path fill="#2EB67D" d="M18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zm-1.272 0a2.528 2.528 0 01-2.52 2.521 2.527 2.527 0 01-2.521-2.521V2.522A2.527 2.527 0 0115.164 0a2.528 2.528 0 012.52 2.522v6.312z" /><path fill="#ECB22E" d="M15.164 18.956a2.528 2.528 0 012.52 2.522A2.528 2.528 0 0115.164 24a2.527 2.527 0 01-2.521-2.522v-2.522h2.521zm0-1.272a2.527 2.527 0 01-2.521-2.52 2.528 2.528 0 012.521-2.521h6.314A2.528 2.528 0 0124 15.164a2.528 2.528 0 01-2.522 2.52h-6.314z" /></svg>;
    case 'close':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5"><path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
    case 'clickup':
      return <svg className={cls} viewBox="0 0 24 24"><path fill="#7B68EE" d="M3.79 13.267l2.983-2.322a4.862 4.862 0 003.228 1.663 4.862 4.862 0 003.228-1.663l2.983 2.322A8.38 8.38 0 0110 16.19a8.38 8.38 0 01-6.21-2.923z" /><path fill="#49CCF9" d="M10 5.81l-6.21 5.135L1.5 8.338 10 1.5l8.5 6.838-2.29 2.607z" /></svg>;
    case 'notion':
      return <svg className={cls} viewBox="0 0 24 24" fill="#000"><path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L18.57 2.16c-.42-.326-.98-.7-2.055-.607L3.48 2.66c-.466.046-.56.28-.374.466l1.353 1.082zm.793 3.313v13.876c0 .746.373 1.026 1.213.98l14.523-.84c.84-.046.933-.56.933-1.166V6.568c0-.607-.233-.933-.746-.886l-15.176.886c-.56.047-.747.327-.747.933zm14.336.42c.094.42 0 .84-.42.887l-.7.14v10.264c-.607.327-1.166.514-1.633.514-.746 0-.933-.233-1.493-.933l-4.572-7.19v6.957l1.447.327s0 .84-1.166.84l-3.22.186c-.093-.187 0-.654.327-.747l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.454-.233 4.759 7.283V9.388l-1.213-.14c-.094-.514.28-.886.746-.933l3.227-.187z" /></svg>;
    case 'miro':
      return <svg className={cls} viewBox="0 0 24 24" fill="#FFD02F"><path d="M17.392 2H13.9l2.533 4.222L13.9 10.667 11.078 2H7.586l2.533 4.222L7.586 10.667 4.764 2H2l5.307 10 5.307 10h1.422L8.73 12.444 11.553 8.222l5.306 10h1.422L13.426 8.222 16.248 4.222 21.553 14.222V2h-4.161z" /></svg>;
    default:
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.5"><path d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.914-1.025a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364l1.757 1.757" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }
}

const ConnectionCard: React.FC<ConnectionCardProps> = ({ connection, onConnect, onDisconnect, onEdit: _onEdit }) => {
  const { t } = useLanguage();
  const cfg = statusConfig(connection.status);

  return (
    <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-5 transition-shadow hover:shadow-md`}>
      {/* Header: Icon + Name + Status */}
      <div className="flex items-start gap-3.5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <ServiceIcon service={connection.service} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-white/90 truncate">
              {connection.label || ''}
            </p>
            <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.labelColor} ${cfg.labelBg}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>

          {/* Account info */}
          {connection.accountName && connection.status === 'connected' && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
              {connection.accountName}
            </p>
          )}
          {connection.accountId && connection.status === 'connected' && (
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 font-mono truncate">
              {connection.accountId}
            </p>
          )}
        </div>
      </div>

      {/* Error message */}
      {connection.error && connection.status === 'error' && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2">
          <svg className="h-4 w-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-xs text-red-600 dark:text-red-400">{connection.error}</p>
        </div>
      )}

      {/* Connected since */}
      {connection.connectedAt && connection.status === 'connected' && (
        <p className="mt-3 text-[11px] text-gray-400 dark:text-gray-500">
          {t('conn.connectedSince')} {new Date(connection.connectedAt).toLocaleDateString('de-DE')}
        </p>
      )}

      {/* Action buttons */}
      <div className="mt-4 flex gap-2">
        {connection.status === 'disconnected' && onConnect && (
          <button
            onClick={onConnect}
            className="flex-1 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
          >
            {t('action.connect')}
          </button>
        )}
        {connection.status === 'error' && onConnect && (
          <button
            onClick={onConnect}
            className="flex-1 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
          >
            {t('conn.reconnect')}
          </button>
        )}
        {connection.status === 'connected' && (
          <>
            {/* Connections are auto-configured from execution context — edit disabled */}
            {connection.externalUrl && (
              <button
                onClick={() => window.open(connection.externalUrl, '_blank')}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                title={t('action.open')}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                {t('action.open')}
              </button>
            )}
            {onDisconnect && (
              <button
                onClick={onDisconnect}
                className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50 dark:border-red-800 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20"
                title={t('action.disconnect')}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ConnectionCard;
