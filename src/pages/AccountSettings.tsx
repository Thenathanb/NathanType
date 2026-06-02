import { useState } from 'react';
import { deleteUser, signOut, updateProfile } from 'firebase/auth';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { auth, db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../utils/firestoreService';
import { useNavigate } from 'react-router-dom';
import { ThemeSelector } from '../components/Settings/ThemeSelector';
import { FontSelector } from '../components/Settings/FontSelector';

// ── Shared primitives ────────────────────────────────────────────
function Card({ title, children, danger }: { title: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <div className="rounded-xl p-6 font-mono" style={{
      backgroundColor: 'var(--bg2)',
      border: danger ? '0.5px solid color-mix(in srgb, var(--error) 30%, transparent)' : 'none',
    }}>
      <h2 className="mb-5 font-medium uppercase tracking-widest" style={{ color: 'var(--sub)', fontSize: 11 }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 mb-5">
      <label style={{ color: 'var(--sub)', fontSize: 13 }}>{label}</label>
      {children}
    </div>
  );
}

function Inp({ value, onChange, type = 'text', placeholder }: { value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="font-mono outline-none rounded-lg"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)', border: '1px solid color-mix(in srgb, var(--sub) 40%, transparent)', padding: '9px 14px', fontSize: 13, maxWidth: 360, width: '100%' }}
    />
  );
}

function SaveBtn({ onClick, loading, label = 'save' }: { onClick: () => void; loading?: boolean; label?: string }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="font-mono rounded-lg transition-opacity hover:opacity-80"
      style={{ backgroundColor: 'var(--main)', color: 'var(--bg)', border: 'none', padding: '9px 20px', fontSize: 13, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
      {loading ? 'saving…' : label}
    </button>
  );
}

// ── 1. Profile ────────────────────────────────────────────────────
function ProfileSection() {
  const { currentUser, userProfile } = useAuth();
  const [name, setName]   = useState(userProfile?.displayName ?? '');
  const [photo, setPhoto] = useState(userProfile?.photoURL ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      await updateProfile(currentUser, { displayName: name, photoURL: photo || null });
      await updateUserProfile(currentUser.uid, { displayName: name, photoURL: photo || null });
      toast.success('profile updated');
    } catch { toast.error('failed to update profile'); }
    setSaving(false);
  };

  return (
    <Card title="profile">
      <Row label="display name"><Inp value={name} onChange={setName} placeholder="your display name" /></Row>
      <Row label="avatar url (or leave blank)"><Inp value={photo} onChange={setPhoto} placeholder="https://…" /></Row>
      {photo && <img src={photo} alt="preview" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', marginBottom: 16 }} />}
      <SaveBtn onClick={save} loading={saving} />
    </Card>
  );
}

// ── 2. Preferences ────────────────────────────────────────────────
function PreferencesSection() {
  const { currentUser, userProfile } = useAuth();
  const prefs = userProfile?.preferences ?? { defaultMode: 'time', defaultTimeLimit: 30, defaultWordLimit: 25, streakHourOffset: 0 };
  const [mode,   setMode]   = useState(prefs.defaultMode);
  const [time,   setTime]   = useState(String(prefs.defaultTimeLimit));
  const [words,  setWords]  = useState(String(prefs.defaultWordLimit));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      await updateUserProfile(currentUser.uid, {
        preferences: { ...prefs, defaultMode: mode, defaultTimeLimit: Number(time), defaultWordLimit: Number(words) }
      });
      toast.success('preferences saved');
    } catch { toast.error('failed to save'); }
    setSaving(false);
  };

  const Sel = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) => (
    <select value={value} onChange={e => onChange(e.target.value)} className="font-mono outline-none rounded-lg"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)', border: '1px solid color-mix(in srgb, var(--sub) 40%, transparent)', padding: '9px 14px', fontSize: 13, cursor: 'pointer' }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  return (
    <Card title="preferences">
      <Row label="default mode"><Sel value={mode} onChange={setMode} options={['time', 'words', 'quote', 'zen', 'content', 'meme', 'songs']} /></Row>
      <Row label="default time (seconds)"><Sel value={time} onChange={setTime} options={['15', '30', '60', '120']} /></Row>
      <Row label="default word count"><Sel value={words} onChange={setWords} options={['10', '25', '50', '100']} /></Row>
      <SaveBtn onClick={save} loading={saving} />
    </Card>
  );
}

// ── 3. Streak ────────────────────────────────────────────────────
function StreakSection() {
  const { currentUser, userProfile } = useAuth();
  const [offset, setOffset] = useState(String(userProfile?.preferences?.streakHourOffset ?? 0));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!currentUser || !userProfile) return;
    setSaving(true);
    try {
      await updateUserProfile(currentUser.uid, {
        preferences: { ...userProfile.preferences, streakHourOffset: Number(offset) }
      });
      toast.success('streak settings saved');
    } catch { toast.error('failed to save'); }
    setSaving(false);
  };

  return (
    <Card title="streak">
      <p style={{ color: 'var(--sub)', fontSize: 13, marginBottom: 16 }}>
        Streak resets at midnight UTC. Adjust by your timezone offset.
      </p>
      <Row label="hour offset (-12 to +12)">
        <input
          type="number" min={-12} max={12} value={offset} onChange={e => setOffset(e.target.value)}
          className="font-mono outline-none rounded-lg"
          style={{ backgroundColor: 'var(--bg)', color: 'var(--text)', border: '1px solid color-mix(in srgb, var(--sub) 40%, transparent)', padding: '9px 14px', fontSize: 13, width: 100 }}
        />
      </Row>
      <div style={{ color: 'var(--sub)', fontSize: 13, marginBottom: 16 }}>
        Current streak: <span style={{ color: 'var(--main)' }}>{userProfile?.currentStreak ?? 0} days</span>
        {' · '}Best: <span style={{ color: 'var(--text)' }}>{userProfile?.bestStreak ?? 0} days</span>
      </div>
      <SaveBtn onClick={save} loading={saving} />
    </Card>
  );
}

// ── 4. Danger zone ────────────────────────────────────────────────
function DangerZone() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState<'resetPbs' | 'resetAccount' | 'delete' | null>(null);
  const [loading, setLoading] = useState(false);

  const DangerBtn = ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button onClick={onClick}
      className="font-mono rounded-lg transition-colors"
      style={{ backgroundColor: 'transparent', color: 'var(--error)', border: '0.5px solid var(--error)', padding: '9px 20px', fontSize: 13, cursor: 'pointer' }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--error) 10%, transparent)')}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
      {label}
    </button>
  );

  const resetPbs = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        bestWpm: { time15: 0, time30: 0, time60: 0, time120: 0, words10: 0, words25: 0, words50: 0, words100: 0 },
        bestWpmDates: { time15: null, time30: null, time60: null, time120: null, words10: null, words25: null, words50: null, words100: null },
      });
      toast.success('personal bests reset');
    } catch { toast.error('failed to reset'); }
    setConfirm(null); setLoading(false);
  };

  const resetAccount = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        totalTests: 0, testsStarted: 0, totalTimeTyping: 0, currentStreak: 0, bestStreak: 0, lastTestDate: null,
        bestWpm: { time15: 0, time30: 0, time60: 0, time120: 0, words10: 0, words25: 0, words50: 0, words100: 0 },
        bestWpmDates: { time15: null, time30: null, time60: null, time120: null, words10: null, words25: null, words50: null, words100: null },
      });
      toast.success('account stats reset');
    } catch { toast.error('failed to reset'); }
    setConfirm(null); setLoading(false);
  };

  const deleteAccount = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid));
      await deleteUser(currentUser);
      toast.success('account deleted');
      navigate('/');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/requires-recent-login') {
        toast.error('please sign in again then retry');
        await signOut(auth);
        navigate('/');
      } else {
        toast.error('failed to delete account');
      }
    }
    setLoading(false);
  };

  return (
    <Card title="danger zone" danger>
      <div className="flex flex-col gap-3">
        {[
          { key: 'resetPbs' as const,     label: 'reset personal bests', desc: 'clears all your PB records',                   btn: 'reset pbs' },
          { key: 'resetAccount' as const, label: 'reset account',         desc: 'zeros all stats, keeps your account',          btn: 'reset account' },
          { key: 'delete' as const,       label: 'delete account',        desc: 'permanently removes your account and data',    btn: 'delete account' },
        ].map(item => (
          <div key={item.key} className="flex items-center justify-between">
            <div>
              <div style={{ color: 'var(--text)', fontSize: 14 }}>{item.label}</div>
              <div style={{ color: 'var(--sub)', fontSize: 12 }}>{item.desc}</div>
            </div>
            <DangerBtn label={item.btn} onClick={() => setConfirm(item.key)} />
          </div>
        ))}
      </div>

      {/* Confirmation modal */}
      {confirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => !loading && setConfirm(null)}>
          <div className="rounded-xl p-6 font-mono"
            style={{ backgroundColor: 'var(--bg2)', maxWidth: 360, width: '90%', border: '0.5px solid color-mix(in srgb, var(--error) 40%, transparent)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ color: 'var(--text)', fontSize: 15, marginBottom: 8 }}>are you sure?</div>
            <div style={{ color: 'var(--sub)', fontSize: 13, marginBottom: 20 }}>
              {confirm === 'delete' ? 'this permanently deletes your account and cannot be undone.' : 'this action cannot be undone.'}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { if (confirm === 'resetPbs') resetPbs(); else if (confirm === 'resetAccount') resetAccount(); else deleteAccount(); }}
                disabled={loading}
                className="font-mono rounded-lg"
                style={{ backgroundColor: 'var(--error)', color: '#fff', border: 'none', padding: '9px 20px', fontSize: 13, cursor: 'pointer' }}>
                {loading ? '…' : 'confirm'}
              </button>
              <button onClick={() => setConfirm(null)} disabled={loading}
                className="font-mono rounded-lg"
                style={{ backgroundColor: 'transparent', color: 'var(--sub)', border: '0.5px solid var(--sub)', padding: '9px 20px', fontSize: 13, cursor: 'pointer' }}>
                cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────
export function AccountSettings() {
  return (
    <div className="page-scroll">
      <div className="w-full max-w-4xl mx-auto px-5 py-8 flex flex-col gap-4 font-mono" style={{ animation: 'fadeIn 0.2s ease-out' }}>
        <h1 style={{ color: 'var(--main)', fontSize: 26, fontWeight: 500, marginBottom: 8 }}>account settings</h1>

        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg2)' }}>
          <h2 className="mb-4 uppercase tracking-widest" style={{ color: 'var(--sub)', fontSize: 11 }}>theme</h2>
          <ThemeSelector />
        </div>

        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg2)' }}>
          <h2 className="mb-4 uppercase tracking-widest" style={{ color: 'var(--sub)', fontSize: 11 }}>font</h2>
          <FontSelector />
        </div>

        <ProfileSection />
        <PreferencesSection />
        <StreakSection />
        <DangerZone />
      </div>
    </div>
  );
}
