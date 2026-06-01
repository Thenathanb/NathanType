import { useTestStore } from '../../stores/testStore';
import type { ContentCategory } from '../../types/index.js';

const CATEGORIES: { value: ContentCategory; label: string; emoji: string }[] = [
  { value: 'books',    label: 'books',    emoji: '📖' },
  { value: 'messages', label: 'messages', emoji: '✉️' },
  { value: 'news',     label: 'news',     emoji: '📰' },
  { value: 'history',  label: 'history',  emoji: '🏛️' },
  { value: 'facts',    label: 'facts',    emoji: '🧠' },
];

export function ContentModeSelector() {
  const { contentCategory, setContentCategory, isActive } = useTestStore();
  if (isActive) return null;

  return (
    <div className="flex items-center gap-2 font-mono" style={{ fontSize: 12 }}>
      {CATEGORIES.map(c => (
        <button
          key={c.value}
          onClick={() => setContentCategory(c.value)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full transition-all"
          style={{
            backgroundColor: contentCategory === c.value ? '#e2b714' : '#323437',
            color: contentCategory === c.value ? '#2c2e31' : '#646669',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => { if (contentCategory !== c.value) e.currentTarget.style.color = '#d1d0ce'; }}
          onMouseLeave={e => { if (contentCategory !== c.value) e.currentTarget.style.color = '#646669'; }}
        >
          <span>{c.emoji}</span>
          <span>{c.label}</span>
        </button>
      ))}
    </div>
  );
}
