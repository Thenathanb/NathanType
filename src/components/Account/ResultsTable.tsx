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
  duration?: number;
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

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    const cutoff = timeRangeCutoff(timeRange);
    const q = query(
      collection(db, 'testResults', currentUser.uid, 'results'),
      where('timestamp', '>=', cutoff),
      orderBy('timestamp', 'desc'),
      limit(50),
    );
    getDocs(q)
      .then(snap => setRows(snap.docs.map(d => ({ id: d.id, ...d.data() } as TestRow))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentUser, timeRange, modeFilter]);

  if (loading) return <div className="font-mono" style={{ color: '#646669', fontSize: 13, padding: '16px 0' }}>loading results…</div>;
  if (!rows.length) return <div className="font-mono" style={{ color: '#646669', fontSize: 13, padding: '16px 0' }}>no results found</div>;

  const COLS = ['date', 'mode', 'wpm', 'raw', 'acc', 'consistency', 'duration'];

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="w-full font-mono" style={{ borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {COLS.map(c => (
              <th key={c} className="text-left py-2 uppercase tracking-wider"
                style={{ color: '#646669', fontSize: 11, fontWeight: 400, borderBottom: '0.5px solid rgba(255,255,255,0.05)', paddingRight: 20 }}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} style={{ backgroundColor: i % 2 === 1 ? 'rgba(255,255,255,0.02)' : 'transparent', height: 40, borderBottom: '0.5px solid rgba(255,255,255,0.04)' }}>
              <td style={{ color: '#646669', paddingRight: 20 }}>{fmtDate(r.timestamp)}</td>
              <td style={{ color: '#646669', paddingRight: 20 }}>{r.mode} {r.modeOption}</td>
              <td style={{ color: '#d1d0ce', paddingRight: 20 }}>{r.wpm}</td>
              <td style={{ color: '#d1d0ce', paddingRight: 20 }}>{r.rawWpm}</td>
              <td style={{ color: '#d1d0ce', paddingRight: 20 }}>{r.accuracy}%</td>
              <td style={{ color: '#d1d0ce', paddingRight: 20 }}>{r.consistency}%</td>
              <td style={{ color: '#646669' }}>{r.duration ? `${r.duration}s` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
