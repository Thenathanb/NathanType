import { useMemo, useState } from 'react';
import { allThemes } from '../../data/themes/themes';
import { applyTheme } from '../../utils/applyTheme';
import { useSettingsStore } from '../../stores/settingsStore';
import { ThemeCard } from './ThemeCard';
import { useAuth } from '../../context/AuthContext';
import { updateUserProfile } from '../../utils/firestoreService';

export function ThemeSelector() {
  const { theme, updateSettings } = useSettingsStore();
  const { currentUser } = useAuth();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() =>
    search.trim()
      ? allThemes.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
      : allThemes,
    [search]
  );

  const select = (id: string) => {
    const t = allThemes.find(t => t.id === id);
    if (!t) return;
    applyTheme(t);
    updateSettings({ theme: id });
    localStorage.setItem('nt-theme', id);
    if (currentUser) {
      updateUserProfile(currentUser.uid, { preferences: { defaultMode: 'time', defaultTimeLimit: 30, defaultWordLimit: 25, streakHourOffset: 0 } }).catch(() => {});
    }
  };

  return (
    <div id="theme-section">
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="search themes…"
        className="font-mono outline-none w-full mb-3"
        style={{
          backgroundColor: 'var(--bg2)',
          color: 'var(--text)',
          border: '0.5px solid rgba(255,255,255,0.12)',
          borderRadius: 8,
          padding: '9px 14px',
          fontSize: 13,
        }}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
        {filtered.map(t => (
          <ThemeCard key={t.id} theme={t} active={theme === t.id} onClick={() => select(t.id)} />
        ))}
        {filtered.length === 0 && (
          <p className="font-mono" style={{ color: 'var(--sub)', fontSize: 13, gridColumn: '1/-1' }}>no themes match "{search}"</p>
        )}
      </div>
    </div>
  );
}
