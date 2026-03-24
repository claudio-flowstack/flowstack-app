import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import Button from '../ui/components/button/Button';
import TextArea from '../ui/form/input/TextArea';

interface Comment {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  createdAt: string;
}

interface CommentThreadProps {
  deliverableId: string;
}

function getMockComments(_deliverableId: string): Comment[] {
  return [
    {
      id: 'comment-1',
      author: 'Claudio',
      avatar: 'CD',
      content: 'Die Headline klingt gut, aber der CTA könnte stärker sein. Vielleicht "Jetzt durchstarten" statt "Jetzt bewerben"?',
      createdAt: '2026-03-16T10:30:00Z',
    },
    {
      id: 'comment-2',
      author: 'KI-Assistent',
      avatar: 'KI',
      content: 'Guter Punkt. Ich habe den CTA in v2 angepasst und zusätzlich die Benefits prominenter platziert.',
      createdAt: '2026-03-16T10:35:00Z',
    },
    {
      id: 'comment-3',
      author: 'Claudio',
      avatar: 'CD',
      content: 'Perfekt, die neue Version ist deutlich besser. Bitte noch die Arbeitszeiten-Info ergänzen.',
      createdAt: '2026-03-17T09:15:00Z',
    },
  ];
}

const CommentThread: React.FC<CommentThreadProps> = ({ deliverableId }) => {
  const { t } = useLanguage();
  const [comments, setComments] = useState<Comment[]>(() => getMockComments(deliverableId));
  const [newComment, setNewComment] = useState('');

  const formatDate = (iso: string): string => {
    return new Date(iso).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSend = () => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: `comment-${Date.now()}`,
      author: 'Claudio',
      avatar: 'CD',
      content: newComment.trim(),
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [...prev, comment]);
    setNewComment('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-4">
      {/* Comment list */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
              {comment.avatar || comment.author.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {comment.author}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {comment.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className="border-t border-gray-100 dark:border-gray-800 pt-3" onKeyDown={handleKeyDown}>
        <TextArea
          value={newComment}
          onChange={(val) => setNewComment(val)}
          placeholder={t('comment.placeholder')}
          rows={2}
        />
        <div className="mt-2 flex justify-end">
          <Button
            size="sm"
            variant="primary"
            onClick={handleSend}
            disabled={!newComment.trim()}
          >
            {t('comment.send')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CommentThread;
