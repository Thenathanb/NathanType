import { useEffect, useState } from 'react';
import { TypingArea } from './components/TypingArea/TypingArea';
import { ModeSelector } from './components/ModeSelector/ModeSelector';
import { ResultsDisplay } from './components/Results/ResultsDisplay';
import { Settings } from './components/Settings/Settings';
import { TestHistory } from './components/History/TestHistory';
import { useTypingTest } from './hooks/useTypingTest';
import { useTestStore } from './stores/testStore';
import { useSettingsStore } from './stores/settingsStore';
import { useUserStore } from './stores/userStore';
import { applyTheme, applyFont, getAllThemes } from './utils/themes';

function App() {
  const { currentInput, timeRemaining, liveWpm, liveAccuracy, handleKeyPress, handleRestart, handleCancel } = useTypingTest();
  const { isComplete, isActive, mode, timeLimit } = useTestStore();
  const { theme, fontFamily, showLiveWpm, showTimer, focusMode } = useSettingsStore();
  const { testHistory } = useUserStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => { applyTheme(theme); }, [theme]);
  useEffect(() => { applyFont(fontFamily); }, [fontFamily]);

  // Tab to restart from results screen
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

  const currentTheme = getAllThemes().find(t => t.id === theme);
  const userLevel = Math.floor(testHistory.length / 10) + 1;
  const headerHidden = isActive && focusMode;

  return (
    <div className="h-screen flex flex-col bg-bg-primary overflow-hidden select-none">

      {/* ── NAVBAR ───────────────────────────────── */}
      <header
        className={`flex items-center justify-between px-7 py-3 shrink-0 transition-opacity duration-300 ${
          headerHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        {/* Logo */}
        <button
          onClick={() => isActive ? handleCancel() : handleRestart()}
          className="flex flex-col leading-none hover:opacity-70 transition-opacity text-left"
        >
          <span className="text-text-secondary font-mono" style={{ fontSize: 11 }}>built by nathan</span>
          <span className="text-accent font-mono font-medium" style={{ fontSize: 20 }}>Jamie is ass at pickleball</span>
        </button>

        {/* Nav icons */}
        <div className="flex items-center gap-1">
          <NavIcon title="Keyboard" onClick={() => {}} icon={<IconKeyboard />} />
          <NavIcon title="Leaderboard" onClick={() => setIsHistoryOpen(true)} icon={<IconTrophy />} />
          <NavIcon title="Info" onClick={() => {}} icon={<IconInfo />} />
          <NavIcon title="Settings" onClick={() => setIsSettingsOpen(true)} icon={<IconSettings />} />
          <NavIcon title="Notifications" onClick={() => {}} icon={<IconBell />} />
          <div className="w-px h-5 mx-1" style={{ backgroundColor: '#646669', opacity: 0.4 }} />
          <NavIcon title="Profile" onClick={() => {}} icon={<IconUser />} />
          <span
            className="font-mono text-sm ml-1 px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: '#e2b714', color: '#2c2e31', fontSize: 12 }}
          >
            {userLevel}
          </span>
        </div>
      </header>

      {/* ── MAIN ─────────────────────────────────── */}
      <main
        className="flex-1 flex flex-col items-center"
        style={{ paddingTop: 120 }}
        onClick={(e) => {
          // Focus typing input when clicking main area (not modals/buttons)
          const target = e.target as HTMLElement;
          if (target.tagName !== 'BUTTON' && !target.closest('button') && !isComplete) {
            document.querySelector<HTMLInputElement>('.typing-capture-input')?.focus();
          }
        }}
      >
        {!isComplete ? (
          <div className="flex flex-col items-center w-full">

            {/* Mode bar */}
            <div style={{ marginBottom: 16 }}>
              <ModeSelector />
            </div>

            {/* Language selector */}
            <div className="flex items-center gap-1.5" style={{ color: '#646669', fontSize: 13, marginBottom: 32 }}>
              <IconGlobe />
              <span className="font-mono">english</span>
            </div>

            {/* Live stats — fade in when typing */}
            <div
              className={`flex gap-10 transition-all duration-200 ${
                isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              style={{ minHeight: 52, marginBottom: 20 }}
            >
              {showLiveWpm && (
                <div className="text-center">
                  <div className="font-mono font-medium tabular-nums" style={{ color: '#e2b714', fontSize: 28 }}>
                    {liveWpm}
                  </div>
                  <div className="font-mono uppercase tracking-wider" style={{ color: '#646669', fontSize: 11 }}>wpm</div>
                </div>
              )}
              <div className="text-center">
                <div className="font-mono font-medium tabular-nums" style={{ color: '#e2b714', fontSize: 28 }}>
                  {liveAccuracy}
                </div>
                <div className="font-mono uppercase tracking-wider" style={{ color: '#646669', fontSize: 11 }}>acc</div>
              </div>
            </div>

            {/* Timer (time mode) — above word area */}
            {mode === 'time' && showTimer && (
              <div
                className={`font-mono tabular-nums transition-all duration-200 ${
                  isActive ? 'opacity-100' : 'opacity-60'
                }`}
                style={{ color: '#e2b714', fontSize: 13, marginBottom: 8 }}
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
              style={{ color: '#646669', fontSize: 12, marginTop: 24 }}
            >
              <HintChip keys={['tab', 'enter']} label="restart" />
              <HintChip keys={['esc']} label="cancel" />
              <HintChip keys={['⌘', 'shift', 'p']} label="command line" />
            </div>
          </div>
        ) : (
          <ResultsDisplay onRestart={handleRestart} />
        )}
      </main>

      {/* ── FOOTER ───────────────────────────────── */}
      <footer
        className={`shrink-0 flex items-center justify-between font-mono transition-opacity duration-300 ${
          headerHidden ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ color: '#646669', fontSize: 12, padding: '20px 28px' }}
      >
        {/* Left links */}
        <div className="flex gap-4">
          {['contact', 'support', 'github', 'discord', 'twitter'].map(link => (
            <a key={link} href="#" className="hover:text-text-primary transition-colors no-underline" style={{ color: '#646669' }}>
              {link}
            </a>
          ))}
        </div>

        {/* Center: theme chip */}
        <div className="flex items-center gap-2">
          <div className="rounded-full" style={{ width: 8, height: 8, backgroundColor: currentTheme?.accent || '#e2b714' }} />
          <span>{currentTheme?.name?.toLowerCase() || 'nathan dark'}</span>
        </div>

        {/* Right: version */}
        <span>v1.0.0</span>
      </footer>

      {/* Modals */}
      <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <TestHistory isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
    </div>
  );
}

// ── Small reusable components ────────────────────────────────────

function NavIcon({ icon, title, onClick }: { icon: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="p-2 rounded transition-colors"
      style={{ color: '#646669' }}
      onMouseEnter={e => (e.currentTarget.style.color = '#d1d0ce')}
      onMouseLeave={e => (e.currentTarget.style.color = '#646669')}
    >
      {icon}
    </button>
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
              backgroundColor: '#323437',
              border: '0.5px solid #646669',
              borderRadius: 4,
              fontSize: 12,
              color: '#646669',
            }}
          >
            {k}
          </span>
          {i < keys.length - 1 && <span className="mx-0.5" style={{ color: '#646669' }}>+</span>}
        </span>
      ))}
      <span className="ml-1" style={{ color: '#646669' }}>{label}</span>
    </div>
  );
}

// ── SVG Icons (minimal, 18×18 viewBox) ──────────────────────────

function IconKeyboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
    </svg>
  );
}

function IconTrophy() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
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

export default App;
