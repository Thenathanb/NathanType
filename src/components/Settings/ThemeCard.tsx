import type { NTTheme } from '../../data/themes/themes';

interface ThemeCardProps {
  theme: NTTheme;
  active: boolean;
  onClick: () => void;
}

export function ThemeCard({ theme, active, onClick }: ThemeCardProps) {
  return (
    <button
      onClick={onClick}
      title={theme.name}
      style={{
        height: 56,
        backgroundColor: theme.bg,
        borderRadius: 8,
        border: `2px solid ${active ? theme.main : 'transparent'}`,
        cursor: 'pointer',
        padding: '6px 10px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 150ms, border-color 150ms',
        outline: 'none',
        width: '100%',
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
    >
      <span style={{
        color: theme.main,
        fontSize: 12,
        fontFamily: "'Roboto Mono', monospace",
        fontWeight: 500,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: 'block',
        textAlign: 'left',
      }}>
        {theme.name}
      </span>
      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
        {[theme.main, theme.text, theme.sub].map((c, i) => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: c, flexShrink: 0 }} />
        ))}
      </div>
    </button>
  );
}
