import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { updateUserProfile } from '../../utils/firestoreService';

function fmt(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function ProfileHeader() {
  const { currentUser, userProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [nameVal, setNameVal] = useState('');

  if (!currentUser || !userProfile) return null;

  const avatarUrl = userProfile.photoURL || currentUser.photoURL || null;
  const displayName = userProfile.username || userProfile.displayName;
  const initials = displayName[0].toUpperCase();
  const xpPct = Math.min(100, (userProfile.xp / userProfile.xpToNextLevel) * 100);

  const saveName = async () => {
    if (!nameVal.trim()) return;
    try {
      await updateUserProfile(currentUser.uid, { displayName: nameVal.trim() });
      toast.success('name updated');
      setEditing(false);
    } catch { toast.error('failed to update name'); }
  };

  return (
    <div className="rounded-xl p-6 relative" style={{ backgroundColor: 'var(--bg2)' }}>
      {/* Edit button */}
      <button
        onClick={() => { setEditing(!editing); setNameVal(userProfile.displayName); }}
        className="absolute top-4 right-4 p-1.5 rounded transition-colors"
        style={{ color: 'var(--sub)', background: 'none', border: 'none', cursor: 'pointer' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--sub)')}
        title="Edit display name"
      >
        <IconPencil />
      </button>

      <div className="flex items-start gap-5">
        {/* Avatar */}
        {avatarUrl ? (
          <img src={avatarUrl} alt="avatar" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div className="flex items-center justify-center font-mono font-medium shrink-0"
            style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: 'var(--main)', color: 'var(--bg)', fontSize: 28 }}>
            {initials}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-2 mb-2">
              <input
                value={nameVal} onChange={e => setNameVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditing(false); }}
                className="font-mono font-medium outline-none rounded px-2 py-1"
                style={{ color: 'var(--text)', backgroundColor: 'var(--bg)', border: '1px solid var(--sub)', fontSize: 20, maxWidth: 220 }}
                autoFocus
              />
              <button onClick={saveName} className="font-mono text-sm px-3 py-1 rounded"
                style={{ backgroundColor: 'var(--main)', color: 'var(--bg)', border: 'none', cursor: 'pointer' }}>
                save
              </button>
              <button onClick={() => setEditing(false)} className="font-mono text-sm"
                style={{ color: 'var(--sub)', background: 'none', border: 'none', cursor: 'pointer' }}>
                cancel
              </button>
            </div>
          ) : (
            <div className="font-mono font-medium mb-1" style={{ color: 'var(--text)', fontSize: 22 }}>{displayName}</div>
          )}
          <div className="font-mono" style={{ color: 'var(--sub)', fontSize: 13 }}>joined {fmtDate(userProfile.createdAt)}</div>
          <div className="flex items-center gap-1.5 mt-0.5 font-mono" style={{ color: 'var(--sub)', fontSize: 13 }}>
            {userProfile.currentStreak > 0 && <span style={{ color: 'var(--main)' }}>🔥</span>}
            current streak: {userProfile.currentStreak ?? 0} days
          </div>

          {/* XP bar */}
          <div className="mt-3" style={{ maxWidth: 340 }}>
            <div className="flex justify-between mb-1 font-mono" style={{ fontSize: 12 }}>
              <span style={{ color: 'var(--main)' }}>level {userProfile.level}</span>
              <span style={{ color: 'var(--sub)' }}>{userProfile.xp} / {userProfile.xpToNextLevel} xp</span>
            </div>
            <div style={{ height: 4, backgroundColor: 'color-mix(in srgb, var(--sub) 30%, transparent)', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${xpPct}%`, backgroundColor: 'var(--main)', borderRadius: 2, transition: 'width 0.5s' }} />
            </div>
          </div>
        </div>

        {/* Stat columns */}
        <div className="hidden md:flex items-center gap-8 shrink-0">
          <StatCol label="tests started"   value={String(userProfile.testsStarted ?? userProfile.totalTests)} />
          <StatCol label="tests completed" value={String(userProfile.totalTests)} />
          <StatCol label="time typing"     value={fmt(userProfile.totalTimeTyping)} />
        </div>
      </div>
    </div>
  );
}

function StatCol({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center font-mono">
      <div style={{ color: 'var(--text)', fontSize: 26, fontWeight: 500 }}>{value}</div>
      <div style={{ color: 'var(--sub)', fontSize: 11, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function IconPencil() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}
