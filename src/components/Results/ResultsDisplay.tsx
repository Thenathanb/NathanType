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
    ? `${config.timeLimit}s`
    : config.mode === 'words'
    ? `${config.wordLimit} words`
    : config.mode;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      {/* New PB banner */}
      {isNewPersonalBest && (
        <div className="text-center mb-6 text-accent font-bold text-lg animate-pulse">
          ★ New Personal Best! ★
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
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        {/* Characters */}
        <div className="bg-bg-secondary rounded-xl p-4">
          <div className="text-text-secondary mb-3 text-xs uppercase tracking-wider">characters</div>
          <div className="space-y-1.5">
            <Row label="correct" value={stats.correctChars} color="text-correct" />
            <Row label="incorrect" value={stats.incorrectChars} color="text-error" />
            <Row label="extra" value={stats.extraChars} color="text-error" />
            <Row label="missed" value={stats.missedChars} color="text-text-secondary" />
          </div>
        </div>

        {/* Test info */}
        <div className="bg-bg-secondary rounded-xl p-4">
          <div className="text-text-secondary mb-3 text-xs uppercase tracking-wider">test</div>
          <div className="space-y-1.5">
            <Row label="mode" value={modeLabel} />
            <Row label="language" value={config.language} />
            <Row label="time" value={`${stats.timeElapsed}s`} />
            {config.punctuation && <Row label="punctuation" value="on" />}
            {config.numbers && <Row label="numbers" value="on" />}
          </div>
        </div>

        {/* Personal best */}
        <div className="bg-bg-secondary rounded-xl p-4">
          <div className="text-text-secondary mb-3 text-xs uppercase tracking-wider">personal best</div>
          {pb ? (
            <div className="space-y-1.5">
              <Row label="wpm" value={pb.wpm} color={isNewPersonalBest ? 'text-accent' : undefined} />
              <Row label="accuracy" value={`${pb.accuracy}%`} />
              <Row label="consistency" value={`${pb.consistency}%`} />
              <Row
                label="date"
                value={new Date(pb.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              />
            </div>
          ) : (
            <div className="text-text-secondary text-sm">no data yet</div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 justify-center mt-8">
        <button
          onClick={onRestart}
          className="px-8 py-3 bg-accent text-bg-primary font-bold rounded-xl hover:opacity-90 transition-opacity text-sm"
        >
          next test
        </button>
        <button
          onClick={() => {
            const text = `${stats.wpm} WPM | ${stats.accuracy}% accuracy | NathanType`;
            navigator.clipboard?.writeText(text).catch(() => {});
          }}
          className="px-8 py-3 bg-bg-secondary text-text-secondary rounded-xl hover:text-text-primary transition-colors text-sm"
        >
          copy result
        </button>
      </div>

      <p className="text-center text-text-secondary text-xs mt-4 opacity-50">
        Tab to restart
      </p>
    </div>
  );
}

function StatBlock({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="text-center">
      <div className={`text-5xl font-bold mb-1 ${accent ? 'text-accent' : 'text-text-primary'}`}>
        {value}
      </div>
      <div className="text-text-secondary text-xs uppercase tracking-widest">{label}</div>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-text-secondary">{label}</span>
      <span className={color || 'text-text-primary'}>{value}</span>
    </div>
  );
}
