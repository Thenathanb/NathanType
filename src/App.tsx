import { useEffect, useState } from 'react';
import { TypingArea } from './components/TypingArea/TypingArea';
import { ModeSelector } from './components/ModeSelector/ModeSelector';
import { ResultsDisplay } from './components/Results/ResultsDisplay';
import { Settings } from './components/Settings/Settings';
import { TestHistory } from './components/History/TestHistory';
import { useTypingTest } from './hooks/useTypingTest';
import { useTestStore } from './stores/testStore';
import { useSettingsStore } from './stores/settingsStore';
import { applyTheme } from './utils/themes';

function App() {
  const { currentInput, timeRemaining, liveWpm, handleKeyPress, handleRestart } = useTypingTest();
  const { isComplete, isActive, mode, timeLimit } = useTestStore();
  const { theme, showLiveWpm, showTimer, focusMode } = useSettingsStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Keyboard shortcut: Escape from results goes back (handled in hook already for active tests)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isComplete && e.key === 'Tab') {
        e.preventDefault();
        handleRestart();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isComplete, handleRestart]);

  const headerHidden = isActive && focusMode;

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col">
      {/* Header */}
      <header
        className={`flex justify-between items-center px-8 py-5 transition-opacity duration-300 ${
          headerHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold text-accent tracking-tight">NathanType</h1>
        </div>

        <div className="flex gap-3 items-center">
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="px-3 py-1.5 text-text-secondary hover:text-text-primary transition-colors text-sm"
            title="Test history"
          >
            history
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-3 py-1.5 text-text-secondary hover:text-text-primary transition-colors text-sm"
            title="Settings"
          >
            settings
          </button>
        </div>
      </header>

      {/* Main content — centered */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 pb-16">
        <div className="w-full max-w-4xl">
          {!isComplete ? (
            <>
              <ModeSelector />

              {/* Live stats row */}
              <div
                className={`flex justify-center items-baseline gap-8 mb-6 transition-opacity ${
                  isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                style={{ minHeight: '3rem' }}
              >
                {mode === 'time' && showTimer && (
                  <div className="text-5xl font-bold text-accent tabular-nums">
                    {isActive ? timeRemaining : timeLimit}
                  </div>
                )}
                {showLiveWpm && liveWpm > 0 && (
                  <div className="text-xl text-text-secondary tabular-nums">
                    {liveWpm} <span className="text-sm">wpm</span>
                  </div>
                )}
              </div>

              {/* Timer placeholder when not active (keeps layout stable) */}
              {!isActive && mode === 'time' && (
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-accent">
                    {timeLimit}
                  </div>
                </div>
              )}

              <TypingArea
                onKeyPress={handleKeyPress}
                currentInput={currentInput}
              />
            </>
          ) : (
            <ResultsDisplay onRestart={handleRestart} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer
        className={`text-center text-text-secondary text-xs pb-6 transition-opacity duration-300 ${
          headerHidden ? 'opacity-0' : 'opacity-40'
        }`}
      >
        nathantype · built with react + typescript
      </footer>

      {/* Modals */}
      <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <TestHistory isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
    </div>
  );
}

export default App;
