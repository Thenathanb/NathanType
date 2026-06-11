import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { getUserByUsername } from '../utils/firestoreService';
import type { UserProfile } from '../context/AuthContext';
import { getPbEntry, getStreakLength, getAddedAt } from '../context/AuthContext';
import { ActivityHeatmap } from '../components/Account/ActivityHeatmap';
import { useAuth } from '../context/AuthContext';

function PersonalBestsReadOnly({ profile }: { profile: UserProfile }) {
  const timeKeys = [
    { mode2: '15', label: '15s' }, { mode2: '30', label: '30s' },
    { mode2: '60', label: '60s' }, { mode2: '120', label: '120s' },
  ];
  const wordKeys = [
    { mode2: '10', label: '10' }, { mode2: '25', label: '25' },
    { mode2: '50', label: '50' }, { mode2: '100', label: '100' },
  ];
  const Card = ({ title, cols, modeType }: { title: string; cols: { mode2: string; label: string }[]; modeType: 'time' | 'words' }) => (
    <div className="rounded-xl p-5 font-mono" style={{ backgroundColor: 'var(--bg2)' }}>
      <div style={{ color: 'var(--sub)', fontSize: 13, marginBottom: 16 }}>{title}</div>
      <div className="grid grid-cols-4 gap-3">
        {cols.map(c => {
          const pb = getPbEntry(profile, modeType, c.mode2);
          const wpm = pb?.wpm ?? 0;
          return (
            <div key={c.mode2} className="text-center">
              <div style={{ color: 'var(--sub)', fontSize: 11, marginBottom: 4 }}>{c.label}</div>
              <div style={{ color: wpm > 0 ? 'var(--text)' : 'var(--bg2)', fontSize: 26, fontWeight: 500 }}>
                {wpm > 0 ? wpm : '—'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card title="time" cols={timeKeys} modeType="time" />
      <Card title="words" cols={wordKeys} modeType="words" />
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

  if (loading) return <div className="flex-1 flex items-center justify-center font-mono" style={{ color: 'var(--sub)' }}>loading…</div>;
  if (notFound || !profile) return (
    <div className="flex-1 flex items-center justify-center font-mono" style={{ color: 'var(--sub)', fontSize: 18 }}>user not found</div>
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
          <div className="rounded px-3 py-2 text-center" style={{ backgroundColor: 'color-mix(in srgb, var(--main) 10%, transparent)', color: 'var(--main)', fontSize: 12 }}>
            this is your public profile — visible to everyone
          </div>
        )}

        {/* Header */}
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg2)' }}>
          <div className="flex items-start gap-5">
            {profile.photoURL ? (
              <img src={profile.photoURL} alt="avatar" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div className="flex items-center justify-center font-mono font-medium shrink-0"
                style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: 'var(--main)', color: 'var(--bg)', fontSize: 28 }}>{initials}</div>
            )}
            <div className="flex-1">
              <div style={{ color: 'var(--text)', fontSize: 22, fontWeight: 500 }}>{displayName}</div>
              <div style={{ color: 'var(--sub)', fontSize: 13, marginTop: 2 }}>joined {fmtDate(getAddedAt(profile))}</div>
              {getStreakLength(profile) > 0 && (
                <div style={{ color: 'var(--sub)', fontSize: 13, marginTop: 2 }}>{getStreakLength(profile)} day streak</div>
              )}
              <div className="mt-3" style={{ maxWidth: 280 }}>
                <div className="flex justify-between mb-1" style={{ fontSize: 12 }}>
                  <span style={{ color: 'var(--main)' }}>level {profile.level}</span>
                  <span style={{ color: 'var(--sub)' }}>{profile.xp} / {profile.xpToNextLevel} xp</span>
                </div>
                <div style={{ height: 4, backgroundColor: 'color-mix(in srgb, var(--sub) 30%, transparent)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${xpPct}%`, backgroundColor: 'var(--main)', borderRadius: 2 }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <PersonalBestsReadOnly profile={profile} />

        {isOwnProfile && <ActivityHeatmap />}

      </div>
    </div>
  );
}
