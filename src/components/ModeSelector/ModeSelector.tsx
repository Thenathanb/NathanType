import { useState } from 'react';
import { useTestStore } from '../../stores/testStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { CustomTextModal } from '../TypingArea/CustomTextModal';
import type { TestMode } from '../../types/index.js';

export function ModeSelector() {
  const {
    mode, timeLimit, wordLimit,
    setMode, setTimeLimit, setWordLimit,
    setCustomText, isActive,
  } = useTestStore();
  const { punctuation, numbers, updateSettings } = useSettingsStore();
  const [showCustomModal, setShowCustomModal] = useState(false);

  if (isActive) return null; // hide during test (clean Monkeytype style)

  const modes: { value: TestMode; label: string }[] = [
    { value: 'time', label: 'time' },
    { value: 'words', label: 'words' },
    { value: 'quote', label: 'quote' },
    { value: 'zen', label: 'zen' },
    { value: 'custom', label: 'custom' },
  ];

  const timeLimits = [15, 30, 60, 120];
  const wordLimits = [10, 25, 50, 100];

  const handleModeChange = (m: TestMode) => {
    if (m === 'custom') {
      setShowCustomModal(true);
    }
    setMode(m);
  };

  const handleCustomSubmit = (text: string) => {
    setCustomText(text);
    setMode('custom');
  };

  return (
    <>
      <div className="flex flex-col gap-3 items-center mb-8">
        {/* Toggles (punctuation / numbers) */}
        {(mode === 'time' || mode === 'words' || mode === 'zen') && (
          <div className="flex gap-4 items-center text-sm">
            <button
              onClick={() => updateSettings({ punctuation: !punctuation })}
              className={`transition-all ${
                punctuation ? 'text-accent font-semibold' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              @ punctuation
            </button>
            <button
              onClick={() => updateSettings({ numbers: !numbers })}
              className={`transition-all ${
                numbers ? 'text-accent font-semibold' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              # numbers
            </button>
          </div>
        )}

        {/* Mode tabs */}
        <div className="flex gap-1 bg-bg-secondary rounded-lg p-1">
          {modes.map((m) => (
            <button
              key={m.value}
              onClick={() => handleModeChange(m.value)}
              className={`px-4 py-1.5 rounded-md text-sm transition-all ${
                mode === m.value
                  ? 'bg-accent text-bg-primary font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Time / word sub-options */}
        {mode === 'time' && (
          <div className="flex gap-3 text-sm">
            {timeLimits.map((limit) => (
              <button
                key={limit}
                onClick={() => setTimeLimit(limit)}
                className={`px-2 py-0.5 rounded transition-all ${
                  timeLimit === limit
                    ? 'text-accent font-bold'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {limit}
              </button>
            ))}
          </div>
        )}

        {mode === 'words' && (
          <div className="flex gap-3 text-sm">
            {wordLimits.map((limit) => (
              <button
                key={limit}
                onClick={() => setWordLimit(limit)}
                className={`px-2 py-0.5 rounded transition-all ${
                  wordLimit === limit
                    ? 'text-accent font-bold'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {limit}
              </button>
            ))}
          </div>
        )}

        {mode === 'quote' && (
          <p className="text-text-secondary text-xs">random quote from the library</p>
        )}

        {mode === 'zen' && (
          <p className="text-text-secondary text-xs">type freely · no timer · no end</p>
        )}

        {mode === 'custom' && (
          <button
            onClick={() => setShowCustomModal(true)}
            className="text-text-secondary text-xs hover:text-accent transition-colors"
          >
            edit custom text ›
          </button>
        )}
      </div>

      <CustomTextModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onSubmit={handleCustomSubmit}
      />
    </>
  );
}
