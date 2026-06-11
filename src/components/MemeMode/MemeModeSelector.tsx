import { useTestStore } from '../../stores/testStore';
import type { MemeSubmode } from '../../types/index.js';

const SUBMODES: { value: MemeSubmode; label: string }[] = [
  { value: 'brainrot',   label: 'brainrot' },
  { value: 'classics',   label: 'classics' },
  { value: 'genz',       label: 'gen z' },
  { value: 'italian',    label: 'italian' },
  { value: 'characters', label: 'characters' },
];

export function MemeModeSelector() {
  const { memeSubmode, setMemeSubmode, isActive } = useTestStore();
  if (isActive) return null;

  return (
    <div className="flex items-center gap-2 font-mono" style={{ fontSize: 12 }}>
      {SUBMODES.map(s => (
        <button
          key={s.value}
          onClick={() => setMemeSubmode(s.value)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full transition-all"
          style={{
            backgroundColor: memeSubmode === s.value ? '#e2b714' : '#323437',
            color: memeSubmode === s.value ? '#2c2e31' : '#646669',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => { if (memeSubmode !== s.value) e.currentTarget.style.color = '#d1d0ce'; }}
          onMouseLeave={e => { if (memeSubmode !== s.value) e.currentTarget.style.color = '#646669'; }}
        >
          <span>{s.label}</span>
        </button>
      ))}
    </div>
  );
}
