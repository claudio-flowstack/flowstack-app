import { useNotification } from '../contexts/NotificationContext';
import type { Notification } from '../contexts/NotificationContext';

function toastStyles(type: Notification['type']): string {
  switch (type) {
    case 'success':
      return 'border-l-4 border-l-success-500';
    case 'error':
      return 'border-l-4 border-l-error-500';
    case 'warning':
      return 'border-l-4 border-l-warning-500';
    case 'info':
    default:
      return 'border-l-4 border-l-brand-500';
  }
}

function toastIcon(type: Notification['type']): string {
  switch (type) {
    case 'success':
      return '\u2705';
    case 'error':
      return '\uD83D\uDD34';
    case 'warning':
      return '\uD83D\uDFE1';
    case 'info':
    default:
      return '\uD83D\uDD35';
  }
}

export default function NotificationToast() {
  const { notifications, dismiss } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 z-[60] flex flex-col gap-2 w-80">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-900 animate-[slideInRight_0.3s_ease-out] ${toastStyles(n.type)}`}
        >
          <div className="flex items-start gap-2">
            <span className="text-sm mt-0.5">{toastIcon(n.type)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {n.title}
              </p>
              {n.message && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {n.message}
                </p>
              )}
            </div>
            <button
              onClick={() => dismiss(n.id)}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
