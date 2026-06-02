import { useAuth } from '../../context/AuthContext';

const PERCENTILE_TABLE = [
  { min: 90, pct: '5%' },
  { min: 80, pct: '15%' },
  { min: 70, pct: '25%' },
  { min: 60, pct: '40%' },
  { min: 50, pct: '55%' },
  { min: 40, pct: '70%' },
  { min: 0,  pct: '85%' },
];

function getPercentile(wpm: number) {
  return PERCENTILE_TABLE.find(r => wpm >= r.min)?.pct ?? '85%';
}

function ordinal(n: number) {
  if (n <= 0) return '—';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function wpmToRank(wpm: number): number {
  const pct = parseFloat(getPercentile(wpm)) / 100;
  return Math.max(1, Math.round(pct * 10000));
}

export function LeaderboardCard() {
  const { userProfile } = useAuth();
  if (!userProfile) return null;

  const wpm15 = userProfile.bestWpm.time15;
  const wpm60 = userProfile.bestWpm.time60;

  return (
    <div className="rounded-xl p-5 font-mono" style={{ backgroundColor: 'var(--bg2)' }}>
      <div className="flex items-center justify-between mb-4">
        <span style={{ color: 'var(--sub)', fontSize: 13 }}>All-Time English Leaderboards</span>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <RankBlock label="15 seconds" wpm={wpm15} />
        <RankBlock label="60 seconds" wpm={wpm60} />
      </div>
    </div>
  );
}

function RankBlock({ label, wpm }: { label: string; wpm: number }) {
  const has = wpm > 0;
  return (
    <div>
      <div style={{ color: 'var(--sub)', fontSize: 12, marginBottom: 6 }}>{label}</div>
      {has ? (
        <>
          <div style={{ color: 'var(--text)', fontSize: 36, fontWeight: 500, lineHeight: 1 }}>{ordinal(wpmToRank(wpm))}</div>
          <div style={{ color: 'var(--sub)', fontSize: 13, marginTop: 4 }}>Top {getPercentile(wpm)}</div>
        </>
      ) : (
        <div style={{ color: 'var(--sub)', fontSize: 28 }}>—</div>
      )}
    </div>
  );
}
