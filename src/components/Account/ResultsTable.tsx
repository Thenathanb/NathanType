import { useEffect, useState } from 'react';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import type { TimeRange, ModeFilter } from './ResultFilters';

interface TestRow {
  id: string;
  timestamp: number;
  mode: string;
  modeOption: number;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
}

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
}
function timeRangeCutoff(r: TimeRange): number {
  const d = { day: 1, week: 7, month: 30, '3month': 90, all: 36500 }[r];
  return Date.now() - d * 86_400_000;
}

export function ResultsTable({ timeRange, modeFilter }: { timeRange: TimeRange; modeFilter: ModeFilter }) {
  const { currentUser } = useAuth();
  const [rows, setRows] = useState<TestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    setError('');
    const cutoff = timeRangeCutoff(timeRange);
    const q = query(
      collection(db, 'testResults', currentUser.uid, 'results'),
      where('timestamp', '>=', cutoff),
      orderBy('timestamp', 'desc'),
      limit(100),
    );
    getDocs(q)
      .then(snap => setRows(snap.docs.map(d => ({ id: d.id, ...d.data() } as TestRow))))
      .catch(err => {
        console.error('ResultsTable load failed:', err);
        const msg = (err as { code?: string }).code === 'permission-denied'
          ? 'permission denied — update your Firestore rules for testResults'
          : `failed to load results (${(err as Error).message ?? 'unknown'})`;
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [currentUser, timeRange, modeFilter]);

  if (loading) return <div className="font-mono" style={{ color: 'var(--sub)', fontSize: 13, padding: '16px 0' }}>loading results…</div>;

  if (error) return (
    <div className="font-mono rounded px-3 py-2" style={{ backgroundColor: 'color-mix(in srgb, var(--error) 10%, transparent)', color: 'var(--error)', fontSize: 12, marginTop: 8 }}>
      {error}
    </div>
  );

  if (!rows.length) return <div className="font-mono" style={{ color: 'var(--sub)', fontSize: 13, padding: '16px 0' }}>no results found</div>;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="w-full font-mono" style={{ borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {['date', 'mode', 'wpm', 'raw', 'acc', 'consistency'].map(c => (
              <th key={c} className="text-left py-2 uppercase tracking-wider"
                style={{ color: 'var(--sub)', fontSize: 11, fontWeight: 400, borderBottom: '0.5px solid rgba(255,255,255,0.05)', paddingRight: 20 }}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} style={{ backgroundColor: i % 2 === 1 ? 'rgba(255,255,255,0.02)' : 'transparent', height: 40, borderBottom: '0.5px solid rgba(255,255,255,0.04)' }}>
              <td style={{ color: 'var(--sub)', paddingRight: 20 }}>{fmtDate(r.timestamp)}</td>
              <td style={{ color: 'var(--sub)', paddingRight: 20 }}>{r.mode} {r.modeOption}</td>
              <td style={{ color: 'var(--main)', paddingRight: 20, fontWeight: 500 }}>{r.wpm}</td>
              <td style={{ color: 'var(--text)', paddingRight: 20 }}>{r.rawWpm}</td>
              <td style={{ color: 'var(--text)', paddingRight: 20 }}>{r.accuracy}%</td>
              <td style={{ color: 'var(--text)', paddingRight: 20 }}>{r.consistency}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
