import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteUser, signOut } from 'firebase/auth';
import { deleteDoc, doc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { auth, db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useSettingsStore } from '../stores/settingsStore';
import { ThemeSelector } from '../components/Settings/ThemeSelector';
import { FontSelector } from '../components/Settings/FontSelector';
import { FunboxGrid } from '../components/Funbox/FunboxGrid';

// ── Types ────────────────────────────────────────────────────────
type TabId = 'behavior' | 'appearance' | 'theme' | 'sound' | 'funbox' | 'danger';

interface Tab {
  id: TabId;
  label: string;
  emoji: string;
}

const TABS: Tab[] = [
  { id: 'behavior',   label: 'Behavior',    emoji: '⚙️' },
  { id: 'appearance', label: 'Appearance',  emoji: '🎨' },
  { id: 'theme',      label: 'Theme',       emoji: '🖌️' },
  { id: 'sound',      label: 'Sound',       emoji: '🔊' },
  { id: 'funbox',     label: 'Funbox',      emoji: '🎲' },
  { id: 'danger',     label: 'Danger Zone', emoji: '⚠️' },
];

// ── Shared primitives ────────────────────────────────────────────
interface OptionBtnProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function OptionBtn({ active, onClick, children }: OptionBtnProps) {
  return (
    <button
      onClick={onClick}
      className="font-mono transition-colors"
      style={{
        backgroundColor: active ? 'var(--main)' : 'var(--bg2)',
        color: active ? 'var(--bg)' : 'var(--sub)',
        fontWeight: active ? 500 : 400,
        border: 'none',
        borderRadius: 8,
        padding: '10px 20px',
        fontSize: 13,
        cursor: 'pointer',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--sub)'; }}
    >
      {children}
    </button>
  );
}

interface SettingRowProps {
  name: string;
  description: string;
  children: React.ReactNode;
}

function SettingRow({ name, description, children }: SettingRowProps) {
  return (
    <div
      className="flex items-center gap-4"
      style={{
        padding: '20px 0',
        borderBottom: '0.5px solid color-mix(in srgb, var(--sub) 12%, transparent)',
      }}
    >
      <div style={{ flex: '0 0 60%' }}>
        <div style={{ color: 'var(--main)', fontSize: 15, marginBottom: 3 }}>{name}</div>
        <div style={{ color: 'var(--sub)', fontSize: 13 }}>{description}</div>
      </div>
      <div style={{ flex: '0 0 40%', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {children}
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="font-mono uppercase tracking-widest"
      style={{ color: 'var(--main)', fontSize: 20, fontWeight: 500, marginBottom: 0, paddingTop: 32, paddingBottom: 8 }}
    >
      {children}
    </h2>
  );
}

// ── Behavior section ─────────────────────────────────────────────
function BehaviorSection() {
  const {
    difficulty, blindMode, stopOnError, confidenceMode, quickEnd, resultSaving,
    updateSettings,
  } = useSettingsStore();

  // Map confidenceMode: 'full' => 'max' display, 'partial' stays
  const confDisplay = confidenceMode === 'full' ? 'max' : confidenceMode;

  const setConf = (v: string) => {
    if (v === 'max') updateSettings({ confidenceMode: 'full' });
    else updateSettings({ confidenceMode: v as 'off' | 'partial' | 'full' });
  };

  return (
    <section id="behavior">
      <SectionHeading>behavior</SectionHeading>
      <SettingRow name="difficulty" description="how harshly errors are penalized during a test">
        {(['normal', 'expert', 'master'] as const).map(v => (
          <OptionBtn key={v} active={difficulty === v} onClick={() => updateSettings({ difficulty: v })}>{v}</OptionBtn>
        ))}
      </SettingRow>
      <SettingRow name="blind mode" description="hide error highlighting while typing">
        <OptionBtn active={!blindMode} onClick={() => updateSettings({ blindMode: false })}>off</OptionBtn>
        <OptionBtn active={blindMode}  onClick={() => updateSettings({ blindMode: true })}>on</OptionBtn>
      </SettingRow>
      <SettingRow name="stop on error" description="stop the test when you make a mistake">
        {(['off', 'letter', 'word'] as const).map(v => (
          <OptionBtn key={v} active={stopOnError === v} onClick={() => updateSettings({ stopOnError: v })}>{v}</OptionBtn>
        ))}
      </SettingRow>
      <SettingRow name="confidence mode" description="restrict use of backspace">
        {['off', 'partial', 'max'].map(v => (
          <OptionBtn key={v} active={confDisplay === v} onClick={() => setConf(v)}>{v}</OptionBtn>
        ))}
      </SettingRow>
      <SettingRow name="quick end" description="end the test immediately when the last word is typed">
        <OptionBtn active={!quickEnd} onClick={() => updateSettings({ quickEnd: false })}>off</OptionBtn>
        <OptionBtn active={quickEnd}  onClick={() => updateSettings({ quickEnd: true })}>on</OptionBtn>
      </SettingRow>
      <SettingRow name="result saving" description="automatically save test results to your account">
        <OptionBtn active={!resultSaving} onClick={() => updateSettings({ resultSaving: false })}>off</OptionBtn>
        <OptionBtn active={resultSaving}  onClick={() => updateSettings({ resultSaving: true })}>on</OptionBtn>
      </SettingRow>
    </section>
  );
}

// ── Appearance section ───────────────────────────────────────────
function AppearanceSection() {
  const {
    fontSize, caretStyle, caretSpeed, smoothCaret,
    showLiveWpm, showLiveAccuracy, showTimer, showCurrentWordLine,
    updateSettings,
  } = useSettingsStore();

  return (
    <section id="appearance">
      <SectionHeading>appearance</SectionHeading>
      <SettingRow name="font size" description="size of the typing text">
        {(['small', 'medium', 'large', 'extra-large'] as const).map(v => (
          <OptionBtn key={v} active={fontSize === v} onClick={() => updateSettings({ fontSize: v })}>{v}</OptionBtn>
        ))}
      </SettingRow>
      <SettingRow name="caret style" description="shape of the typing caret">
        {(['off', 'line', 'block', 'underline'] as const).map(v => (
          <OptionBtn key={v} active={caretStyle === v} onClick={() => updateSettings({ caretStyle: v })}>{v}</OptionBtn>
        ))}
      </SettingRow>
      <SettingRow name="caret speed" description="animation speed of the caret movement">
        {(['slow', 'medium', 'fast', 'off'] as const).map(v => (
          <OptionBtn key={v} active={caretSpeed === v} onClick={() => updateSettings({ caretSpeed: v })}>{v}</OptionBtn>
        ))}
      </SettingRow>
      <SettingRow name="smooth caret" description="animate the caret between characters">
        <OptionBtn active={!smoothCaret} onClick={() => updateSettings({ smoothCaret: false })}>off</OptionBtn>
        <OptionBtn active={smoothCaret}  onClick={() => updateSettings({ smoothCaret: true })}>on</OptionBtn>
      </SettingRow>
      <SettingRow name="show live wpm" description="display live wpm counter during test">
        <OptionBtn active={!showLiveWpm} onClick={() => updateSettings({ showLiveWpm: false })}>off</OptionBtn>
        <OptionBtn active={showLiveWpm}  onClick={() => updateSettings({ showLiveWpm: true })}>on</OptionBtn>
      </SettingRow>
      <SettingRow name="show live accuracy" description="display live accuracy counter during test">
        <OptionBtn active={!showLiveAccuracy} onClick={() => updateSettings({ showLiveAccuracy: false })}>off</OptionBtn>
        <OptionBtn active={showLiveAccuracy}  onClick={() => updateSettings({ showLiveAccuracy: true })}>on</OptionBtn>
      </SettingRow>
      <SettingRow name="show timer" description="display the countdown timer during timed tests">
        <OptionBtn active={!showTimer} onClick={() => updateSettings({ showTimer: false })}>off</OptionBtn>
        <OptionBtn active={showTimer}  onClick={() => updateSettings({ showTimer: true })}>on</OptionBtn>
      </SettingRow>
      <SettingRow name="word underline" description="show an underline beneath the current word being typed">
        <OptionBtn active={!showCurrentWordLine} onClick={() => updateSettings({ showCurrentWordLine: false })}>off</OptionBtn>
        <OptionBtn active={showCurrentWordLine}  onClick={() => updateSettings({ showCurrentWordLine: true })}>on</OptionBtn>
      </SettingRow>
    </section>
  );
}

// ── Theme section ────────────────────────────────────────────────
function ThemeSection() {
  return (
    <section id="theme">
      <SectionHeading>theme</SectionHeading>
      <div style={{ paddingTop: 16 }}>
        <ThemeSelector />
      </div>
      <div style={{ paddingTop: 24 }}>
        <FontSelector />
      </div>
    </section>
  );
}

// ── Sound section ────────────────────────────────────────────────
function SoundSection() {
  const { soundEnabled, errorSoundEnabled, updateSettings } = useSettingsStore();
  return (
    <section id="sound">
      <SectionHeading>sound</SectionHeading>
      <SettingRow name="key sounds" description="play a sound on each keypress">
        <OptionBtn active={!soundEnabled} onClick={() => updateSettings({ soundEnabled: false })}>off</OptionBtn>
        <OptionBtn active={soundEnabled}  onClick={() => updateSettings({ soundEnabled: true })}>on</OptionBtn>
      </SettingRow>
      <SettingRow name="error sound" description="play a distinct sound when you make an error">
        <OptionBtn active={!errorSoundEnabled} onClick={() => updateSettings({ errorSoundEnabled: false })}>off</OptionBtn>
        <OptionBtn active={errorSoundEnabled}  onClick={() => updateSettings({ errorSoundEnabled: true })}>on</OptionBtn>
      </SettingRow>
    </section>
  );
}

// ── Funbox section ───────────────────────────────────────────────
function FunboxSection() {
  return (
    <section id="funbox">
      <SectionHeading>funbox</SectionHeading>
      <div style={{ paddingTop: 16 }}>
        <FunboxGrid />
      </div>
    </section>
  );
}

// ── Danger Zone section ──────────────────────────────────────────
function DangerSection() {
  const { resetSettings } = useSettingsStore();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const displayName = userProfile?.username || userProfile?.displayName || currentUser?.displayName || 'user';

  const handleResetSettings = () => {
    resetSettings();
    toast.success('settings reset to defaults');
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    if (deleteConfirm !== displayName) {
      toast.error('username does not match');
      return;
    }
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
    setShowDeleteModal(false);
  };

  const DangerBtn = ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button
      onClick={onClick}
      className="font-mono rounded-lg transition-colors"
      style={{ backgroundColor: 'transparent', color: 'var(--error)', border: '0.5px solid var(--error)', padding: '10px 20px', fontSize: 13, cursor: 'pointer', borderRadius: 8 }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--error) 10%, transparent)')}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      {label}
    </button>
  );

  return (
    <section id="danger">
      <SectionHeading>danger zone</SectionHeading>
      <SettingRow name="reset settings" description="restore all settings to their default values">
        <DangerBtn label="reset settings" onClick={handleResetSettings} />
      </SettingRow>
      {currentUser && (
        <SettingRow name="delete account" description="permanently delete your account and all associated data">
          <DangerBtn label="delete account" onClick={() => setShowDeleteModal(true)} />
        </SettingRow>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => !loading && setShowDeleteModal(false)}
        >
          <div
            className="rounded-xl p-6 font-mono"
            style={{ backgroundColor: 'var(--bg2)', maxWidth: 380, width: '90%', border: '0.5px solid color-mix(in srgb, var(--error) 40%, transparent)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ color: 'var(--text)', fontSize: 16, marginBottom: 8 }}>delete account</div>
            <div style={{ color: 'var(--sub)', fontSize: 13, marginBottom: 16 }}>
              this action is permanent and cannot be undone. type your username{' '}
              <span style={{ color: 'var(--main)' }}>{displayName}</span> to confirm.
            </div>
            <input
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder={displayName}
              className="font-mono outline-none rounded-lg w-full"
              style={{ backgroundColor: 'var(--bg)', color: 'var(--text)', border: '1px solid color-mix(in srgb, var(--sub) 40%, transparent)', padding: '9px 14px', fontSize: 13, marginBottom: 16 }}
            />
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={loading || deleteConfirm !== displayName}
                className="font-mono rounded-lg"
                style={{ backgroundColor: 'var(--error)', color: '#fff', border: 'none', padding: '9px 20px', fontSize: 13, cursor: deleteConfirm === displayName ? 'pointer' : 'not-allowed', opacity: deleteConfirm === displayName ? 1 : 0.5 }}
              >
                {loading ? '…' : 'delete'}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={loading}
                className="font-mono rounded-lg"
                style={{ backgroundColor: 'transparent', color: 'var(--sub)', border: '0.5px solid var(--sub)', padding: '9px 20px', fontSize: 13, cursor: 'pointer' }}
              >
                cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ── Main Settings Page ───────────────────────────────────────────
export function Settings() {
  const [activeTab, setActiveTab] = useState<TabId>('behavior');
  const sectionRefs = useRef<Partial<Record<TabId, HTMLElement | null>>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);

  // IntersectionObserver to highlight active tab
  useEffect(() => {
    const callback: IntersectionObserverCallback = (entries) => {
      // Find the topmost section that is currently intersecting
      const intersecting = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (intersecting.length > 0) {
        const id = intersecting[0].target.id as TabId;
        setActiveTab(id);
      }
    };

    observerRef.current = new IntersectionObserver(callback, {
      rootMargin: '-56px 0px -60% 0px',
      threshold: 0,
    });

    TABS.forEach(tab => {
      const el = document.getElementById(tab.id);
      if (el) {
        sectionRefs.current[tab.id] = el;
        observerRef.current?.observe(el);
      }
    });

    return () => observerRef.current?.disconnect();
  }, []);

  const scrollTo = (id: TabId) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveTab(id);
    }
  };

  return (
    <div className="page-scroll" style={{ fontFamily: 'inherit' }}>
      {/* Sticky tab bar — top:0 because the scroll container already starts below the navbar */}
      <div
        className="sticky z-40"
        style={{ top: 0, backgroundColor: 'var(--bg)', paddingTop: 12, paddingBottom: 4 }}
      >
        <div className="w-full max-w-4xl mx-auto px-5">
          <div
            className="flex items-center gap-1 font-mono"
            style={{
              backgroundColor: 'var(--bg2)',
              borderRadius: 12,
              padding: '8px 12px',
              overflowX: 'auto',
            }}
          >
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => scrollTo(tab.id)}
                className="flex items-center gap-1.5 shrink-0 rounded-lg transition-colors"
                style={{
                  padding: '6px 14px',
                  fontSize: 13,
                  color: activeTab === tab.id ? 'var(--main)' : 'var(--sub)',
                  backgroundColor: activeTab === tab.id ? 'var(--bg)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = 'var(--text)'; }}
                onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = 'var(--sub)'; }}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="w-full max-w-4xl mx-auto px-5 pb-20 font-mono" style={{ animation: 'fadeIn 0.2s ease-out' }}>
        <BehaviorSection />
        <AppearanceSection />
        <ThemeSection />
        <SoundSection />
        <FunboxSection />
        <DangerSection />
      </div>
    </div>
  );
}
