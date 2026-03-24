import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import Button from '../ui/components/button/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../ui/components/table';

interface FilesTabProps {
  clientId: string;
}

interface DriveFile {
  id: string;
  name: string;
  type: 'folder' | 'document' | 'spreadsheet' | 'pdf' | 'image' | 'video';
  size?: string;
  modifiedAt: string;
  modifiedBy: string;
  url?: string;
  children?: DriveFile[];
}

const mockFiles: DriveFile[] = [
  { id: 'f1', name: '01_Verwaltung', type: 'folder', modifiedAt: '2026-03-15', modifiedBy: 'System', children: [] },
  { id: 'f2', name: '02_Strategie', type: 'folder', modifiedAt: '2026-03-18', modifiedBy: 'System', children: [
    { id: 'f2a', name: 'Zielgruppen-Avatar.docx', type: 'document', size: '245 KB', modifiedAt: '2026-03-18', modifiedBy: 'KI' },
    { id: 'f2b', name: 'Arbeitgeber-Avatar.docx', type: 'document', size: '198 KB', modifiedAt: '2026-03-18', modifiedBy: 'KI' },
    { id: 'f2c', name: 'Messaging-Matrix.docx', type: 'document', size: '312 KB', modifiedAt: '2026-03-18', modifiedBy: 'KI' },
  ]},
  { id: 'f3', name: '03_Texte', type: 'folder', modifiedAt: '2026-03-19', modifiedBy: 'System', children: [
    { id: 'f3a', name: 'Landingpage-Texte.docx', type: 'document', size: '156 KB', modifiedAt: '2026-03-19', modifiedBy: 'KI' },
    { id: 'f3b', name: 'Anzeigentexte.docx', type: 'document', size: '89 KB', modifiedAt: '2026-03-19', modifiedBy: 'KI' },
  ]},
  { id: 'f4', name: '04_Creatives', type: 'folder', modifiedAt: '2026-03-17', modifiedBy: 'System', children: [
    { id: 'f4a', name: 'hero-image.png', type: 'image', size: '2.4 MB', modifiedAt: '2026-03-17', modifiedBy: 'Claudio' },
    { id: 'f4b', name: 'team-photo.jpg', type: 'image', size: '1.8 MB', modifiedAt: '2026-03-17', modifiedBy: 'Claudio' },
  ]},
  { id: 'f5', name: '05_Kampagnen', type: 'folder', modifiedAt: '2026-03-15', modifiedBy: 'System', children: [] },
  { id: 'f6', name: 'Tracking Dashboard.xlsx', type: 'spreadsheet', size: '78 KB', modifiedAt: '2026-03-19', modifiedBy: 'System' },
  { id: 'f7', name: 'Onboarding Brief.docx', type: 'document', size: '45 KB', modifiedAt: '2026-03-15', modifiedBy: 'Claudio' },
];

const FilesTab: React.FC<FilesTabProps> = ({ clientId: _clientId }) => {
  const { t } = useLanguage();
  const [path, setPath] = useState<{ name: string; files: DriveFile[] }[]>([
    { name: 'Root', files: mockFiles },
  ]);
  const [showUpload, setShowUpload] = useState(false);

  const currentLevel = path[path.length - 1]!;

  const navigateInto = (folder: DriveFile) => {
    if (folder.type === 'folder' && folder.children) {
      setPath((prev) => [...prev, { name: folder.name, files: folder.children! }]);
    }
  };

  const navigateTo = (index: number) => {
    setPath((prev) => prev.slice(0, index + 1));
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb + Upload */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex items-center gap-1 text-sm">
          {path.map((level, i) => (
            <span key={i} className="flex items-center">
              {i > 0 && (
                <svg className="h-4 w-4 text-gray-400 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
              <button
                onClick={() => navigateTo(i)}
                className={`hover:text-brand-500 transition ${
                  i === path.length - 1
                    ? 'font-medium text-gray-800 dark:text-white/90'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {i === 0 ? t('files.root') : level.name}
              </button>
            </span>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {path.length > 1 && (
            <Button size="sm" variant="outline" onClick={() => navigateTo(path.length - 2)}>
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                {t('client.back')}
              </span>
            </Button>
          )}
          <Button size="sm" onClick={() => setShowUpload(!showUpload)}>
            {t('files.upload')}
          </Button>
        </div>
      </div>

      {/* Upload area (mock) */}
      {showUpload && (
        <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-800/30">
          <UploadIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('files.uploadArea')}</p>
        </div>
      )}

      {/* File table */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden dark:border-gray-800 dark:bg-white/[0.03]">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-gray-800">
            <TableRow>
              <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                {t('files.name')}
              </TableCell>
              <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                {t('files.size')}
              </TableCell>
              <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">
                {t('files.modified')}
              </TableCell>
              <TableCell isHeader className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                {t('files.action')}
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentLevel.files.map((file) => (
              <TableRow
                key={file.id}
                className="border-b border-gray-50 last:border-0 hover:bg-gray-50 dark:border-gray-800/50 dark:hover:bg-white/[0.02] transition"
              >
                <TableCell className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <FileTypeIcon type={file.type} />
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {file.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                  {file.size || '\u2014'}
                </TableCell>
                <TableCell className="px-4 py-3 hidden md:table-cell">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(file.modifiedAt)}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{file.modifiedBy}</p>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-right">
                  {file.type === 'folder' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigateInto(file)}
                    >
                      {t('action.open')}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(file.url || '#', '_blank')}
                    >
                      {t('action.open')}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {currentLevel.files.length === 0 && (
              <TableRow>
                <TableCell className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400 colspan-4">
                  {t('files.empty')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default FilesTab;

// ---- File type icon component ----

function FileTypeIcon({ type }: { type: DriveFile['type'] }) {
  const base = 'h-5 w-5 shrink-0';
  if (type === 'folder') {
    return (
      <svg className={`${base} text-yellow-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    );
  }
  if (type === 'document') {
    return (
      <svg className={`${base} text-blue-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }
  if (type === 'spreadsheet') {
    return (
      <svg className={`${base} text-green-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M10 3v18M14 3v18M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
      </svg>
    );
  }
  if (type === 'image') {
    return (
      <svg className={`${base} text-purple-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
      </svg>
    );
  }
  if (type === 'video') {
    return (
      <svg className={`${base} text-red-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    );
  }
  // pdf or generic
  return (
    <svg className={`${base} text-red-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}
