import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth, getPbEntry, getCompletedTests, getTimeTyping, getAddedAt } from '../context/AuthContext';

interface TestHistoryEntry {
  id: string;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  mode: string;
  modeOption: number;
  timestamp: number;
}

const PB_MODES = [
  { mode: 'time'  as const, mode2: '15',  label: 'time 15' },
  { mode: 'time'  as const, mode2: '30',  label: 'time 30' },
  { mode: 'time'  as const, mode2: '60',  label: 'time 60' },
  { mode: 'time'  as const, mode2: '120', label: 'time 120' },
  { mode: 'words' as const, mode2: '10',  label: 'words 10' },
  { mode: 'words' as const, mode2: '25',  label: 'words 25' },
  { mode: 'words' as const, mode2: '50',  label: 'words 50' },
  { mode: 'words' as const, mode2: '100', label: 'words 100' },
] as const;

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateShort(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function Profile() {
  const { currentUser, userProfile, loading } = useAuth();
  const [history, setHistory] = useState<TestHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'testResults', currentUser.uid, 'results'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    getDocs(q)
      .then((snap) => {
        const entries: TestHistoryEntry[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as TestHistoryEntry));
        setHistory(entries);
      })
      .catch((err) => console.error('Failed to fetch test history:', err))
      .finally(() => setHistoryLoading(false));
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center font-mono" style={{ color: '#646669' }}>
        loading…
      </div>
    );
  }

  if (!currentUser || !userProfile) return <Navigate to="/" />;

  const initials = (userProfile.displayName || userProfile.email || '?')[0].toUpperCase();
  const allPbEntries = PB_MODES.map(m => getPbEntry(userProfile, m.mode, m.mode2))
  const bestWpmOverall = allPbEntries.reduce((max, pb) => Math.max(max, pb?.wpm ?? 0), 0)
  const avgAccuracy = history.length > 0
    ? Math.round(history.reduce((sum, r) => sum + r.accuracy, 0) / history.length * 10) / 10
    : 0;

  const pbRows = PB_MODES.filter((_m, i) => (allPbEntries[i]?.wpm ?? 0) > 0);

  const xpPct = Math.min(100, (userProfile.xp / userProfile.xpToNextLevel) * 100);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-10 font-mono" style={{ animation: 'fadeIn 0.2s ease-out' }}>

      {/* ── Header ───────────────────────────────── */}
      <div className="flex items-start gap-6 mb-10">
        {/* Avatar */}
        {userProfile.photoURL ? (
          <img
            src={userProfile.photoURL}
            alt="avatar"
            className="rounded-full shrink-0"
            style={{ width: 72, height: 72, objectFit: 'cover' }}
          />
        ) : (
          <div
            className="flex items-center justify-center rounded-full shrink-0 font-medium text-2xl"
            style={{ width: 72, height: 72, backgroundColor: '#e2b714', color: '#2c2e31' }}
          >
            {initials}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <h1 className="font-medium" style={{ fontSize: 24, color: '#d1d0ce' }}>
            {userProfile.username || userProfile.displayName}
          </h1>
          {userProfile.username && (
            <p style={{ color: '#646669', fontSize: 13 }}>{userProfile.displayName}</p>
          )}
          <p style={{ color: '#646669', fontSize: 14 }}>{userProfile.email}</p>
          <div className="flex items-center gap-3 mt-1">
            <span
              className="px-2 py-0.5 rounded text-xs"
              style={{ backgroundColor: '#323437', color: '#646669', fontSize: 12 }}
            >
              signed in with {userProfile.provider}
            </span>
            <span style={{ color: '#646669', fontSize: 12 }}>
              member since {formatDate(getAddedAt(userProfile))}
            </span>
          </div>

          {/* Level + XP bar */}
          <div className="mt-2" style={{ minWidth: 240 }}>
            <div className="flex justify-between mb-1" style={{ fontSize: 13 }}>
              <span style={{ color: '#e2b714' }}>level {userProfile.level}</span>
              <span style={{ color: '#646669' }}>{userProfile.xp} / {userProfile.xpToNextLevel} xp</span>
            </div>
            <div className="rounded-full overflow-hidden" style={{ height: 6, backgroundColor: 'rgba(100,102,105,0.3)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${xpPct}%`, backgroundColor: '#e2b714' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats grid ───────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="total tests" value={String(getCompletedTests(userProfile))} />
        <StatCard label="time typing" value={formatTime(getTimeTyping(userProfile))} />
        <StatCard label="best wpm" value={bestWpmOverall > 0 ? String(bestWpmOverall) : '—'} accent />
        <StatCard
          label="avg accuracy"
          value={history.length > 0 ? `${avgAccuracy}%` : '—'}
        />
      </div>

      {/* ── Personal bests ───────────────────────── */}
      {pbRows.length > 0 && (
        <section className="mb-10">
          <SectionTitle>personal bests</SectionTitle>
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#323437' }}>
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(100,102,105,0.2)' }}>
                  <Th>mode</Th>
                  <Th>best wpm</Th>
                  <Th>date</Th>
                </tr>
              </thead>
              <tbody>
                {pbRows.map((m) => {
                  const pb = getPbEntry(userProfile, m.mode, m.mode2);
                  return (
                    <tr key={m.label} style={{ borderBottom: '1px solid rgba(100,102,105,0.1)' }}>
                      <Td>{m.label}</Td>
                      <Td accent>{pb?.wpm ?? '—'}</Td>
                      <Td>{pb?.timestamp ? formatDateShort(pb.timestamp) : '—'}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Recent test history ──────────────────── */}
      <section>
        <SectionTitle>recent tests</SectionTitle>
        {historyLoading ? (
          <p style={{ color: '#646669', fontSize: 14 }}>loading…</p>
        ) : history.length === 0 ? (
          <p style={{ color: '#646669', fontSize: 14 }}>no tests yet — complete a test to see your history here</p>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#323437' }}>
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(100,102,105,0.2)' }}>
                  <Th>date</Th>
                  <Th>mode</Th>
                  <Th>wpm</Th>
                  <Th>raw</Th>
                  <Th>accuracy</Th>
                  <Th>consistency</Th>
                </tr>
              </thead>
              <tbody>
                {history.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(100,102,105,0.1)' }}>
                    <Td>{formatDateShort(r.timestamp)}</Td>
                    <Td>{r.mode} {r.modeOption}</Td>
                    <Td accent>{r.wpm}</Td>
                    <Td>{r.rawWpm}</Td>
                    <Td>{r.accuracy}%</Td>
                    <Td>{r.consistency}%</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// ── Small sub-components ─────────────────────────────────────────

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#323437' }}>
      <div
        className="tabular-nums font-medium mb-1"
        style={{ fontSize: 32, color: accent ? '#e2b714' : '#d1d0ce', lineHeight: 1 }}
      >
        {value}
      </div>
      <div className="uppercase tracking-wider" style={{ color: '#646669', fontSize: 11 }}>{label}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="uppercase tracking-wider mb-3" style={{ color: '#646669', fontSize: 11 }}>
      {children}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left px-4 py-3 font-normal uppercase tracking-wider" style={{ color: '#646669', fontSize: 11 }}>
      {children}
    </th>
  );
}

function Td({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <td className="px-4 py-3" style={{ color: accent ? '#e2b714' : '#d1d0ce', fontSize: 13 }}>
      {children}
    </td>
  );
}
