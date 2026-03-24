import { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { useLanguage } from '../i18n/LanguageContext';
import type { Deliverable } from '../data/types';

interface DocReviewViewProps {
  deliverable: Deliverable;
  editableContent: string;
  onChange: (content: string) => void;
  onApprove?: () => void;
  onRequestChanges?: (comment: string) => void;
  hasChanges?: boolean;
  deliverables?: Deliverable[];
  onSelectDeliverable?: (id: string) => void;
}

/* ---- Styles ---- */
const PAPER_PADDING = '72px 96px';

const COLORS = {
  toolbarBg: '#edf2fa',
  iconColor: '#444746',
  iconColorMuted: '#5f6368',
  activeButton: '#c2dbff',
  buttonHover: '#dde1e5',
  divider: '#c7c7c7',
  canvasBg: '#f8f9fa',
  paperShadow: '0 0 0 1px rgba(0,0,0,0.03), 0 2px 6px rgba(60,64,67,0.15), 0 8px 24px rgba(60,64,67,0.08)',
  titleBarBorder: '#e8eaed',
  menuText: '#202124',
};

const FONT = "'Google Sans', 'Segoe UI', Roboto, Arial, sans-serif";

/* ---- Toolbar helpers ---- */
const Divider = () => (
  <div style={{ width: 1, height: 18, backgroundColor: COLORS.divider, margin: '0 6px', flexShrink: 0 }} />
);

const TBtn: React.FC<{
  children: React.ReactNode;
  title?: string;
  active?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
}> = ({ children, title, active, onMouseDown }) => (
  <button
    type="button"
    title={title}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: 28, height: 28, borderRadius: 4, border: 'none',
      background: active ? COLORS.activeButton : 'transparent',
      cursor: 'pointer', color: COLORS.iconColor, flexShrink: 0, transition: 'background 0.1s',
    }}
    onMouseDown={(e) => { e.preventDefault(); onMouseDown?.(e); }}
    onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = COLORS.buttonHover; }}
    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = active ? COLORS.activeButton : 'transparent'; }}
  >
    {children}
  </button>
);

/* ===================== COMPONENT ===================== */

const DocReviewView: React.FC<DocReviewViewProps> = ({
  deliverable,
  editableContent,
  onChange,
  onApprove,
  onRequestChanges,
  hasChanges = false,
  deliverables = [],
  onSelectDeliverable,
}) => {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const handleEditorUpdate = useCallback(({ editor: ed }: { editor: ReturnType<typeof useEditor> }) => {
    if (ed) onChangeRef.current(ed.getHTML());
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Dokument bearbeiten...' }),
    ],
    content: editableContent || '',
    editable: false, // Read-first: start non-editable
    onUpdate: handleEditorUpdate,
  });

  // Sync editable state with toggle
  useEffect(() => {
    if (editor) editor.setEditable(isEditing);
  }, [editor, isEditing]);

  // Reset edit mode when deliverable changes
  const prevIdRef = useRef(deliverable.id);
  useEffect(() => {
    if (editor && deliverable.id !== prevIdRef.current) {
      prevIdRef.current = deliverable.id;
      editor.commands.setContent(editableContent || '');
      setIsEditing(false);
      setShowRejectForm(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliverable.id, editor]);

  const handleToggleEdit = useCallback(() => {
    setIsEditing((prev) => !prev);
  }, []);

  const handleReject = useCallback(() => {
    if (rejectComment.length >= 10 && onRequestChanges) {
      onRequestChanges(rejectComment);
      setRejectComment('');
      setShowRejectForm(false);
    }
  }, [rejectComment, onRequestChanges]);

  return (
    <div style={{ fontFamily: FONT, display: 'flex', flexDirection: 'column', borderRadius: 12, overflow: 'hidden', border: `1px solid ${COLORS.titleBarBorder}`, background: '#fff', maxWidth: '100%', width: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>

      {/* ============ TITLE BAR ============ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 52, padding: '0 14px 0 12px', background: '#fff', borderBottom: `1px solid ${COLORS.titleBarBorder}` }}>
        {/* Google Docs icon */}
        <svg width="20" height="26" viewBox="0 0 24 34" fill="none" style={{ flexShrink: 0 }}>
          <path d="M14.5 0H3C1.34 0 0 1.34 0 3v28c0 1.66 1.34 3 3 3h18c1.66 0 3-1.34 3-3V9.5L14.5 0z" fill="#4285F4" />
          <path d="M14.5 0v6.5c0 1.66 1.34 3 3 3H24L14.5 0z" fill="#A1C2FA" />
          <path d="M6 16h12v1.5H6V16zm0 4h12v1.5H6V20zm0 4h8v1.5H6V24z" fill="#fff" />
        </svg>

        {/* Document title with inline switcher */}
        <div style={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', minWidth: 0 }}>
            <span style={{ fontSize: 15, fontWeight: 400, color: COLORS.menuText, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 300 }}>
              {deliverable.title || 'Untitled document'}
            </span>
            {deliverables.length > 1 && onSelectDeliverable && (
              <>
                <select
                  value={deliverable.id}
                  onChange={(e) => onSelectDeliverable(e.target.value)}
                  style={{
                    position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%',
                  }}
                  title="Dokument wechseln"
                />
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COLORS.iconColorMuted} strokeWidth="2" style={{ marginLeft: 4, flexShrink: 0 }}>
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </>
            )}
          </div>
          {hasChanges && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#e37400', whiteSpace: 'nowrap', flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" strokeLinecap="round" /></svg>
              {t('docReview.unsaved')}
            </span>
          )}
        </div>

        {/* Edit toggle button */}
        <button
          type="button"
          onClick={handleToggleEdit}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 16px',
            borderRadius: 20, border: `1px solid ${isEditing ? '#1a73e8' : '#dadce0'}`,
            background: isEditing ? '#e8f0fe' : '#fff', cursor: 'pointer',
            fontFamily: FONT, fontSize: 13, color: isEditing ? '#1a73e8' : '#5f6368', fontWeight: 500,
            transition: 'all 0.15s', flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {isEditing ? 'Bearbeitung beenden' : 'Bearbeiten'}
        </button>
      </div>

      {/* ============ TOOLBAR (only visible when editing) ============ */}
      {isEditing && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
          height: 38, padding: '0 14px', margin: '4px 8px 4px',
          background: COLORS.toolbarBg, borderRadius: 24, flexShrink: 0,
          animation: 'fadeIn 0.15s ease-out',
        }}>
          <TBtn title="Undo (Ctrl+Z)" onMouseDown={() => editor?.chain().focus().undo().run()}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={COLORS.iconColor} strokeWidth="2"><path d="M3 10h10a5 5 0 015 5v0a5 5 0 01-5 5H8" strokeLinecap="round" strokeLinejoin="round" /><path d="M7 14L3 10l4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </TBtn>
          <TBtn title="Redo (Ctrl+Y)" onMouseDown={() => editor?.chain().focus().redo().run()}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={COLORS.iconColor} strokeWidth="2"><path d="M21 10H11a5 5 0 00-5 5v0a5 5 0 005 5h5" strokeLinecap="round" strokeLinejoin="round" /><path d="M17 14l4-4-4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </TBtn>
          <Divider />
          <TBtn title="Fett (Ctrl+B)" active={editor?.isActive('bold') ?? false} onMouseDown={() => editor?.chain().focus().toggleBold().run()}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>B</span>
          </TBtn>
          <TBtn title="Kursiv (Ctrl+I)" active={editor?.isActive('italic') ?? false} onMouseDown={() => editor?.chain().focus().toggleItalic().run()}>
            <span style={{ fontStyle: 'italic', fontWeight: 500, fontSize: 14 }}>I</span>
          </TBtn>
          <TBtn title="Unterstrichen (Ctrl+U)" active={editor?.isActive('underline') ?? false} onMouseDown={() => editor?.chain().focus().toggleUnderline().run()}>
            <span style={{ textDecoration: 'underline', fontSize: 14 }}>U</span>
          </TBtn>
          <Divider />
          <TBtn title="Aufzählung" active={editor?.isActive('bulletList') ?? false} onMouseDown={() => editor?.chain().focus().toggleBulletList().run()}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={COLORS.iconColor} strokeWidth="1.5"><path d="M9 6h11M9 12h11M9 18h11" strokeLinecap="round" /><circle cx="4" cy="6" r="1.5" fill={COLORS.iconColor} stroke="none" /><circle cx="4" cy="12" r="1.5" fill={COLORS.iconColor} stroke="none" /><circle cx="4" cy="18" r="1.5" fill={COLORS.iconColor} stroke="none" /></svg>
          </TBtn>
          <TBtn title="Nummerierung" active={editor?.isActive('orderedList') ?? false} onMouseDown={() => editor?.chain().focus().toggleOrderedList().run()}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M9 6h11M9 12h11M9 18h11" stroke={COLORS.iconColor} strokeWidth="1.5" strokeLinecap="round" /><text x="2" y="8" fill={COLORS.iconColor} fontSize="7" fontFamily="Arial">1.</text><text x="2" y="14" fill={COLORS.iconColor} fontSize="7" fontFamily="Arial">2.</text><text x="2" y="20" fill={COLORS.iconColor} fontSize="7" fontFamily="Arial">3.</text></svg>
          </TBtn>
          <Divider />
          <TBtn title="H1" active={editor?.isActive('heading', { level: 1 }) ?? false} onMouseDown={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}>
            <span style={{ fontWeight: 700, fontSize: 11 }}>H1</span>
          </TBtn>
          <TBtn title="H2" active={editor?.isActive('heading', { level: 2 }) ?? false} onMouseDown={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>
            <span style={{ fontWeight: 700, fontSize: 11 }}>H2</span>
          </TBtn>
          <TBtn title="H3" active={editor?.isActive('heading', { level: 3 }) ?? false} onMouseDown={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>
            <span style={{ fontWeight: 700, fontSize: 11 }}>H3</span>
          </TBtn>
        </div>
      )}

      {/* ============ PAPER AREA (Canvas) — Google Docs proportions ============ */}
      <div style={{
        background: '#f8f9fa', flex: 1,
        overflowX: 'auto', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '24px 40px 40px', minHeight: 500,
      }}>
        <div
          className="tiptap-editor"
          style={{
            width: 816,
            minHeight: 1056,
            background: '#fff',
            boxShadow: '0 0 0 0.75pt #d1d1d1, 0 2px 6px rgba(60,64,67,0.15)',
            padding: PAPER_PADDING,
            boxSizing: 'border-box',
            flexShrink: 0,
          }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* ============ STICKY APPROVAL BAR ============ */}
      {onApprove && onRequestChanges && (
        <div style={{
          position: 'sticky', bottom: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', gap: 12,
          background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)',
          borderTop: `1px solid ${COLORS.titleBarBorder}`,
        }}>
          {/* Left: status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#5f6368' }}>
            {hasChanges && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#e37400', fontWeight: 500 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" strokeLinecap="round" /></svg>
                Ungespeicherte Änderungen
              </span>
            )}
          </div>

          {/* Right: actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* Reject flow */}
            {showRejectForm ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="text"
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  placeholder="Feedback (mind. 10 Zeichen)..."
                  style={{
                    width: 280, height: 34, padding: '0 12px', borderRadius: 20,
                    border: '1px solid #dadce0', fontSize: 13, fontFamily: FONT,
                    outline: 'none',
                  }}
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = '#1a73e8'; }}
                  onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = '#dadce0'; }}
                  autoFocus
                />
                <button type="button" onClick={handleReject} disabled={rejectComment.length < 10} style={{
                  height: 34, padding: '0 16px', borderRadius: 20,
                  border: '1px solid #d93025', background: rejectComment.length >= 10 ? '#d93025' : '#fff',
                  color: rejectComment.length >= 10 ? '#fff' : '#d93025',
                  cursor: rejectComment.length >= 10 ? 'pointer' : 'not-allowed',
                  fontFamily: FONT, fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
                }}>
                  Ablehnen
                </button>
                <button type="button" onClick={() => { setShowRejectForm(false); setRejectComment(''); }} style={{
                  height: 34, padding: '0 12px', borderRadius: 20,
                  border: '1px solid #dadce0', background: '#fff',
                  cursor: 'pointer', fontFamily: FONT, fontSize: 13, color: '#5f6368',
                }}>
                  ✕
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setShowRejectForm(true)} style={{
                display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 16px',
                borderRadius: 20, border: '1px solid #d93025', background: '#fff',
                cursor: 'pointer', fontFamily: FONT, fontSize: 13, color: '#d93025', fontWeight: 500,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fce8e6'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fff'; }}
              >
                {t('action.reject')}
              </button>
            )}

            {/* Approve */}
            <button type="button" onClick={onApprove} style={{
              display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 20px',
              borderRadius: 20, border: 'none', background: '#188038', cursor: 'pointer',
              fontFamily: FONT, fontSize: 13, color: '#fff', fontWeight: 500,
              transition: 'all 0.15s', boxShadow: '0 1px 3px rgba(24,128,56,0.3)',
            }}
            onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = '#137333'; }}
            onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = '#188038'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              {t('approval.approve')}
            </button>
          </div>
        </div>
      )}

      {/* ============ TIPTAP / PROSEMIRROR STYLE OVERRIDES ============ */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .tiptap-editor .ProseMirror {
          outline: none;
          min-height: 600px;
          font-family: Arial, sans-serif;
          font-size: 11pt;
          line-height: 1.15;
          color: #000;
          overflow-wrap: break-word;
          word-break: break-word;
          max-width: 100%;
          overflow-x: hidden;
          caret-color: #000;
        }
        .tiptap-editor { overflow: hidden !important; max-width: 100% !important; }
        .tiptap-editor .ProseMirror p { margin: 0 0 0.15em; line-height: 1.15; }
        .tiptap-editor .ProseMirror h1 { font-size: 20pt; font-weight: normal; margin: 20pt 0 6pt; line-height: 1.15; color: #000; }
        .tiptap-editor .ProseMirror h2 { font-size: 16pt; font-weight: bold; margin: 18pt 0 6pt; line-height: 1.15; color: #000; }
        .tiptap-editor .ProseMirror h3 { font-size: 13.999pt; font-weight: bold; margin: 16pt 0 4pt; line-height: 1.15; color: #434343; }
        .tiptap-editor .ProseMirror ul, .tiptap-editor .ProseMirror ol { padding-left: 36pt; margin: 0; }
        .tiptap-editor .ProseMirror li { margin-bottom: 0; }
        .tiptap-editor .ProseMirror a { color: #1155cc; text-decoration: underline; }
        .tiptap-editor .ProseMirror blockquote { border-left: 3px solid #dadce0; margin: 10pt 0; padding: 0 0 0 16pt; color: #5f6368; }
        .tiptap-editor .ProseMirror hr { border: none; border-top: 1px solid #dadce0; margin: 16pt 0; }
        .tiptap-editor .ProseMirror .is-editor-empty:first-child::before { content: attr(data-placeholder); color: #bdc1c6; pointer-events: none; float: left; height: 0; font-style: italic; }
        .tiptap-editor .ProseMirror:focus { outline: none; }
        .tiptap-editor .ProseMirror::selection, .tiptap-editor .ProseMirror *::selection { background: #c8daf8; }
      `}</style>
    </div>
  );
};

export default DocReviewView;
