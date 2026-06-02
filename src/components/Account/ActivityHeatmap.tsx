import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';

type Range = '12m' | '6m' | '30d';

function colorFor(count: number): string {
  if (count === 0)  return 'rgba(255,255,255,0.05)';
  if (count <= 2)   return 'color-mix(in srgb, var(--main) 25%, transparent)';
  if (count <= 5)   return 'color-mix(in srgb, var(--main) 50%, transparent)';
  if (count <= 9)   return 'color-mix(in srgb, var(--main) 75%, transparent)';
  return 'var(--main)';
}

function toDateKey(ts: number) {
  return new Date(ts).toISOString().slice(0, 10);
}

export function ActivityHeatmap() {
  const { currentUser } = useAuth();
  const [range, setRange] = useState<Range>('12m');
  const [dayCounts, setDayCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    setError('');
    const days = range === '12m' ? 365 : range === '6m' ? 182 : 30;
    const cutoff = Date.now() - days * 86_400_000;

    getDocs(query(
      collection(db, 'testResults', currentUser.uid, 'results'),
      where('timestamp', '>=', cutoff),
      orderBy('timestamp', 'asc'),
    )).then(snap => {
      const counts: Record<string, number> = {};
      snap.forEach(d => {
        const key = toDateKey((d.data() as { timestamp: number }).timestamp);
        counts[key] = (counts[key] ?? 0) + 1;
      });
      setDayCounts(counts);
      setTotal(snap.size);
    }).catch(err => {
      console.error('ActivityHeatmap load failed:', err);
      const msg = (err as { code?: string }).code === 'permission-denied'
        ? 'permission denied — check your Firestore rules for testResults collection'
        : `failed to load activity (${(err as Error).message ?? 'unknown error'})`;
      setError(msg);
    }).finally(() => setLoading(false));
  }, [currentUser, range]);

  const cells = useMemo(() => {
    const days = range === '12m' ? 365 : range === '6m' ? 182 : 30;
    const end = new Date(); end.setHours(23, 59, 59, 999);
    const start = new Date(end.getTime() - days * 86_400_000);
    const startDay = new Date(start); startDay.setDate(start.getDate() - start.getDay());
    const rows: { date: string; count: number }[][] = Array.from({ length: 7 }, () => []);
    const cursor = new Date(startDay);
    while (cursor <= end) {
      const iso = cursor.toISOString().slice(0, 10);
      rows[cursor.getDay()].push({ date: iso, count: dayCounts[iso] ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    return rows;
  }, [dayCounts, range]);

  const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', ''];
  const LEGEND_STOPS = [0, 1, 3, 6, 10];

  return (
    <div className="rounded-xl p-5 font-mono" style={{ backgroundColor: 'var(--bg2)', position: 'relative' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <select
            value={range} onChange={e => setRange(e.target.value as Range)}
            className="font-mono outline-none rounded px-2 py-1"
            style={{ backgroundColor: 'var(--bg)', color: 'var(--text)', border: '1px solid color-mix(in srgb, var(--sub) 40%, transparent)', fontSize: 12, cursor: 'pointer' }}
          >
            <option value="12m">last 12 months</option>
            <option value="6m">last 6 months</option>
            <option value="30d">last 30 days</option>
          </select>
          <span style={{ color: 'var(--sub)', fontSize: 13 }}>
            {loading ? 'loading…' : `${total} test${total !== 1 ? 's' : ''}`}
          </span>
        </div>
        <div className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'var(--sub)' }}>
          <span>less</span>
          {LEGEND_STOPS.map((c, i) => (
            <div key={i} style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: colorFor(c) }} />
          ))}
          <span>more</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-3 font-mono rounded px-3 py-2" style={{ backgroundColor: 'color-mix(in srgb, var(--error) 10%, transparent)', color: 'var(--error)', fontSize: 12 }}>
          {error}
        </div>
      )}

      {/* Grid */}
      {!error && (
        <div className="flex gap-1.5 overflow-x-auto">
          <div className="flex flex-col gap-0.5 shrink-0">
            {DAY_LABELS.map((l, i) => (
              <div key={i} style={{ height: 12, lineHeight: '12px', fontSize: 10, color: 'var(--sub)', width: 28 }}>{l}</div>
            ))}
          </div>
          {cells[0].map((_, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {cells.map((row, di) => {
                const cell = row[wi];
                if (!cell) return <div key={di} style={{ width: 12, height: 12 }} />;
                const date = new Date(cell.date + 'T12:00:00');
                const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                return (
                  <div
                    key={di}
                    style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: colorFor(cell.count), cursor: 'default' }}
                    onMouseEnter={e => {
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      setTooltip({ text: `${cell.count} test${cell.count !== 1 ? 's' : ''} on ${label}`, x: rect.left, y: rect.top });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      )}

      <div style={{ color: 'var(--sub)', fontSize: 11, marginTop: 10 }}>
        Note: All activity data is using UTC time.
      </div>

      {tooltip && (
        <div
          className="fixed font-mono rounded px-2 py-1 pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y - 28, backgroundColor: 'var(--bg)', color: 'var(--text)', fontSize: 12, zIndex: 9999, border: '0.5px solid rgba(255,255,255,0.1)' }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
