import { useAuth } from '../../context/AuthContext';
import type { UserProfile } from '../../context/AuthContext';

type BestWpmKey = keyof UserProfile['bestWpm'];

const TIME_COLS: { key: BestWpmKey; label: string }[] = [
  { key: 'time15',  label: '15s' },
  { key: 'time30',  label: '30s' },
  { key: 'time60',  label: '60s' },
  { key: 'time120', label: '120s' },
];
const WORD_COLS: { key: BestWpmKey; label: string }[] = [
  { key: 'words10',  label: '10' },
  { key: 'words25',  label: '25' },
  { key: 'words50',  label: '50' },
  { key: 'words100', label: '100' },
];

export function PersonalBests() {
  const { userProfile } = useAuth();
  if (!userProfile) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <PbCard title="time" cols={TIME_COLS} bestWpm={userProfile.bestWpm} />
      <PbCard title="words" cols={WORD_COLS} bestWpm={userProfile.bestWpm} />
    </div>
  );
}

function PbCard({
  title,
  cols,
  bestWpm,
}: {
  title: string;
  cols: { key: BestWpmKey; label: string }[];
  bestWpm: UserProfile['bestWpm'];
}) {
  return (
    <div className="rounded-xl p-5 font-mono" style={{ backgroundColor: '#323437' }}>
      <div className="flex items-center justify-between mb-4">
        <span style={{ color: '#646669', fontSize: 13 }}>{title}</span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {cols.map(c => {
          const wpm = bestWpm[c.key];
          return (
            <div key={c.key} className="text-center">
              <div style={{ color: '#646669', fontSize: 11, marginBottom: 4 }}>{c.label}</div>
              <div style={{ color: wpm > 0 ? '#d1d0ce' : '#3a3c3f', fontSize: 26, fontWeight: 500 }}>
                {wpm > 0 ? wpm : '—'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
