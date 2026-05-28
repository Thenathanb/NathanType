import { useUserStore } from '../../stores/userStore';
import type { TestResult } from '../../types/index.js';

interface TestHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TestHistory({ isOpen, onClose }: TestHistoryProps) {
  const { testHistory } = useUserStore();

  if (!isOpen) return null;

  const recent = testHistory.slice(0, 50);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-bg-primary border border-text-secondary border-opacity-20 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-accent">Test History</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="text-text-secondary text-center py-12">
            No tests yet — start typing!
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 -mx-2 px-2">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-bg-primary">
                <tr className="text-text-secondary text-xs uppercase tracking-wider">
                  <th className="pb-3 text-left font-normal">date</th>
                  <th className="pb-3 text-left font-normal">mode</th>
                  <th className="pb-3 text-right font-normal">wpm</th>
                  <th className="pb-3 text-right font-normal">raw</th>
                  <th className="pb-3 text-right font-normal">acc</th>
                  <th className="pb-3 text-right font-normal">consistency</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((result: TestResult) => (
                  <HistoryRow key={result.id} result={result} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryRow({ result }: { result: TestResult }) {
  const { config, stats, timestamp } = result;
  const date = new Date(timestamp);
  const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const timeStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  const modeLabel = config.mode === 'time'
    ? `time ${config.timeLimit}s`
    : config.mode === 'words'
    ? `words ${config.wordLimit}`
    : config.mode;

  return (
    <tr className="border-t border-text-secondary border-opacity-10 hover:bg-bg-secondary transition-colors">
      <td className="py-2.5 text-text-secondary">
        {dateStr} <span className="opacity-50">{timeStr}</span>
      </td>
      <td className="py-2.5 text-text-primary">{modeLabel}</td>
      <td className="py-2.5 text-right text-accent font-bold">{stats.wpm}</td>
      <td className="py-2.5 text-right text-text-secondary">{stats.rawWpm}</td>
      <td className="py-2.5 text-right text-text-primary">{stats.accuracy}%</td>
      <td className="py-2.5 text-right text-text-secondary">{stats.consistency}%</td>
    </tr>
  );
}
