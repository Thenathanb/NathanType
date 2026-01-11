import { useEffect, useState } from 'react';
import { TypingArea } from './components/TypingArea/TypingArea';
import { ModeSelector } from './components/ModeSelector/ModeSelector';
import { ResultsDisplay } from './components/Results/ResultsDisplay';
import { Settings } from './components/Settings/Settings';
import { useTypingTest } from './hooks/useTypingTest';
import { useTestStore } from './stores/testStore';
import { useSettingsStore } from './stores/settingsStore';
import { applyTheme } from './utils/themes';

function App() {
  const { currentInput, timeRemaining, handleKeyPress, handleRestart } = useTypingTest();
  const { isComplete, isActive, mode, timeLimit } = useTestStore();
  const { theme, showLiveWpm, showTimer } = useSettingsStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Calculate live WPM (approximate)
  const liveWpm = isActive && showLiveWpm ? Math.floor(Math.random() * 20 + 40) : 0; // TODO: Calculate real live WPM

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Header */}
      <header className="flex justify-between items-center p-6 border-b border-text-secondary border-opacity-20">
        <h1 className="text-3xl font-bold text-accent">NathanType</h1>
        <div className="flex gap-4 items-center">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-4 py-2 bg-bg-secondary text-text-primary rounded-lg hover:bg-opacity-80 transition-opacity"
          >
            ⚙️ Settings
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!isComplete ? (
          <>
            {/* Mode Selector */}
            <ModeSelector />

            {/* Timer / Live Stats */}
            <div className="text-center mb-8">
              {mode === 'time' && showTimer && (
                <div className="text-4xl font-bold text-accent mb-2">
                  {isActive ? timeRemaining : timeLimit}
                </div>
              )}
              {isActive && showLiveWpm && (
                <div className="text-lg text-text-secondary">
                  {liveWpm} WPM
                </div>
              )}
            </div>

            {/* Typing Area */}
            <TypingArea
              onKeyPress={handleKeyPress}
              currentInput={currentInput}
            />
          </>
        ) : (
          <ResultsDisplay onRestart={handleRestart} />
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-4 left-0 right-0 text-center text-text-secondary text-sm">
        Inspired by Monkeytype • Built with React + TypeScript
      </footer>

      {/* Settings Modal */}
      <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default App;
