import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Settings } from './components/Settings/Settings';
import { TestHistory } from './components/History/TestHistory';
import { AuthModal } from './components/Auth/AuthModal';
import { UsernameModal } from './components/Auth/UsernameModal';
import { ProfileDropdown } from './components/Navbar/ProfileDropdown';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { Callback } from './pages/Callback';
import { Account } from './pages/Account';
import { Friends } from './pages/Friends';
import { PublicProfile } from './pages/PublicProfile';
import { AccountSettings } from './pages/AccountSettings';
import { useTestStore } from './stores/testStore';
import { useSettingsStore } from './stores/settingsStore';
import { applyTheme, applyFont } from './utils/themes';
import { getTheme } from './data/themes/themes';
import { useAuth } from './context/AuthContext';

function App() {
  const { isActive } = useTestStore();
  const { theme, fontFamily, fontId, focusMode } = useSettingsStore();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [usernamePromptDismissed, setUsernamePromptDismissed] = useState(false);

  useEffect(() => { setUsernamePromptDismissed(false); }, [currentUser?.uid]);
  useEffect(() => { applyTheme(theme); }, [theme]);
  useEffect(() => { applyFont(fontFamily); }, [fontFamily]);

  // Restore persisted theme + font from localStorage on first mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('nt-theme');
    const savedFont  = localStorage.getItem('nt-font');
    if (savedTheme && savedTheme !== theme) applyTheme(savedTheme);
    if (savedFont  && savedFont  !== fontId) applyFont(savedFont);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showUsernameModal = !!(currentUser && userProfile && !userProfile.username && !usernamePromptDismissed);
  const currentTheme = getTheme(theme);
  const headerHidden = isActive && focusMode;

  const handleLogoClick = () => {
    navigate('/');
    useTestStore.getState().triggerRestart();
  };

  const openSettingsAtTheme = () => {
    setIsSettingsOpen(true);
    setTimeout(() => {
      document.getElementById('theme-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  return (
    <div className="h-screen flex flex-col bg-bg-primary overflow-hidden select-none">

      {/* ── NAVBAR ───────────────────────────────── */}
      <header className={`flex items-center justify-between px-7 py-3 shrink-0 transition-opacity duration-300 ${headerHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>

        <button onClick={handleLogoClick} className="flex flex-col leading-none hover:opacity-70 transition-opacity text-left" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <span className="font-mono" style={{ fontSize: 11, color: 'var(--sub)' }}>built by nathan</span>
          <span className="font-mono font-medium" style={{ fontSize: 20, color: 'var(--main)' }}>nathantype</span>
        </button>

        <div className="flex items-center gap-1">
          <NavIcon title="New test"      onClick={handleLogoClick}               icon={<IconKeyboard />} />
          <NavIcon title="Leaderboard"   onClick={() => setIsHistoryOpen(true)}  icon={<IconTrophy />} />
          <NavIcon title="Info"          onClick={() => {}}                      icon={<IconInfo />} />
          <NavIcon title="Settings"      onClick={() => setIsSettingsOpen(true)} icon={<IconSettings />} />
          <NavIcon title="Notifications" onClick={() => {}}                      icon={<IconBell />} />
          <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--sub)', opacity: 0.4 }} />

          {currentUser ? (
            <ProfileDropdown onOpenSettings={() => setIsSettingsOpen(true)} />
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              className="font-mono text-sm transition-colors"
              style={{ color: 'var(--sub)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--sub)')}
            >
              sign in
            </button>
          )}
        </div>
      </header>

      {/* ── MAIN ─────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <Routes>
          <Route path="/"                   element={<Home onOpenAuth={() => setIsAuthOpen(true)} onOpenSettings={() => setIsSettingsOpen(true)} />} />
          <Route path="/callback"           element={<Callback />} />
          <Route path="/profile/:username"  element={<PublicProfile />} />
          <Route path="/account"            element={<ProtectedRoute><Account /></ProtectedRoute>} />
          <Route path="/friends"            element={<ProtectedRoute><Friends /></ProtectedRoute>} />
          <Route path="/settings"           element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
          <Route path="/profile"            element={<ProtectedRoute><Account /></ProtectedRoute>} />
          <Route path="*"                   element={<Navigate to="/" />} />
        </Routes>
      </main>

      {/* ── FOOTER ───────────────────────────────── */}
      <footer
        className={`shrink-0 flex items-center justify-between font-mono transition-opacity duration-300 ${headerHidden ? 'opacity-0' : 'opacity-100'}`}
        style={{ color: 'var(--sub)', fontSize: 12, padding: '20px 28px' }}
      >
        <div className="flex gap-4">
          {['contact', 'support', 'github', 'privacy', 'security'].map(link => (
            <a key={link} href="#" className="hover:opacity-80 transition-opacity no-underline" style={{ color: 'var(--sub)' }}>{link}</a>
          ))}
        </div>

        {/* Theme chip — click to open settings scrolled to theme section */}
        <button
          onClick={openSettingsAtTheme}
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 'inherit', color: 'var(--sub)' }}
        >
          <div
            className="rounded-full shrink-0"
            style={{ width: 8, height: 8, backgroundColor: currentTheme?.main || 'var(--main)' }}
          />
          <span>{currentTheme?.name?.toLowerCase() || 'nathan dark'}</span>
        </button>

        <span>v1.0.0</span>
      </footer>

      {/* ── Modals ───────────────────────────────── */}
      <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <TestHistory isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <UsernameModal isOpen={showUsernameModal} onClose={() => setUsernamePromptDismissed(true)} />

      {/* ── Toasts ───────────────────────────────── */}
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3000,
          style: { background: 'var(--bg2)', color: 'var(--text)', fontFamily: 'var(--font-mono, var(--font-family, "Roboto Mono, monospace"))', fontSize: 13, borderRadius: 8 },
          success: { style: { borderLeft: '3px solid var(--main)' } },
          error:   { style: { borderLeft: '3px solid var(--error)' } },
        }}
      />
    </div>
  );
}

// ── Nav helpers ──────────────────────────────────────────────────
function NavIcon({ icon, title, onClick }: { icon: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="p-2 rounded transition-colors"
      style={{ color: 'var(--sub)', background: 'none', border: 'none', cursor: 'pointer' }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--sub)')}
    >{icon}</button>
  );
}

// ── SVG Icons ────────────────────────────────────────────────────
function IconKeyboard() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" /></svg>; }
function IconTrophy() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2z" /></svg>; }
function IconInfo() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>; }
function IconSettings() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>; }
function IconBell() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>; }

export default App;
