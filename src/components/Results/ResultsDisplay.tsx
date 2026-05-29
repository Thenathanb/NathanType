import { useTestStore } from '../../stores/testStore';
import { useUserStore, getPbKey } from '../../stores/userStore';
import { WpmChart } from './WpmChart';

interface ResultsDisplayProps {
  onRestart: () => void;
}

export function ResultsDisplay({ onRestart }: ResultsDisplayProps) {
  const { currentResult, isNewPersonalBest, mode } = useTestStore();
  const { personalBests } = useUserStore();

  if (!currentResult) return null;

  const { stats, wpmHistory, config } = currentResult;
  const pbKey = getPbKey({ ...config, mode });
  const pb = personalBests[pbKey];

  const modeLabel = config.mode === 'time'
    ? `time ${config.timeLimit}`
    : config.mode === 'words'
    ? `words ${config.wordLimit}`
    : config.mode;

  const testTypeLabel = `${modeLabel} · ${config.language}${config.punctuation ? ' · punctuation' : ''}${config.numbers ? ' · numbers' : ''}`;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8" style={{ animation: 'fadeIn 0.2s ease-out' }}>

      {/* Test type label */}
      <div className="text-center mb-6 font-mono" style={{ color: '#646669', fontSize: 13 }}>
        {testTypeLabel}
      </div>

      {/* New PB banner */}
      {isNewPersonalBest && (
        <div className="text-center mb-6 font-mono font-bold" style={{ color: '#e2b714', fontSize: 16 }}>
          new personal best
        </div>
      )}

      {/* Main stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <StatBlock label="wpm" value={stats.wpm} accent />
        <StatBlock label="acc" value={`${stats.accuracy}%`} />
        <StatBlock label="raw" value={stats.rawWpm} />
        <StatBlock label="consistency" value={`${stats.consistency}%`} />
      </div>

      {/* WPM Chart */}
      <WpmChart data={wpmHistory} />

      {/* Detail cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-sm">
        {/* Characters */}
        <div className="rounded-xl p-4" style={{ backgroundColor: '#323437' }}>
          <div className="mb-3 uppercase tracking-wider" style={{ color: '#646669', fontSize: 11 }}>characters</div>
          <div className="space-y-1.5">
            <Row label="correct"   value={stats.correctChars}   color="#d1d0ce" />
            <Row label="incorrect" value={stats.incorrectChars} color="#ca4754" />
            <Row label="extra"     value={stats.extraChars}     color="#ca4754" />
            <Row label="missed"    value={stats.missedChars}    color="#646669" />
          </div>
        </div>

        {/* Test info */}
        <div className="rounded-xl p-4" style={{ backgroundColor: '#323437' }}>
          <div className="mb-3 uppercase tracking-wider" style={{ color: '#646669', fontSize: 11 }}>test</div>
          <div className="space-y-1.5">
            <Row label="mode"     value={modeLabel} />
            <Row label="language" value={config.language} />
            <Row label="time"     value={`${stats.timeElapsed}s`} />
            {config.punctuation && <Row label="punctuation" value="on" />}
            {config.numbers     && <Row label="numbers"     value="on" />}
          </div>
        </div>

        {/* Personal best */}
        <div className="rounded-xl p-4" style={{ backgroundColor: '#323437' }}>
          <div className="mb-3 uppercase tracking-wider" style={{ color: '#646669', fontSize: 11 }}>personal best</div>
          {pb ? (
            <div className="space-y-1.5">
              <Row label="wpm"         value={pb.wpm}           color={isNewPersonalBest ? '#e2b714' : undefined} />
              <Row label="accuracy"    value={`${pb.accuracy}%`} />
              <Row label="consistency" value={`${pb.consistency}%`} />
              <Row
                label="date"
                value={new Date(pb.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              />
            </div>
          ) : (
            <div style={{ color: '#646669', fontSize: 13 }}>no data yet</div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 justify-center mt-8">
        <button
          onClick={onRestart}
          className="font-mono transition-opacity hover:opacity-80"
          style={{
            backgroundColor: '#323437',
            color: '#e2b714',
            borderRadius: 8,
            padding: '10px 32px',
            fontSize: 14,
            border: 'none',
          }}
        >
          next test
        </button>
        <button
          onClick={() => {
            const text = `${stats.wpm} WPM | ${stats.accuracy}% accuracy | NathanType`;
            navigator.clipboard?.writeText(text).catch(() => {});
          }}
          className="font-mono transition-opacity hover:opacity-80"
          style={{
            backgroundColor: '#323437',
            color: '#646669',
            borderRadius: 8,
            padding: '10px 32px',
            fontSize: 14,
            border: 'none',
          }}
        >
          copy result
        </button>
      </div>

      <p className="text-center font-mono mt-4" style={{ color: '#646669', fontSize: 12, opacity: 0.6 }}>
        tab to restart
      </p>
    </div>
  );
}

function StatBlock({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="text-center font-mono">
      <div
        className="tabular-nums mb-1"
        style={{
          fontSize: 52,
          fontWeight: 700,
          color: accent ? '#e2b714' : '#d1d0ce',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div className="uppercase tracking-widest" style={{ color: '#646669', fontSize: 11 }}>{label}</div>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex justify-between font-mono" style={{ fontSize: 13 }}>
      <span style={{ color: '#646669' }}>{label}</span>
      <span style={{ color: color || '#d1d0ce' }}>{value}</span>
    </div>
  );
}
