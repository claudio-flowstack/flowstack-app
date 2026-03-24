import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import Badge from '../ui/components/badge/Badge';
import Button from '../ui/components/button/Button';

interface Version {
  version: number;
  content: string;
  createdAt: string;
  createdBy: string; // 'ai' | 'Claudio' | 'System'
  changeType: 'generated' | 'manual_edit' | 'regenerated';
}

interface VersionHistoryProps {
  deliverableId: string;
  currentContent?: string;
  onRestore?: (content: string, version: number) => void;
}

function getMockVersions(_deliverableId: string): Version[] {
  return [
    {
      version: 3,
      content:
        'Aktuelle Version: Pflegekräfte gesucht - Ihre Karriere bei uns.\n\nWir bieten Ihnen ein starkes Team, faire Bezahlung und echte Wertschätzung.\n\nJetzt bewerben und Teil unserer Pflege-Familie werden.\n\nFlexible Arbeitszeiten, die zu Ihrem Leben passen.',
      createdAt: '2026-03-18T14:30:00Z',
      createdBy: 'Claudio',
      changeType: 'manual_edit',
    },
    {
      version: 2,
      content:
        'Zweite Version: Pflegekräfte gesucht - Starten Sie jetzt.\n\nWir bieten Ihnen ein starkes Team und faire Bezahlung.\n\nJetzt bewerben und Teil unserer Familie werden.',
      createdAt: '2026-03-17T10:15:00Z',
      createdBy: 'ai',
      changeType: 'regenerated',
    },
    {
      version: 1,
      content:
        'Erste Version: Pflegekräfte für unser Team gesucht.\n\nWir suchen engagierte Fachkräfte für unsere Einrichtung.\n\nBewerben Sie sich jetzt.',
      createdAt: '2026-03-16T09:00:00Z',
      createdBy: 'ai',
      changeType: 'generated',
    },
  ];
}

function computeDiff(oldText: string, newText: string): { type: 'added' | 'removed' | 'unchanged'; text: string }[] {
  const oldParagraphs = oldText.split('\n');
  const newParagraphs = newText.split('\n');
  const result: { type: 'added' | 'removed' | 'unchanged'; text: string }[] = [];

  const maxLen = Math.max(oldParagraphs.length, newParagraphs.length);
  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldParagraphs[i];
    const newLine = newParagraphs[i];

    if (oldLine === undefined && newLine !== undefined) {
      result.push({ type: 'added', text: newLine });
    } else if (newLine === undefined && oldLine !== undefined) {
      result.push({ type: 'removed', text: oldLine });
    } else if (oldLine === newLine) {
      result.push({ type: 'unchanged', text: newLine ?? '' });
    } else {
      result.push({ type: 'removed', text: oldLine ?? '' });
      result.push({ type: 'added', text: newLine ?? '' });
    }
  }

  return result;
}

type BadgeColor = 'primary' | 'success' | 'warning' | 'info';

const VersionHistory: React.FC<VersionHistoryProps> = ({ deliverableId, onRestore }) => {
  const { t } = useLanguage();
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);
  const [diffVersion, setDiffVersion] = useState<number | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<number | null>(null);

  const versions = getMockVersions(deliverableId);

  const changeTypeBadge = (changeType: Version['changeType']): { label: string; color: BadgeColor } => {
    switch (changeType) {
      case 'generated':
        return { label: t('version.generated'), color: 'primary' };
      case 'manual_edit':
        return { label: t('version.manualEdit'), color: 'warning' };
      case 'regenerated':
        return { label: t('version.regenerated'), color: 'info' };
    }
  };

  const creatorLabel = (createdBy: string): string => {
    if (createdBy === 'ai') return t('version.createdByAi');
    if (createdBy === 'System') return t('version.createdBySystem');
    return createdBy;
  };

  const formatDate = (iso: string): string => {
    return new Date(iso).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRestore = (version: Version) => {
    if (onRestore) {
      onRestore(version.content, version.version);
    }
    setConfirmRestore(null);
  };

  const getDiffForVersion = (versionNum: number) => {
    const idx = versions.findIndex((v) => v.version === versionNum);
    if (idx < 0 || idx >= versions.length - 1) return null;
    const newer = versions[idx]!;
    const older = versions[idx + 1]!;
    return computeDiff(older.content, newer.content);
  };

  return (
    <div className="space-y-3">
      {versions.map((v) => {
        const badge = changeTypeBadge(v.changeType);
        const isExpanded = expandedVersion === v.version;
        const isDiffOpen = diffVersion === v.version;
        const diff = isDiffOpen ? getDiffForVersion(v.version) : null;

        return (
          <div
            key={v.version}
            className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                v{v.version}
              </span>

              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {creatorLabel(v.createdBy)}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {formatDate(v.createdAt)}
                </span>
              </div>

              <Badge variant="light" size="sm" color={badge.color}>
                {badge.label}
              </Badge>

              <div className="ml-auto flex items-center gap-2">
                {v.version > 1 && (
                  <button
                    onClick={() => setDiffVersion(isDiffOpen ? null : v.version)}
                    className="text-xs text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 transition"
                  >
                    {isDiffOpen ? t('version.hideDiff') : t('version.showDiff')}
                  </button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setExpandedVersion(isExpanded ? null : v.version)}
                >
                  {isExpanded ? t('version.hide') : t('version.show')}
                </Button>
                {versions.length > 0 && v.version < versions[0]!.version && (
                  <>
                    {confirmRestore === v.version ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleRestore(v)}
                        >
                          {t('version.confirmRestore')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmRestore(null)}
                        >
                          {t('action.cancel')}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmRestore(v.version)}
                      >
                        {t('version.restore')}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Diff view */}
            {isDiffOpen && diff && (
              <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3 bg-gray-50 dark:bg-gray-900/50">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  {t('version.diffTitle')}
                </p>
                <div className="space-y-1 font-mono text-xs">
                  {diff.map((line, i) => (
                    <div
                      key={i}
                      className={`rounded px-2 py-0.5 ${
                        line.type === 'added'
                          ? 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400'
                          : line.type === 'removed'
                          ? 'bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400 line-through'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {line.type === 'added' && '+ '}
                      {line.type === 'removed' && '- '}
                      {line.text || '\u00A0'}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expanded content */}
            {isExpanded && (
              <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans">
                  {v.content}
                </pre>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default VersionHistory;
