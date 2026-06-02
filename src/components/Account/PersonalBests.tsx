import { useAuth } from '../../context/AuthContext';
import type { UserProfile } from '../../context/AuthContext';

type BestWpmKey = keyof UserProfile['bestWpm'];

const TIME_COLS: { key: BestWpmKey; label: string }[] = [
  { key: 'time15',  label: '15 seconds' },
  { key: 'time30',  label: '30 seconds' },
  { key: 'time60',  label: '60 seconds' },
  { key: 'time120', label: '120 seconds' },
];
const WORD_COLS: { key: BestWpmKey; label: string }[] = [
  { key: 'words10',  label: '10 words' },
  { key: 'words25',  label: '25 words' },
  { key: 'words50',  label: '50 words' },
  { key: 'words100', label: '100 words' },
];

export function PersonalBests() {
  const { userProfile } = useAuth();
  if (!userProfile) return null;

  const hasSomePb = Object.values(userProfile.bestWpm).some(v => v > 0);

  return (
    <div className="flex flex-col gap-4">
      <PbCard title="time" cols={TIME_COLS} bestWpm={userProfile.bestWpm} bestWpmDates={userProfile.bestWpmDates} />
      <PbCard title="words" cols={WORD_COLS} bestWpm={userProfile.bestWpm} bestWpmDates={userProfile.bestWpmDates} />

      {!hasSomePb && (
        <div
          className="rounded-xl p-5 font-mono text-center"
          style={{ backgroundColor: 'var(--bg2)', color: 'var(--sub)', fontSize: 13 }}
        >
          complete a test in time or words mode to set a personal record
        </div>
      )}
    </div>
  );
}

function fmtDate(ts: number | null | undefined): string {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function PbCard({
  title,
  cols,
  bestWpm,
  bestWpmDates,
}: {
  title: string;
  cols: { key: BestWpmKey; label: string }[];
  bestWpm: UserProfile['bestWpm'];
  bestWpmDates: UserProfile['bestWpmDates'];
}) {
  return (
    <div className="rounded-xl font-mono" style={{ backgroundColor: 'var(--bg2)' }}>
      {/* Card header */}
      <div
        className="flex items-center justify-between px-6 pt-5 pb-3"
        style={{ borderBottom: '0.5px solid color-mix(in srgb, var(--sub) 15%, transparent)' }}
      >
        <span style={{ color: 'var(--sub)', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {title} — personal bests
        </span>
        <span style={{ color: 'var(--sub)', fontSize: 11 }}>wpm</span>
      </div>

      {/* Column headers */}
      <div className="grid px-6 pt-4 pb-1" style={{ gridTemplateColumns: `repeat(${cols.length}, 1fr)` }}>
        {cols.map(c => (
          <div key={c.key} className="text-center" style={{ color: 'var(--sub)', fontSize: 11 }}>
            {c.label}
          </div>
        ))}
      </div>

      {/* WPM row */}
      <div className="grid px-6 pb-2" style={{ gridTemplateColumns: `repeat(${cols.length}, 1fr)` }}>
        {cols.map(c => {
          const wpm = bestWpm[c.key];
          const hasPb = wpm > 0;
          return (
            <div key={c.key} className="text-center">
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  lineHeight: 1.1,
                  color: hasPb ? 'var(--main)' : 'color-mix(in srgb, var(--sub) 25%, transparent)',
                }}
              >
                {hasPb ? wpm : '—'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Date row */}
      <div
        className="grid px-6 pb-5"
        style={{ gridTemplateColumns: `repeat(${cols.length}, 1fr)` }}
      >
        {cols.map(c => {
          const date = fmtDate((bestWpmDates as Record<string, number | null>)[c.key]);
          return (
            <div key={c.key} className="text-center" style={{ color: 'var(--sub)', fontSize: 10, minHeight: 14 }}>
              {date}
            </div>
          );
        })}
      </div>
    </div>
  );
}
