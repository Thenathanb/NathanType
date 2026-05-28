import { useState, useRef, useEffect } from 'react';

interface CustomTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
}

export function CustomTextModal({ isOpen, onClose, onSubmit }: CustomTextModalProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) textareaRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (trimmed.length < 2) return;
    onSubmit(trimmed);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-bg-primary border border-text-secondary border-opacity-20 rounded-xl p-6 w-full max-w-xl shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-accent">Custom Text</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste or type your custom text here…"
          className="w-full h-40 bg-bg-secondary text-text-primary rounded-lg p-3 text-sm font-mono resize-none focus:outline-none focus:ring-2 ring-accent"
        />

        <div className="flex justify-between items-center mt-4">
          <span className="text-text-secondary text-sm">{wordCount} words</span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-bg-secondary text-text-secondary rounded-lg hover:text-text-primary text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={wordCount < 2}
              className="px-4 py-2 bg-accent text-bg-primary font-semibold rounded-lg hover:opacity-90 text-sm disabled:opacity-40"
            >
              Start Test
            </button>
          </div>
        </div>

        <p className="text-text-secondary text-xs mt-3 opacity-60">
          Ctrl+Enter to start &nbsp;·&nbsp; Esc to cancel
        </p>
      </div>
    </div>
  );
}
