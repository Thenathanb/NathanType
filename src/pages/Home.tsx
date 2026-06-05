import { useEffect, useRef } from 'react';
import { TypingArea } from '../components/TypingArea/TypingArea';
import { ModeSelector } from '../components/ModeSelector/ModeSelector';
import { ResultsDisplay } from '../components/Results/ResultsDisplay';
import { useTypingTest } from '../hooks/useTypingTest';
import { useTestStore } from '../stores/testStore';
import { useSettingsStore } from '../stores/settingsStore';
import { FunboxBadge } from '../components/Funbox/FunboxBadge';

export function Home({ onOpenAuth, onOpenSettings }: { onOpenAuth?: () => void; onOpenSettings?: () => void }) {
  const { currentInput, timeRemaining, liveWpm, liveAccuracy, handleKeyPress, handleRestart } = useTypingTest();
  const { isComplete, isActive, mode, timeLimit, restartSignal } = useTestStore();
  const { showLiveWpm, showLiveAccuracy, showTimer } = useSettingsStore();

  const prevSignal = useRef(restartSignal);
  useEffect(() => {
    if (restartSignal !== prevSignal.current) {
      prevSignal.current = restartSignal;
      handleRestart();
    }
  }, [restartSignal, handleRestart]);

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

  return (
    <div
      className="flex-1 flex flex-col items-center"
      style={{ paddingTop: 120 }}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'BUTTON' && !target.closest('button') && !isComplete) {
          document.querySelector<HTMLInputElement>('.typing-capture-input')?.focus();
        }
      }}
    >
      {!isComplete ? (
        <div className="flex flex-col items-center w-full">

          {/* Mode bar */}
          <div style={{ marginBottom: 4 }}>
            <ModeSelector />
          </div>

          {/* Funbox badge */}
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
            <FunboxBadge onOpenSettings={() => {
              onOpenSettings?.();
              setTimeout(() => {
                document.getElementById('funbox-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 120);
            }} />
          </div>

          {/* Language indicator */}
          <div className="flex items-center gap-1.5" style={{ color: 'var(--sub)', fontSize: 13, marginBottom: 32 }}>
            <IconGlobe />
            <span className="font-mono">english</span>
          </div>

          {/* Live stats */}
          <div
            className={`flex gap-10 transition-all duration-200 ${
              isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            style={{ minHeight: 52, marginBottom: 20 }}
          >
            {showLiveWpm && (
              <div className="text-center">
                <div className="font-mono font-medium tabular-nums" style={{ color: 'var(--main)', fontSize: 28 }}>
                  {liveWpm}
                </div>
                <div className="font-mono uppercase tracking-wider" style={{ color: 'var(--sub)', fontSize: 11 }}>wpm</div>
              </div>
            )}
            {showLiveAccuracy && (
              <div className="text-center">
                <div className="font-mono font-medium tabular-nums" style={{ color: 'var(--main)', fontSize: 28 }}>
                  {liveAccuracy}
                </div>
                <div className="font-mono uppercase tracking-wider" style={{ color: 'var(--sub)', fontSize: 11 }}>acc</div>
              </div>
            )}
          </div>

          {/* Timer (time mode) */}
          {mode === 'time' && showTimer && (
            <div
              className={`font-mono tabular-nums transition-all duration-200 ${
                isActive ? 'opacity-100' : 'opacity-60'
              }`}
              style={{ color: 'var(--main)', fontSize: 13, marginBottom: 8 }}
            >
              {isActive ? timeRemaining : timeLimit}
            </div>
          )}

          {/* Typing area */}
          <TypingArea onKeyPress={handleKeyPress} currentInput={currentInput} />

          {/* Keyboard hints */}
          <div
            className={`flex items-center gap-4 font-mono transition-opacity duration-300 ${
              isActive ? 'opacity-0' : 'opacity-100'
            }`}
            style={{ color: 'var(--sub)', fontSize: 12, marginTop: 24 }}
          >
            <HintChip keys={['tab', 'enter']} label="restart" />
            <HintChip keys={['esc']} label="cancel" />
          </div>
        </div>
      ) : (
        <ResultsDisplay onRestart={handleRestart} onOpenAuth={onOpenAuth} />
      )}
    </div>
  );
}

function HintChip({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {keys.map((k, i) => (
        <span key={i}>
          <span
            className="font-mono px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: 'var(--bg2)',
              border: '0.5px solid var(--sub)',
              borderRadius: 4,
              fontSize: 12,
              color: 'var(--sub)',
            }}
          >
            {k}
          </span>
          {i < keys.length - 1 && <span className="mx-0.5" style={{ color: 'var(--sub)' }}>+</span>}
        </span>
      ))}
      <span className="ml-1" style={{ color: 'var(--sub)' }}>{label}</span>
    </div>
  );
}

function IconGlobe() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
