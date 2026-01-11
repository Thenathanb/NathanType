import { useTestStore } from '../../stores/testStore';
import { useSettingsStore } from '../../stores/settingsStore';
import type { TestMode } from '../../types/index.js';

export function ModeSelector() {
  const { mode, timeLimit, wordLimit, setMode, setTimeLimit, setWordLimit } = useTestStore();
  const { punctuation, numbers, updateSettings } = useSettingsStore();

  const modes: { value: TestMode; label: string }[] = [
    { value: 'time', label: 'time' },
    { value: 'words', label: 'words' },
    { value: 'quote', label: 'quote' },
    { value: 'zen', label: 'zen' },
  ];

  const timeLimits = [15, 30, 60, 120];
  const wordLimits = [10, 25, 50, 100];

  return (
    <div className="flex flex-col gap-4 items-center mb-8">
      {/* Mode Selection */}
      <div className="flex gap-2">
        {modes.map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={`px-4 py-2 rounded-lg transition-all ${
              mode === m.value
                ? 'bg-accent text-bg-primary font-semibold'
                : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Time/Word Limits and Options */}
      <div className="flex gap-6 items-center flex-wrap justify-center">
        {/* Time limits for time mode */}
        {mode === 'time' && (
          <div className="flex gap-2">
            {timeLimits.map((limit) => (
              <button
                key={limit}
                onClick={() => setTimeLimit(limit)}
                className={`px-3 py-1 rounded transition-all ${
                  timeLimit === limit
                    ? 'text-accent font-semibold'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {limit}
              </button>
            ))}
          </div>
        )}

        {/* Word limits for words mode */}
        {mode === 'words' && (
          <div className="flex gap-2">
            {wordLimits.map((limit) => (
              <button
                key={limit}
                onClick={() => setWordLimit(limit)}
                className={`px-3 py-1 rounded transition-all ${
                  wordLimit === limit
                    ? 'text-accent font-semibold'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {limit}
              </button>
            ))}
          </div>
        )}

        {/* Divider */}
        {(mode === 'time' || mode === 'words') && (
          <div className="w-px h-6 bg-text-secondary opacity-30" />
        )}

        {/* Punctuation toggle */}
        {mode !== 'quote' && (
          <button
            onClick={() => updateSettings({ punctuation: !punctuation })}
            className={`px-3 py-1 rounded transition-all ${
              punctuation
                ? 'text-accent font-semibold'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            punctuation
          </button>
        )}

        {/* Numbers toggle */}
        {mode !== 'quote' && (
          <button
            onClick={() => updateSettings({ numbers: !numbers })}
            className={`px-3 py-1 rounded transition-all ${
              numbers
                ? 'text-accent font-semibold'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            numbers
          </button>
        )}
      </div>
    </div>
  );
}
