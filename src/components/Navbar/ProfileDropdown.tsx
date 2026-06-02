import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { getLevelTitle, getXpDetails } from '../../data/levels/levels';
import toast from 'react-hot-toast';

interface ProfileDropdownProps {
  onOpenSettings: () => void;
}

export function ProfileDropdown({ onOpenSettings: _onOpenSettings }: ProfileDropdownProps) {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!currentUser) return null;

  const displayName =
    userProfile?.username || userProfile?.displayName ||
    currentUser.displayName || currentUser.email?.split('@')[0] || 'user';
  const avatarUrl = userProfile?.photoURL || currentUser.photoURL || null;
  const initials = displayName[0].toUpperCase();
  const xpD = getXpDetails(userProfile?.xp ?? 0);

  const show = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setOpen(true);
  };
  const hide = () => {
    hideTimer.current = setTimeout(() => setOpen(false), 120);
  };

  const go = (path: string) => { setOpen(false); navigate(path); };

  const handleSignOut = async () => {
    setOpen(false);
    try {
      await signOut(auth);
      toast.success('signed out');
    } catch {
      toast.error('sign out failed');
    }
  };

  return (
    <div
      className="relative flex items-center gap-2"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {/* Trigger row */}
      <span className="font-mono" style={{ color: 'var(--text)', fontSize: 13 }}>{displayName}</span>

      {userProfile && (
        <span
          className="font-mono font-medium"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--main) 15%, transparent)',
            border: '1px solid color-mix(in srgb, var(--main) 40%, transparent)',
            color: 'var(--main)',
            fontSize: 12,
            fontWeight: 500,
            borderRadius: 4,
            padding: '1px 7px',
            whiteSpace: 'nowrap',
          }}
        >
          {userProfile.level}
        </span>
      )}

      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 rounded-full shrink-0 transition-opacity hover:opacity-80"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div
            className="flex items-center justify-center font-mono font-medium"
            style={{ width: 32, height: 32, backgroundColor: 'var(--main)', color: 'var(--bg)', fontSize: 13, borderRadius: '50%' }}
          >
            {initials}
          </div>
        )}
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--sub)" strokeWidth="2.5"
          style={{ transition: 'transform 150ms', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute font-mono"
          style={{
            top: 'calc(100% + 8px)',
            right: 0,
            minWidth: 220,
            backgroundColor: 'var(--bg2)',
            border: '0.5px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            padding: 6,
            zIndex: 1000,
            animation: 'dropdownAppear 150ms ease-out',
          }}
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div
                className="flex items-center justify-center font-mono font-medium shrink-0"
                style={{ width: 36, height: 36, backgroundColor: 'var(--main)', color: 'var(--bg)', fontSize: 14, borderRadius: '50%' }}
              >
                {initials}
              </div>
            )}
            <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
              <div className="truncate font-medium" style={{ color: 'var(--text)', fontSize: 14 }}>{displayName}</div>
              <div className="truncate" style={{ color: 'var(--main)', fontSize: 11 }}>
                lv {userProfile?.level} · {userProfile ? getLevelTitle(userProfile.level) : ''}
              </div>
              <div className="truncate" style={{ color: 'var(--sub)', fontSize: 11 }}>{currentUser.email}</div>
              {/* XP progress bar */}
              {userProfile && (
                <div style={{ marginTop: 6 }}>
                  <div className="flex justify-between" style={{ fontSize: 11, color: 'var(--sub)', marginBottom: 3 }}>
                    <span>Level {xpD.level}</span>
                    <span>{xpD.xpInLevel} / {xpD.levelMaxXp} xp</span>
                  </div>
                  <div style={{ height: 3, backgroundColor: 'color-mix(in srgb, var(--sub) 20%, transparent)', borderRadius: 2 }}>
                    <div style={{
                      height: '100%',
                      width: `${xpD.progressPct}%`,
                      backgroundColor: 'var(--main)',
                      borderRadius: 2,
                      transition: 'width 0.4s',
                    }} />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div style={{ height: '0.5px', backgroundColor: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />

          {/* Items */}
          <MenuItem icon={<IcoBar />}       label="user stats"       onClick={() => go('/account')} />
          <MenuItem icon={<IcoUsers />}     label="friends"          onClick={() => go('/friends')} />
          <MenuItem icon={<IcoCircle />}    label="public profile"   onClick={() => go(`/profile/${userProfile?.username || currentUser.uid}`)} />
          <MenuItem icon={<IcoSettings />}  label="account settings" onClick={() => go('/account-settings')} />

          <div style={{ height: '0.5px', backgroundColor: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />

          <MenuItem icon={<IcoOut />} label="sign out" onClick={handleSignOut} danger />
        </div>
      )}
    </div>
  );
}

// ── Dropdown item ─────────────────────────────────────────────────
function MenuItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 w-full rounded-md transition-all"
      style={{
        height: 36,
        padding: '0 10px',
        color: danger ? 'var(--error)' : 'var(--sub)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: 13,
        fontFamily: 'inherit',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--main) 10%, transparent)';
        e.currentTarget.style.color = danger ? 'var(--error)' : 'var(--main)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = danger ? 'var(--error)' : 'var(--sub)';
      }}
    >
      {icon}
      {label}
    </button>
  );
}

// ── Icons (16px) ─────────────────────────────────────────────────
const sv = (d: string) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const IcoBar = () => sv('M3 3v18h18M7 16l4-4 4 4 4-4');
const IcoUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IcoCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M20 21a8 8 0 1 0-16 0" />
  </svg>
);
const IcoSettings = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const IcoOut = () => sv('M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9');
