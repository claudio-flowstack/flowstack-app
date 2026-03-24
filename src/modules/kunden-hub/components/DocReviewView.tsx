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
}

/* ---- Google Docs exact dimensions & colors ---- */
const PAPER_WIDTH = 816; // 8.5 inches at 96dpi
const PAPER_MIN_HEIGHT = 1056; // 11 inches at 96dpi
const PAPER_PADDING = '72px 96px'; // 0.75in top/bottom, 1in left/right

const COLORS = {
  toolbarBg: '#edf2fa',
  toolbarBorder: '#d4d7dc',
  menuText: '#202124',
  menuHover: '#e8eaed',
  iconColor: '#444746',
  iconColorMuted: '#5f6368',
  activeButton: '#c2dbff',
  activeButtonHover: '#b0cff5',
  buttonHover: '#dde1e5',
  divider: '#c7c7c7',
  canvasBg: '#f8f9fa',
  paperShadow: '0 0 0 1px rgba(0,0,0,0.03), 0 2px 6px rgba(60,64,67,0.15), 0 8px 24px rgba(60,64,67,0.08)',
  titleBarBorder: '#e8eaed',
  rulerBg: '#fff',
  rulerBorder: '#dadce0',
  rulerTick: '#b0b0b0',
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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 28,
      height: 28,
      borderRadius: 4,
      border: 'none',
      background: active ? COLORS.activeButton : 'transparent',
      cursor: 'pointer',
      color: COLORS.iconColor,
      flexShrink: 0,
      transition: 'background 0.1s',
    }}
    onMouseDown={(e) => { e.preventDefault(); onMouseDown?.(e); }}
    onMouseEnter={(e) => {
      if (!active) (e.currentTarget as HTMLButtonElement).style.background = COLORS.buttonHover;
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLButtonElement).style.background = active ? COLORS.activeButton : 'transparent';
    }}
  >
    {children}
  </button>
);

/* ---- Ruler component ---- */
const Ruler = () => {
  const marks = [];
  for (let i = 0; i <= 17; i++) {
    const isMajor = i % 2 === 0;
    marks.push(
      <div key={i} style={{
        position: 'absolute',
        left: `${(i / 17) * 100}%`,
        bottom: 0,
        width: 1,
        height: isMajor ? 8 : 4,
        backgroundColor: COLORS.rulerTick,
      }} />
    );
    if (isMajor && i > 0 && i < 17) {
      marks.push(
        <span key={`l${i}`} style={{
          position: 'absolute',
          left: `${(i / 17) * 100}%`,
          top: 1,
          transform: 'translateX(-50%)',
          fontSize: 8,
          color: COLORS.rulerTick,
          fontFamily: 'Arial',
          userSelect: 'none',
        }}>
          {Math.floor(i / 2)}
        </span>
      );
    }
  }
  return (
    <div style={{
      height: 18,
      background: COLORS.rulerBg,
      borderBottom: `1px solid ${COLORS.rulerBorder}`,
      display: 'flex',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ width: PAPER_WIDTH, position: 'relative', height: '100%' }}>
        {/* Left indent marker */}
        <div style={{
          position: 'absolute', left: 92, bottom: 0, width: 0, height: 0,
          borderLeft: '4px solid transparent', borderRight: '4px solid transparent',
          borderBottom: '5px solid #4285f4',
        }} />
        {/* Right indent marker */}
        <div style={{
          position: 'absolute', right: 92, bottom: 0, width: 0, height: 0,
          borderLeft: '4px solid transparent', borderRight: '4px solid transparent',
          borderBottom: '5px solid #4285f4',
        }} />
        {marks}
      </div>
    </div>
  );
};

/* ===================== COMPONENT ===================== */

const DocReviewView: React.FC<DocReviewViewProps> = ({
  deliverable,
  editableContent,
  onChange,
  onApprove,
  onRequestChanges,
  hasChanges = false,
}) => {
  const { t } = useLanguage();
  const paperWrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

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
    onUpdate: handleEditorUpdate,
  });

  const prevIdRef = useRef(deliverable.id);
  useEffect(() => {
    if (editor && deliverable.id !== prevIdRef.current) {
      prevIdRef.current = deliverable.id;
      editor.commands.setContent(editableContent || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliverable.id, editor]);

  useEffect(() => {
    const wrapper = paperWrapperRef.current;
    if (!wrapper) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const available = entry.contentRect.width;
        const needed = PAPER_WIDTH + 80;
        setScale(available < needed ? Math.max(0.45, available / needed) : 1);
      }
    });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

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

        {/* Document title + save status */}
        <div style={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 17, fontWeight: 400, color: COLORS.menuText, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '22px' }}>
            {deliverable.title || 'Untitled document'}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: hasChanges ? '#e37400' : '#188038', whiteSpace: 'nowrap', flexShrink: 0, transition: 'color 0.2s' }}>
            {hasChanges ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" strokeLinecap="round" /></svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            )}
            {hasChanges ? t('docReview.unsaved') : t('docReview.saved')}
          </span>
        </div>

        {/* Approval buttons - Freigeben links, Ablehnen rechts */}
        {onApprove && onRequestChanges && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button type="button" onClick={onApprove} style={{
              display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 20px',
              borderRadius: 20, border: 'none', background: '#1a73e8', cursor: 'pointer',
              fontFamily: FONT, fontSize: 13, color: '#fff', fontWeight: 500,
              transition: 'all 0.15s',
              boxShadow: '0 1px 3px rgba(26,115,232,0.3)',
            }}
            onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = '#1765cc'; b.style.boxShadow = '0 2px 6px rgba(26,115,232,0.4)'; }}
            onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = '#1a73e8'; b.style.boxShadow = '0 1px 3px rgba(26,115,232,0.3)'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              {t('approval.approve')}
            </button>
            <button type="button" onClick={() => onRequestChanges('')} style={{
              display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 16px',
              borderRadius: 20, border: '1px solid #d93025', background: '#fff', cursor: 'pointer',
              fontFamily: FONT, fontSize: 13, color: '#d93025', fontWeight: 500,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = '#fce8e6'; }}
            onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = '#fff'; }}
            >
              {t('action.reject')}
            </button>
          </div>
        )}
      </div>

      {/* ============ TOOLBAR ============ */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
        height: 38, padding: '0 14px', margin: '4px 8px 4px',
        background: COLORS.toolbarBg, borderRadius: 24,
        flexShrink: 0,
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
        <TBtn title="Durchgestrichen" active={editor?.isActive('strike') ?? false} onMouseDown={() => editor?.chain().focus().toggleStrike().run()}>
          <span style={{ textDecoration: 'line-through', fontSize: 14, color: COLORS.iconColorMuted }}>S</span>
        </TBtn>

        <Divider />

        <TBtn title="Linksbündig" active={editor?.isActive({ textAlign: 'left' }) ?? false} onMouseDown={() => editor?.chain().focus().setTextAlign('left').run()}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={COLORS.iconColor} strokeWidth="2"><path d="M4 6h16M4 12h10M4 18h14" strokeLinecap="round" /></svg>
        </TBtn>
        <TBtn title="Zentriert" active={editor?.isActive({ textAlign: 'center' }) ?? false} onMouseDown={() => editor?.chain().focus().setTextAlign('center').run()}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={COLORS.iconColor} strokeWidth="2"><path d="M4 6h16M7 12h10M5 18h14" strokeLinecap="round" /></svg>
        </TBtn>
        <TBtn title="Rechtsbündig" active={editor?.isActive({ textAlign: 'right' }) ?? false} onMouseDown={() => editor?.chain().focus().setTextAlign('right').run()}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={COLORS.iconColor} strokeWidth="2"><path d="M4 6h16M10 12h10M6 18h14" strokeLinecap="round" /></svg>
        </TBtn>

        <Divider />

        <TBtn title="Aufzählung" active={editor?.isActive('bulletList') ?? false} onMouseDown={() => editor?.chain().focus().toggleBulletList().run()}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={COLORS.iconColor} strokeWidth="1.5"><path d="M9 6h11M9 12h11M9 18h11" strokeLinecap="round" /><circle cx="4" cy="6" r="1.5" fill={COLORS.iconColor} stroke="none" /><circle cx="4" cy="12" r="1.5" fill={COLORS.iconColor} stroke="none" /><circle cx="4" cy="18" r="1.5" fill={COLORS.iconColor} stroke="none" /></svg>
        </TBtn>
        <TBtn title="Nummerierung" active={editor?.isActive('orderedList') ?? false} onMouseDown={() => editor?.chain().focus().toggleOrderedList().run()}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M9 6h11M9 12h11M9 18h11" stroke={COLORS.iconColor} strokeWidth="1.5" strokeLinecap="round" /><text x="2" y="8" fill={COLORS.iconColor} fontSize="7" fontFamily="Arial">1.</text><text x="2" y="14" fill={COLORS.iconColor} fontSize="7" fontFamily="Arial">2.</text><text x="2" y="20" fill={COLORS.iconColor} fontSize="7" fontFamily="Arial">3.</text></svg>
        </TBtn>

        <Divider />

        <TBtn title="Überschrift 1" active={editor?.isActive('heading', { level: 1 }) ?? false} onMouseDown={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}>
          <span style={{ fontWeight: 700, fontSize: 11 }}>H1</span>
        </TBtn>
        <TBtn title="Überschrift 2" active={editor?.isActive('heading', { level: 2 }) ?? false} onMouseDown={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>
          <span style={{ fontWeight: 700, fontSize: 11 }}>H2</span>
        </TBtn>
        <TBtn title="Überschrift 3" active={editor?.isActive('heading', { level: 3 }) ?? false} onMouseDown={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>
          <span style={{ fontWeight: 700, fontSize: 11 }}>H3</span>
        </TBtn>

        <Divider />

        <TBtn title="Zitat" active={editor?.isActive('blockquote') ?? false} onMouseDown={() => editor?.chain().focus().toggleBlockquote().run()}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={COLORS.iconColor} strokeWidth="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z" strokeLinecap="round" strokeLinejoin="round" /><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 .001 0 1.003 1 1.003z" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </TBtn>
        <TBtn title="Horizontale Linie" onMouseDown={() => editor?.chain().focus().setHorizontalRule().run()}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={COLORS.iconColor} strokeWidth="2"><path d="M3 12h18" strokeLinecap="round" /></svg>
        </TBtn>
      </div>

      {/* ============ RULER ============ */}
      <Ruler />

      {/* ============ PAPER AREA (Canvas) ============ */}
      <div
        ref={paperWrapperRef}
        style={{
          background: COLORS.canvasBg,
          flex: 1,
          overflowX: 'hidden',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '28px 48px 48px',
          minHeight: 500,
        }}
      >
        <div style={{
          transform: scale < 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'top center',
          width: scale < 1 ? PAPER_WIDTH : undefined,
          maxWidth: '100%',
        }}>
          <div
            className="tiptap-editor"
            style={{
              width: PAPER_WIDTH,
              maxWidth: '100%',
              minHeight: PAPER_MIN_HEIGHT,
              background: '#fff',
              boxShadow: COLORS.paperShadow,
              padding: PAPER_PADDING,
              boxSizing: 'border-box',
              margin: '0 auto',
              borderRadius: 0,
            }}
          >
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Page footer */}
        <div style={{ marginTop: 16, textAlign: 'center', fontSize: 11, color: '#80868b', fontFamily: FONT, letterSpacing: 0.2 }}>
          1 {t('docReview.pageOf')} 1
        </div>
      </div>

      {/* ============ TIPTAP / PROSEMIRROR STYLE OVERRIDES ============ */}
      <style>{`
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
        .tiptap-editor {
          overflow: hidden !important;
          max-width: 100% !important;
        }
        .tiptap-editor .ProseMirror p {
          margin: 0 0 0.15em;
          line-height: 1.15;
        }
        .tiptap-editor .ProseMirror h1 {
          font-size: 20pt;
          font-weight: normal;
          margin: 20pt 0 6pt;
          line-height: 1.15;
          color: #000;
        }
        .tiptap-editor .ProseMirror h2 {
          font-size: 16pt;
          font-weight: bold;
          margin: 18pt 0 6pt;
          line-height: 1.15;
          color: #000;
        }
        .tiptap-editor .ProseMirror h3 {
          font-size: 13.999pt;
          font-weight: bold;
          margin: 16pt 0 4pt;
          line-height: 1.15;
          color: #434343;
        }
        .tiptap-editor .ProseMirror ul,
        .tiptap-editor .ProseMirror ol {
          padding-left: 36pt;
          margin: 0;
        }
        .tiptap-editor .ProseMirror li {
          margin-bottom: 0;
        }
        .tiptap-editor .ProseMirror a {
          color: #1155cc;
          text-decoration: underline;
        }
        .tiptap-editor .ProseMirror blockquote {
          border-left: 3px solid #dadce0;
          margin: 10pt 0;
          padding: 0 0 0 16pt;
          color: #5f6368;
        }
        .tiptap-editor .ProseMirror hr {
          border: none;
          border-top: 1px solid #dadce0;
          margin: 16pt 0;
        }
        .tiptap-editor .ProseMirror .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #bdc1c6;
          pointer-events: none;
          float: left;
          height: 0;
          font-style: italic;
        }
        .tiptap-editor .ProseMirror:focus {
          outline: none;
        }
        .tiptap-editor .ProseMirror::selection,
        .tiptap-editor .ProseMirror *::selection {
          background: #c8daf8;
        }
      `}</style>
    </div>
  );
};

export default DocReviewView;
