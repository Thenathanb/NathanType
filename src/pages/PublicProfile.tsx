import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { getUserByUsername } from '../utils/firestoreService';
import type { UserProfile } from '../context/AuthContext';
import { ActivityHeatmap } from '../components/Account/ActivityHeatmap';
import { useAuth } from '../context/AuthContext';

// Re-use the same PB grid but read-only from passed profile
function PersonalBestsReadOnly({ profile }: { profile: UserProfile }) {
  const timeKeys = [
    { key: 'time15' as const, label: '15s' }, { key: 'time30' as const, label: '30s' },
    { key: 'time60' as const, label: '60s' }, { key: 'time120' as const, label: '120s' },
  ];
  const wordKeys = [
    { key: 'words10' as const, label: '10' }, { key: 'words25' as const, label: '25' },
    { key: 'words50' as const, label: '50' }, { key: 'words100' as const, label: '100' },
  ];
  const Card = ({ title, cols }: { title: string; cols: { key: keyof UserProfile['bestWpm']; label: string }[] }) => (
    <div className="rounded-xl p-5 font-mono" style={{ backgroundColor: '#323437' }}>
      <div style={{ color: '#646669', fontSize: 13, marginBottom: 16 }}>{title}</div>
      <div className="grid grid-cols-4 gap-3">
        {cols.map(c => (
          <div key={c.key} className="text-center">
            <div style={{ color: '#646669', fontSize: 11, marginBottom: 4 }}>{c.label}</div>
            <div style={{ color: profile.bestWpm[c.key] > 0 ? '#d1d0ce' : '#3a3c3f', fontSize: 26, fontWeight: 500 }}>
              {profile.bestWpm[c.key] > 0 ? profile.bestWpm[c.key] : '—'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card title="time" cols={timeKeys} />
      <Card title="words" cols={wordKeys} />
    </div>
  );
}

export function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) { setNotFound(true); setLoading(false); return; }
    getUserByUsername(username).then(result => {
      if (!result) { setNotFound(true); }
      else { setProfile(result.profile); setUid(result.uid); }
    }).catch(console.error).finally(() => setLoading(false));
  }, [username]);

  if (loading) return <div className="flex-1 flex items-center justify-center font-mono" style={{ color: '#646669' }}>loading…</div>;
  if (notFound || !profile) return (
    <div className="flex-1 flex items-center justify-center font-mono" style={{ color: '#646669', fontSize: 18 }}>user not found</div>
  );

  const displayName = profile.username || profile.displayName;
  const initials = displayName[0].toUpperCase();
  const xpPct = Math.min(100, (profile.xp / profile.xpToNextLevel) * 100);
  const isOwnProfile = currentUser?.uid === uid;

  function fmtDate(ts: number) { return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }

  return (
    <div className="page-scroll">
      <div className="w-full max-w-4xl mx-auto px-5 py-8 flex flex-col gap-4 font-mono" style={{ animation: 'fadeIn 0.2s ease-out' }}>

        {isOwnProfile && (
          <div className="rounded px-3 py-2 text-center" style={{ backgroundColor: 'rgba(226,183,20,0.1)', color: '#e2b714', fontSize: 12 }}>
            this is your public profile — visible to everyone
          </div>
        )}

        {/* Header */}
        <div className="rounded-xl p-6" style={{ backgroundColor: '#323437' }}>
          <div className="flex items-start gap-5">
            {profile.photoURL ? (
              <img src={profile.photoURL} alt="avatar" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div className="flex items-center justify-center font-mono font-medium shrink-0"
                style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: '#e2b714', color: '#2c2e31', fontSize: 28 }}>{initials}</div>
            )}
            <div className="flex-1">
              <div style={{ color: '#d1d0ce', fontSize: 22, fontWeight: 500 }}>{displayName}</div>
              <div style={{ color: '#646669', fontSize: 13, marginTop: 2 }}>joined {fmtDate(profile.createdAt)}</div>
              {(profile.currentStreak ?? 0) > 0 && (
                <div style={{ color: '#646669', fontSize: 13, marginTop: 2 }}>🔥 {profile.currentStreak} day streak</div>
              )}
              <div className="mt-3" style={{ maxWidth: 280 }}>
                <div className="flex justify-between mb-1" style={{ fontSize: 12 }}>
                  <span style={{ color: '#e2b714' }}>level {profile.level}</span>
                  <span style={{ color: '#646669' }}>{profile.xp} / {profile.xpToNextLevel} xp</span>
                </div>
                <div style={{ height: 4, backgroundColor: 'rgba(100,102,105,0.3)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${xpPct}%`, backgroundColor: '#e2b714', borderRadius: 2 }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <PersonalBestsReadOnly profile={profile} />

        {/* Heatmap only shown for own profile (requires auth for subcollection read) */}
        {isOwnProfile && <ActivityHeatmap />}

      </div>
    </div>
  );
}
