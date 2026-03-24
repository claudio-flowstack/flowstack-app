import { useLanguage } from '../i18n/LanguageContext';
import type { Deliverable } from '../data/types';
import { DELIVERABLE_STATUS_CONFIG } from '../data/constants';
import StatusBadge from './StatusBadge';
import Button from '../ui/components/button/Button';

interface DeliverableRowProps {
  deliverable: Deliverable;
  onSelect: (id: string) => void;
}

function StatusIcon({ iconName, colorClass }: { iconName: string; colorClass: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    Loader2: (
      <svg className={`h-4 w-4 animate-spin ${colorClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 018-8" />
      </svg>
    ),
    FileEdit: (
      <svg className={`h-4 w-4 ${colorClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
    Eye: (
      <svg className={`h-4 w-4 ${colorClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    CheckCircle: (
      <svg className={`h-4 w-4 ${colorClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    Globe: (
      <svg className={`h-4 w-4 ${colorClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </svg>
    ),
    XCircle: (
      <svg className={`h-4 w-4 ${colorClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 9l-6 6M9 9l6 6" />
      </svg>
    ),
    Pencil: (
      <svg className={`h-4 w-4 ${colorClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      </svg>
    ),
    AlertTriangle: (
      <svg className={`h-4 w-4 ${colorClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />
      </svg>
    ),
    Lock: (
      <svg className={`h-4 w-4 ${colorClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    ),
  };

  return <>{iconMap[iconName] || null}</>;
}

const DeliverableRow: React.FC<DeliverableRowProps> = ({ deliverable, onSelect }) => {
  const { t } = useLanguage();
  const cfg = DELIVERABLE_STATUS_CONFIG[deliverable.status] || { icon: 'FileEdit', color: 'text-gray-400' };

  const canEdit = ['draft', 'rejected', 'manually_edited'].includes(deliverable.status);
  const canView = !['generating', 'blocked'].includes(deliverable.status);

  return (
    <div
      className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-white/[0.03] hover:border-brand-200 dark:hover:border-brand-800 transition cursor-pointer"
      onClick={() => onSelect(deliverable.id)}
    >
      <div className="flex items-center gap-3 min-w-0">
        <StatusIcon iconName={cfg.icon} colorClass={cfg.color} />
        <span className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">
          {deliverable.title}
        </span>
        <StatusBadge deliverableStatus={deliverable.status} />
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {canEdit && (
          <Button size="sm" variant="outline" onClick={(e) => { e?.stopPropagation?.(); onSelect(deliverable.id); }}>
            {t('action.edit')}
          </Button>
        )}
        {canView && !canEdit && (
          <Button size="sm" variant="outline" onClick={(e) => { e?.stopPropagation?.(); onSelect(deliverable.id); }}>
            {t('action.view')}
          </Button>
        )}
      </div>
    </div>
  );
};

export default DeliverableRow;
