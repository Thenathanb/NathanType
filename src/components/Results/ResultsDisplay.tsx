import { useTestStore } from '../../stores/testStore';
import { WpmChart } from './WpmChart';

interface ResultsDisplayProps {
  onRestart: () => void;
}

export function ResultsDisplay({ onRestart }: ResultsDisplayProps) {
  const { currentResult } = useTestStore();

  if (!currentResult) return null;

  const { stats, wpmHistory, config } = currentResult;

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Main Stats */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="text-center">
          <div className="text-6xl font-bold text-accent mb-2">{stats.wpm}</div>
          <div className="text-text-secondary text-sm uppercase">WPM</div>
        </div>
        <div className="text-center">
          <div className="text-6xl font-bold text-correct mb-2">{stats.accuracy}%</div>
          <div className="text-text-secondary text-sm uppercase">Accuracy</div>
        </div>
        <div className="text-center">
          <div className="text-6xl font-bold text-text-primary mb-2">{stats.consistency}%</div>
          <div className="text-text-secondary text-sm uppercase">Consistency</div>
        </div>
      </div>

      {/* WPM Chart */}
      <WpmChart data={wpmHistory} />

      {/* Detailed Stats */}
      <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
        <div className="bg-bg-secondary p-4 rounded-lg">
          <div className="text-text-secondary mb-2">Characters</div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-correct">Correct:</span>
              <span className="text-text-primary">{stats.correctChars}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-error">Incorrect:</span>
              <span className="text-text-primary">{stats.incorrectChars}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-error">Extra:</span>
              <span className="text-text-primary">{stats.extraChars}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Missed:</span>
              <span className="text-text-primary">{stats.missedChars}</span>
            </div>
          </div>
        </div>

        <div className="bg-bg-secondary p-4 rounded-lg">
          <div className="text-text-secondary mb-2">Test Info</div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-text-secondary">Mode:</span>
              <span className="text-text-primary">{config.mode} {config.mode === 'time' ? `${config.timeLimit}s` : `${config.wordLimit} words`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Language:</span>
              <span className="text-text-primary">{config.language}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Raw WPM:</span>
              <span className="text-text-primary">{stats.rawWpm}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Time:</span>
              <span className="text-text-primary">{stats.timeElapsed}s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center mt-8">
        <button
          onClick={onRestart}
          className="px-6 py-3 bg-accent text-bg-primary font-semibold rounded-lg hover:opacity-90 transition-opacity"
        >
          🔄 Restart Test
        </button>
        <button
          className="px-6 py-3 bg-bg-secondary text-text-primary rounded-lg hover:bg-opacity-80 transition-opacity"
          onClick={() => {
            // TODO: Implement share functionality
            alert('Share feature coming soon!');
          }}
        >
          📤 Share
        </button>
      </div>
    </div>
  );
}
