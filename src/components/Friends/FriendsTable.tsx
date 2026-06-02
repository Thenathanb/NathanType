import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { removeFriend } from '../../utils/firestoreService';
import { useAuth, getPbEntry, getCompletedTests, getStartedTests, getTimeTyping, getStreakLength } from '../../context/AuthContext';
import type { UserProfile } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface FriendRow {
  uid: string;
  since: number;
  profile: UserProfile;
}

type SortKey = 'name' | 'level' | 'tests' | 'time' | 'streak' | 'pb15' | 'pb60';

function fmt(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
function ago(ms: number) {
  const d = Math.floor((Date.now() - ms) / 86_400_000);
  if (d < 30)  return `${d}d`;
  if (d < 365) return `${Math.floor(d / 30)}mo`;
  return `${Math.floor(d / 365)}y`;
}

export function FriendsTable() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<FriendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('level');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [hoverUid, setHoverUid] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser || !userProfile) return;
    const friends = userProfile.friends ?? [];
    if (!friends.length) { setLoading(false); return; }
    Promise.all(
      friends.map(async f => {
        const snap = await getDoc(doc(db, 'users', f.uid));
        if (!snap.exists()) return null;
        return { uid: f.uid, since: f.since, profile: snap.data() as UserProfile } as FriendRow;
      })
    ).then(res => setRows(res.filter(Boolean) as FriendRow[]))
     .catch(console.error)
     .finally(() => setLoading(false));
  }, [currentUser, userProfile]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sorted = [...rows].sort((a, b) => {
    if (sortKey === 'name') {
      const an = a.profile.username || a.profile.displayName;
      const bn = b.profile.username || b.profile.displayName;
      return sortDir === 'asc' ? an.localeCompare(bn) : bn.localeCompare(an);
    }
    let av = 0, bv = 0;
    if (sortKey === 'level')  { av = a.profile.level;                                 bv = b.profile.level; }
    if (sortKey === 'tests')  { av = getCompletedTests(a.profile);                    bv = getCompletedTests(b.profile); }
    if (sortKey === 'time')   { av = getTimeTyping(a.profile);                        bv = getTimeTyping(b.profile); }
    if (sortKey === 'streak') { av = getStreakLength(a.profile);                      bv = getStreakLength(b.profile); }
    if (sortKey === 'pb15')   { av = getPbEntry(a.profile, 'time', '15')?.wpm ?? 0;  bv = getPbEntry(b.profile, 'time', '15')?.wpm ?? 0; }
    if (sortKey === 'pb60')   { av = getPbEntry(a.profile, 'time', '60')?.wpm ?? 0;  bv = getPbEntry(b.profile, 'time', '60')?.wpm ?? 0; }
    return sortDir === 'asc' ? av - bv : bv - av;
  });

  const SH = ({ k, label }: { k: SortKey; label: string }) => (
    <th onClick={() => handleSort(k)} className="text-left py-2 uppercase tracking-wider select-none"
      style={{ color: sortKey === k ? 'var(--main)' : 'var(--sub)', fontSize: 11, fontWeight: 400, cursor: 'pointer', paddingRight: 16, borderBottom: '0.5px solid rgba(255,255,255,0.08)', whiteSpace: 'nowrap' }}>
      {label}{sortKey === k ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
    </th>
  );

  const remove = async (uid: string, name: string) => {
    if (!currentUser) return;
    try {
      await removeFriend(currentUser.uid, uid);
      setRows(r => r.filter(f => f.uid !== uid));
      toast.success(`removed ${name}`);
    } catch { toast.error('failed to remove friend'); }
  };

  if (loading) return <div className="font-mono" style={{ color: 'var(--sub)', fontSize: 13 }}>loading friends…</div>;
  if (!rows.length && !userProfile?.friends?.length) return (
    <div className="font-mono text-center py-12" style={{ color: 'var(--sub)', fontSize: 14 }}>no friends yet — add some above</div>
  );

  const ownProfile = userProfile!;
  const ownName = ownProfile.username || ownProfile.displayName;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="w-full font-mono" style={{ borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            <SH k="name"   label="name *" />
            <th className="text-left py-2 uppercase tracking-wider"
              style={{ color: 'var(--sub)', fontSize: 11, fontWeight: 400, paddingRight: 16, borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
              friends for
            </th>
            <SH k="level"  label="level" />
            <SH k="tests"  label="tests" />
            <SH k="time"   label="time typing" />
            <SH k="streak" label="streak" />
            <SH k="pb15"   label="time 15 pb" />
            <SH k="pb60"   label="time 60 pb" />
            <th style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)', width: 24 }} />
          </tr>
        </thead>
        <tbody>
          {sorted.map(f => {
            const name = f.profile.username || f.profile.displayName;
            const init = name[0].toUpperCase();
            return (
              <tr key={f.uid} style={{ height: 44, borderBottom: '0.5px solid rgba(255,255,255,0.04)' }}
                onMouseEnter={() => setHoverUid(f.uid)} onMouseLeave={() => setHoverUid(null)}>
                <td style={{ paddingRight: 16 }}>
                  <div className="flex items-center gap-2">
                    {f.profile.photoURL ? (
                      <img src={f.profile.photoURL} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div className="flex items-center justify-center font-mono font-medium"
                        style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: 'var(--main)', color: 'var(--bg)', fontSize: 11 }}>
                        {init}
                      </div>
                    )}
                    <button onClick={() => navigate(`/profile/${f.profile.username || f.uid}`)}
                      style={{ color: 'var(--text)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--main)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text)')}>
                      {name}
                    </button>
                  </div>
                </td>
                <td style={{ color: 'var(--sub)', paddingRight: 16 }}>{ago(f.since)}</td>
                <td style={{ color: 'var(--text)', paddingRight: 16 }}>{f.profile.level}</td>
                <td style={{ color: 'var(--sub)', paddingRight: 16 }}>{getCompletedTests(f.profile)}/{getStartedTests(f.profile)}</td>
                <td style={{ color: 'var(--sub)', paddingRight: 16 }}>{fmt(getTimeTyping(f.profile))}</td>
                <td style={{ paddingRight: 16 }}>
                  {getStreakLength(f.profile) > 0
                    ? <span><span style={{ color: 'var(--main)' }}>🔥</span> <span style={{ color: 'var(--text)' }}>{getStreakLength(f.profile)}</span></span>
                    : <span style={{ color: 'var(--sub)' }}>—</span>}
                </td>
                <td style={{ color: 'var(--text)', paddingRight: 16 }}>{getPbEntry(f.profile, 'time', '15')?.wpm || '—'}</td>
                <td style={{ color: 'var(--text)', paddingRight: 16 }}>{getPbEntry(f.profile, 'time', '60')?.wpm || '—'}</td>
                <td>
                  {hoverUid === f.uid && (
                    <button onClick={() => remove(f.uid, name)} title="remove friend"
                      style={{ color: 'var(--sub)', background: 'none', border: 'none', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--error)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--sub)')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="17" y1="8" x2="23" y2="14" /><line x1="23" y1="8" x2="17" y2="14" />
                      </svg>
                    </button>
                  )}
                </td>
              </tr>
            );
          })}

          {/* Own row */}
          <tr style={{ height: 44, backgroundColor: 'color-mix(in srgb, var(--main) 5%, transparent)', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
            <td style={{ paddingRight: 16 }}>
              <div className="flex items-center gap-2">
                {ownProfile.photoURL ? (
                  <img src={ownProfile.photoURL} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div className="flex items-center justify-center font-mono font-medium"
                    style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: 'var(--main)', color: 'var(--bg)', fontSize: 11 }}>
                    {ownName[0].toUpperCase()}
                  </div>
                )}
                <span style={{ color: 'var(--main)', fontSize: 13 }}>{ownName}</span>
              </div>
            </td>
            <td style={{ color: 'var(--sub)', paddingRight: 16 }}>—</td>
            <td style={{ color: 'var(--main)', paddingRight: 16 }}>{ownProfile.level}</td>
            <td style={{ color: 'var(--main)', paddingRight: 16 }}>{getCompletedTests(ownProfile)}/{getStartedTests(ownProfile)}</td>
            <td style={{ color: 'var(--main)', paddingRight: 16 }}>{fmt(getTimeTyping(ownProfile))}</td>
            <td style={{ paddingRight: 16 }}>
              {getStreakLength(ownProfile) > 0
                ? <span><span style={{ color: 'var(--main)' }}>🔥</span> <span style={{ color: 'var(--main)' }}>{getStreakLength(ownProfile)}</span></span>
                : <span style={{ color: 'var(--sub)' }}>—</span>}
            </td>
            <td style={{ color: 'var(--main)', paddingRight: 16 }}>{getPbEntry(ownProfile, 'time', '15')?.wpm || '—'}</td>
            <td style={{ color: 'var(--main)', paddingRight: 16 }}>{getPbEntry(ownProfile, 'time', '60')?.wpm || '—'}</td>
            <td />
          </tr>
        </tbody>
      </table>
      <p className="font-mono mt-3" style={{ color: 'var(--sub)', fontSize: 11 }}>* click a name to view their public profile</p>
    </div>
  );
}
