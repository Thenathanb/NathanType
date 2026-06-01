import toast from 'react-hot-toast';

export type TimeRange = 'day' | 'week' | 'month' | '3month' | 'all';
export type ModeFilter = 'all' | 'current';

interface ResultFiltersProps {
  open: boolean;
  onToggle: () => void;
  timeRange: TimeRange;
  onTimeRange: (r: TimeRange) => void;
  modeFilter: ModeFilter;
  onModeFilter: (f: ModeFilter) => void;
}

const TIME_OPTS: { value: TimeRange; label: string }[] = [
  { value: 'day',    label: 'last day' },
  { value: 'week',   label: 'last week' },
  { value: 'month',  label: 'last month' },
  { value: '3month', label: 'last 3 months' },
  { value: 'all',    label: 'all time' },
];

const MODE_OPTS: { value: ModeFilter; label: string }[] = [
  { value: 'all',     label: 'all' },
  { value: 'current', label: 'current settings' },
];

export function ResultFilters({ open, onToggle, timeRange, onTimeRange, modeFilter, onModeFilter }: ResultFiltersProps) {
  return (
    <div className="font-mono">
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 mb-3 transition-opacity hover:opacity-70"
        style={{ color: '#e2b714', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <span style={{ transition: 'transform 150ms', transform: open ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
        filters
      </button>

      {open && (
        <div className="flex flex-col gap-3 mb-4">
          <FilterRow>
            {MODE_OPTS.map(o => (
              <FilterPill key={o.value} active={modeFilter === o.value} onClick={() => onModeFilter(o.value)}>{o.label}</FilterPill>
            ))}
            <FilterPill active={false} onClick={() => toast('coming soon', { icon: '🔜' })}>advanced</FilterPill>
            <FilterPill active={false} onClick={() => toast('coming soon', { icon: '🔜' })}>save as preset</FilterPill>
          </FilterRow>
          <FilterRow>
            {TIME_OPTS.map(o => (
              <FilterPill key={o.value} active={timeRange === o.value} onClick={() => onTimeRange(o.value)}>{o.label}</FilterPill>
            ))}
          </FilterRow>
        </div>
      )}
    </div>
  );
}

function FilterRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="font-mono rounded transition-colors"
      style={{
        backgroundColor: active ? '#e2b714' : '#2c2e31',
        color: active ? '#2c2e31' : '#646669',
        border: 'none',
        cursor: 'pointer',
        padding: '8px 18px',
        fontSize: 13,
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#d1d0ce'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#646669'; }}
    >
      {children}
    </button>
  );
}
