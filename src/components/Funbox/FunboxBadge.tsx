import { useSettingsStore } from '../../stores/settingsStore';
import { getFunboxById } from '../../data/funbox/funbox';

interface FunboxBadgeProps {
  onOpenSettings: () => void;
}

export function FunboxBadge({ onOpenSettings }: FunboxBadgeProps) {
  const { activeFunbox, setActiveFunbox } = useSettingsStore();
  if (!activeFunbox) return null;

  const funbox = getFunboxById(activeFunbox);
  if (!funbox) return null;

  return (
    <div
      className="flex items-center gap-2 font-mono"
      style={{
        marginTop: 8,
        marginBottom: 4,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        backgroundColor: 'var(--bg2)',
        border: '0.5px solid color-mix(in srgb, var(--main) 40%, transparent)',
        borderRadius: 20,
        fontSize: 12,
        color: 'var(--main)',
        userSelect: 'none',
      }}
    >
      <span style={{ fontSize: 13 }}>{funbox.icon}</span>

      <button
        onClick={onOpenSettings}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--main)',
          fontFamily: 'inherit',
          fontSize: 'inherit',
          padding: 0,
        }}
      >
        funbox: {funbox.name}
      </button>

      <button
        onClick={() => setActiveFunbox(null)}
        title="deactivate funbox"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--sub)',
          fontFamily: 'inherit',
          fontSize: 14,
          lineHeight: 1,
          padding: '0 2px',
          marginLeft: 2,
          transition: 'color 120ms',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--error)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--sub)')}
      >
        ×
      </button>
    </div>
  );
}
