import type { TestStats } from '../../types/index.js';

interface SecondaryStatsProps {
  stats: TestStats;
  timestamp: number;
}

function fmtTime(ts: number) {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  const today = new Date().toDateString() === d.toDateString();
  const dayName = today ? 'today' : d.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
  return `${h}:${m}:${s} ${dayName}`;
}

interface StatBlockProps {
  label: string;
  children: React.ReactNode;
}
function StatBlock({ label, children }: StatBlockProps) {
  return (
    <div className="font-mono" style={{ flex: 1 }}>
      <div style={{ color: 'var(--sub)', fontSize: 13, marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  );
}

export function SecondaryStats({ stats, timestamp }: SecondaryStatsProps) {
  const { correctChars: c, incorrectChars: i, extraChars: e, missedChars: m } = stats;

  return (
    <div style={{ display: 'flex', gap: 24, marginTop: 20 }}>

      {/* Raw WPM */}
      <StatBlock label="raw">
        <div style={{ color: 'var(--main)', fontSize: 30, fontWeight: 500 }} title={String(stats.rawWpm)}>
          {Math.round(stats.rawWpm)}
        </div>
      </StatBlock>

      {/* Characters */}
      <StatBlock label="characters">
        <div style={{ color: 'var(--main)', fontSize: 30, fontWeight: 500 }}>
          <span>{c}</span>
          <span style={{ color: 'rgba(255,255,255,0.25)' }}>/</span>
          <span style={{ color: 'var(--error)' }}>{i}</span>
          <span style={{ color: 'rgba(255,255,255,0.25)' }}>/</span>
          <span style={{ color: 'var(--error)' }}>{e}</span>
          <span style={{ color: 'rgba(255,255,255,0.25)' }}>/</span>
          <span style={{ color: 'var(--sub)' }}>{m}</span>
        </div>
      </StatBlock>

      {/* Consistency */}
      <StatBlock label="consistency">
        <div style={{ color: 'var(--main)', fontSize: 30, fontWeight: 500 }} title={`${stats.consistency}%`}>
          {Math.round(stats.consistency)}%
        </div>
      </StatBlock>

      {/* Time */}
      <StatBlock label="time">
        <div style={{ color: 'var(--main)', fontSize: 30, fontWeight: 500 }}>
          {stats.timeElapsed}s
        </div>
        <div style={{ color: 'var(--sub)', fontSize: 12, marginTop: 3 }}>
          {fmtTime(timestamp)}
        </div>
      </StatBlock>

    </div>
  );
}
