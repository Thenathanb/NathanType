import { useMemo, useState } from 'react';
import { allFonts } from '../../data/fonts/fonts';
import { applyFont } from '../../utils/applyFont';
import { useSettingsStore } from '../../stores/settingsStore';
import { FontCard } from './FontCard';

export function FontSelector() {
  const { fontId, updateSettings } = useSettingsStore();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() =>
    search.trim()
      ? allFonts.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
      : allFonts,
    [search]
  );

  const select = (id: string) => {
    applyFont(id);
    updateSettings({ fontId: id });
    localStorage.setItem('nt-font', id);
  };

  return (
    <div id="font-section">
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="search fonts…"
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
        {filtered.map(f => (
          <FontCard key={f.id} font={f} active={fontId === f.id} onClick={() => select(f.id)} />
        ))}
        {filtered.length === 0 && (
          <p className="font-mono" style={{ color: 'var(--sub)', fontSize: 13, gridColumn: '1/-1' }}>no fonts match "{search}"</p>
        )}
      </div>
    </div>
  );
}
