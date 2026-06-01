import type { FunboxOption } from '../../data/funbox/funbox';

interface FunboxCardProps {
  funbox: FunboxOption;
  active: boolean;
  onClick: () => void;
}

export function FunboxCard({ funbox, active, onClick }: FunboxCardProps) {
  return (
    <button
      onClick={onClick}
      title={funbox.description}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        height: 44,
        padding: '0 14px',
        backgroundColor: active
          ? 'color-mix(in srgb, var(--main) 15%, transparent)'
          : 'var(--bg2)',
        border: `0.5px solid ${active ? 'var(--main)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 8,
        color: active ? 'var(--main)' : 'var(--sub)',
        fontSize: 13,
        fontFamily: "'Roboto Mono', var(--font-mono), monospace",
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        transition: 'color 120ms, background-color 120ms, border-color 120ms',
        outline: 'none',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.color = 'var(--text)';
          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)';
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.color = 'var(--sub)';
          (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg2)';
        }
      }}
    >
      <span style={{ fontSize: 15, flexShrink: 0 }}>{funbox.icon}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{funbox.name}</span>
      {funbox.requiresSetup && (
        <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.6, flexShrink: 0 }}>setup</span>
      )}
    </button>
  );
}
