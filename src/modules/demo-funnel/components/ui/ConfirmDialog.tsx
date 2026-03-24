/**
 * Shared Confirm Dialog + useModalEsc hook
 * Used across all dashboards for consistent UX
 */
import { useEffect, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';

/* ───────── ESC-key hook for modals ───────── */
export function useModalEsc(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);
}

/* ───────── Confirm Dialog ───────── */
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open, title, message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm, onCancel,
}: ConfirmDialogProps) {
  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onCancel();
  }, [onCancel]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, handleEsc]);

  if (!open) return null;

  const colors = {
    danger:  { bg: 'bg-red-100 dark:bg-red-900/30',  icon: 'text-red-600 dark:text-red-400',  btn: 'bg-red-600 hover:bg-red-700 text-white' },
    warning: { bg: 'bg-amber-100 dark:bg-amber-900/30', icon: 'text-amber-600 dark:text-amber-400', btn: 'bg-amber-600 hover:bg-amber-700 text-white' },
    info:    { bg: 'bg-blue-100 dark:bg-blue-900/30', icon: 'text-blue-600 dark:text-blue-400', btn: 'bg-blue-600 hover:bg-blue-700 text-white' },
  }[variant];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      {/* dialog */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-150">
        <button onClick={onCancel} className="absolute top-3 right-3 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800">
          <X className="w-4 h-4 text-gray-400" />
        </button>
        <div className="flex gap-4">
          <div className={`shrink-0 w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center`}>
            <AlertTriangle className={`w-5 h-5 ${colors.icon}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-xl ${colors.btn} transition-colors`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
