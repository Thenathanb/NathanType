import { useTestStore } from '../../stores/testStore';
import type { SongSection } from '../../types/index.js';

const SECTIONS: { value: SongSection; label: string }[] = [
  { value: 'verse1', label: 'verse 1' },
  { value: 'chorus', label: 'chorus' },
  { value: 'verse2', label: 'verse 2' },
  { value: 'full',   label: 'full song' },
];

export function LyricsSectionTabs() {
  const { songSection, setSongSection, isActive } = useTestStore();
  if (isActive) return null;

  return (
    <div className="flex items-center gap-2 font-mono" style={{ fontSize: 12 }}>
      {SECTIONS.map(s => (
        <button
          key={s.value}
          onClick={() => setSongSection(s.value)}
          className="px-3 py-1 rounded-full transition-all"
          style={{
            backgroundColor: songSection === s.value ? '#e2b714' : '#323437',
            color: songSection === s.value ? '#2c2e31' : '#646669',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => { if (songSection !== s.value) e.currentTarget.style.color = '#d1d0ce'; }}
          onMouseLeave={e => { if (songSection !== s.value) e.currentTarget.style.color = '#646669'; }}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
