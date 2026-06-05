import { useState } from 'react';
import { useTestStore } from '../../stores/testStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { CustomTextModal } from '../TypingArea/CustomTextModal';
import type { TestMode } from '../../types/index.js';

const PILL_BG = 'var(--bg-secondary)';
const DIVIDER = 'var(--text-secondary)';
const DEFAULT_COLOR = 'var(--text-secondary)';
const HOVER_COLOR = 'var(--text-primary)';
const ACTIVE_BG = 'var(--bg-primary)';
const ACTIVE_COLOR = 'var(--accent)';

export function ModeSelector() {
  const { mode, timeLimit, wordLimit, setMode, setTimeLimit, setWordLimit, setCustomText, isActive } = useTestStore();
  const { punctuation, numbers, updateSettings } = useSettingsStore();
  const [showCustomModal, setShowCustomModal] = useState(false);

  if (isActive) return null;

  const timeLimits = [15, 30, 60, 120];
  const wordLimits = [10, 25, 50, 100];

  const modes: { value: TestMode; label: string; icon: React.ReactNode }[] = [
    { value: 'time',   label: 'time',   icon: <IconClock /> },
    { value: 'words',  label: 'words',  icon: <IconText /> },
    { value: 'quote',  label: 'quote',  icon: <IconQuote /> },
    { value: 'zen',    label: 'zen',    icon: <IconLeaf /> },
    { value: 'custom', label: 'custom', icon: <IconPencil /> },
  ];

  const handleModeClick = (m: TestMode) => {
    if (m === 'custom') setShowCustomModal(true);
    setMode(m);
  };

  return (
    <>
      <div
        className="flex items-center gap-0.5 font-mono"
        style={{
          backgroundColor: PILL_BG,
          borderRadius: 8,
          padding: '4px 6px',
          fontSize: 12,
        }}
      >
        {/* Group 1: toggles */}
        <PillBtn
          label="@ punctuation"
          active={punctuation}
          onClick={() => updateSettings({ punctuation: !punctuation })}
        />
        <PillBtn
          label="# numbers"
          active={numbers}
          onClick={() => updateSettings({ numbers: !numbers })}
        />

        <Divider />

        {/* Group 2: modes */}
        {modes.map(m => (
          <PillBtn
            key={m.value}
            label={m.label}
            active={mode === m.value}
            icon={m.icon}
            onClick={() => handleModeClick(m.value)}
          />
        ))}

        {/* Group 3: count selectors — time/words modes */}
        {(mode === 'time' || mode === 'words') && (
          <>
            <Divider />
            {(mode === 'time' ? timeLimits : wordLimits).map(n => (
              <PillBtn
                key={n}
                label={String(n)}
                active={(mode === 'time' ? timeLimit : wordLimit) === n}
                onClick={() => mode === 'time' ? setTimeLimit(n) : setWordLimit(n)}
              />
            ))}
          </>
        )}

      </div>

      <CustomTextModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onSubmit={(text) => { setCustomText(text); setMode('custom'); }}
      />
    </>
  );
}

function PillBtn({
  label, active, onClick, icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-2.5 py-0.5 rounded transition-colors font-mono"
      style={{
        backgroundColor: active ? ACTIVE_BG : 'transparent',
        color: active ? ACTIVE_COLOR : DEFAULT_COLOR,
        borderRadius: 5,
        fontSize: 12,
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.color = HOVER_COLOR; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.color = DEFAULT_COLOR; }}
    >
      {icon && <span style={{ opacity: 0.8 }}>{icon}</span>}
      {label}
    </button>
  );
}

function Divider() {
  return (
    <div
      className="mx-1 shrink-0"
      style={{ width: 1, height: 18, backgroundColor: DIVIDER, opacity: 0.3 }}
    />
  );
}

// ── Icons (12×12) ────────────────────────────────────────────────
function IconClock() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}
function IconText() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M4 7V4h16v3M9 20h6M12 4v16" />
    </svg>
  );
}
function IconQuote() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
    </svg>
  );
}
function IconLeaf() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}
function IconPencil() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}
function IconBook() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
function IconFire() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}
function IconMusic() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}
