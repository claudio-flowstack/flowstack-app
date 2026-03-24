import { useState } from "react";
import Button from "../ui/components/button/Button";
import TextArea from "../ui/form/input/TextArea";
import { useLanguage } from "../i18n/LanguageContext";

interface Note {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  pinned: boolean;
}

const INITIAL_NOTES: Note[] = [
  {
    id: "n1",
    content: "Kunde möchte keine blauen Farben im Branding. Bevorzugt warme Töne.",
    author: "Claudio",
    createdAt: "2026-03-15T10:00:00Z",
    pinned: true,
  },
  {
    id: "n2",
    content: "Kickoff Call: Hauptproblem ist Fachkräftemangel in der Pflege. USP: Familiäres Arbeitsumfeld, übertarifliche Bezahlung.",
    author: "Claudio",
    createdAt: "2026-03-16T14:00:00Z",
    pinned: false,
  },
  {
    id: "n3",
    content: "CEO bevorzugt kurze, direkte Kommunikation. Keine langen Reports.",
    author: "Anak",
    createdAt: "2026-03-17T09:00:00Z",
    pinned: true,
  },
];

interface NotesTabProps {
  clientId: string;
}

export default function NotesTab({ clientId: _clientId }: NotesTabProps) {
  const { t } = useLanguage();
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [newContent, setNewContent] = useState("");

  const pinnedNotes = notes.filter((n) => n.pinned);
  const regularNotes = notes.filter((n) => !n.pinned);

  const handleSave = () => {
    if (!newContent.trim()) return;
    const newNote: Note = {
      id: `n-${Date.now()}`,
      content: newContent.trim(),
      author: "Claudio",
      createdAt: new Date().toISOString(),
      pinned: false,
    };
    setNotes((prev) => [newNote, ...prev]);
    setNewContent("");
  };

  const handleDelete = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleTogglePin = (id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n))
    );
  };

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }) +
      ", " +
      date.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
      });
  };

  const NoteCard = ({ note }: { note: Note }) => (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-sm text-gray-800 dark:text-white/90 whitespace-pre-wrap">
        {note.content}
      </p>
      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-300">
              {note.author.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {note.author}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {formatDate(note.createdAt)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleTogglePin(note.id)}
            className="rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition"
          >
            {note.pinned ? t("notes.unpin") : t("notes.pin")}
          </button>
          <button
            onClick={() => handleDelete(note.id)}
            className="rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-error-50 hover:text-error-600 dark:text-gray-400 dark:hover:bg-error-500/10 dark:hover:text-error-400 transition"
          >
            {t("notes.delete")}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Add note area */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <TextArea
          value={newContent}
          onChange={(val) => setNewContent(val)}
          rows={3}
          placeholder={t("notes.newNote")}
        />
        <div className="mt-3 flex justify-end">
          <Button
            variant="primary"
            size="sm"
            disabled={!newContent.trim()}
            onClick={handleSave}
          >
            {t("notes.save")}
          </Button>
        </div>
      </div>

      {/* Pinned notes */}
      {pinnedNotes.length > 0 && (
        <div className="mb-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-base">&#128204;</span>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              {t("notes.pinned")}
            </h4>
          </div>
          <div className="space-y-3">
            {pinnedNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      {pinnedNotes.length > 0 && regularNotes.length > 0 && (
        <hr className="my-4 border-gray-200 dark:border-gray-800" />
      )}

      {/* Regular notes */}
      {regularNotes.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
            {t("notes.allNotes")}
          </h4>
          <div className="space-y-3">
            {regularNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {notes.length === 0 && (
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-16 dark:border-gray-700 dark:bg-gray-800/30">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {t("notes.noNotes")}
          </p>
        </div>
      )}
    </div>
  );
}
