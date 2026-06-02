import { useState } from 'react';

interface ActionIconProps {
  icon: React.ReactNode;
  tooltip: string;
  onClick: () => void;
  shortcut?: string;
}

function ActionIcon({ icon, tooltip, onClick, shortcut }: ActionIconProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: hovered ? 'var(--main)' : 'var(--sub)',
          padding: 6,
          borderRadius: 6,
          transition: 'color 0.15s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </button>
      {hovered && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'var(--bg2)',
          border: '0.5px solid rgba(255,255,255,0.1)',
          borderRadius: 5,
          padding: '4px 10px',
          fontSize: 11,
          color: 'var(--sub)',
          whiteSpace: 'nowrap',
          fontFamily: 'var(--font-mono, monospace)',
          zIndex: 10,
          pointerEvents: 'none',
        }}>
          {tooltip}
          {shortcut && <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 6 }}>{shortcut}</span>}
        </div>
      )}
    </div>
  );
}

interface ActionIconsProps {
  onNext: () => void;
  onRestart: () => void;
  onToggleWords: () => void;
  isLoggedIn?: boolean;
}

export function ActionIcons({ onNext, onRestart, onToggleWords, isLoggedIn }: ActionIconsProps) {
  const sz = 22;
  const stroke = 'currentColor';
  const sw = 1.8;

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      gap: 28,
      marginTop: 24,
    }}>
      <ActionIcon
        tooltip="next test"
        shortcut="tab+enter"
        onClick={onNext}
        icon={
          <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        }
      />
      <ActionIcon
        tooltip="restart test"
        shortcut="tab"
        onClick={onRestart}
        icon={
          <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round">
            <path d="M1 4v6h6" />
            <path d="M3.51 15a9 9 0 1 0 .49-3" />
          </svg>
        }
      />
      <ActionIcon
        tooltip="toggle words history"
        shortcut="w"
        onClick={onToggleWords}
        icon={
          <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round">
            <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
          </svg>
        }
      />
      {isLoggedIn && (
        <ActionIcon
          tooltip="report"
          onClick={() => {}}
          icon={
            <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          }
        />
      )}
    </div>
  );
}
