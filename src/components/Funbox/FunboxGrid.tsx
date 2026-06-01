import { useMemo, useState } from 'react';
import { allFunboxes } from '../../data/funbox/funbox';
import { useSettingsStore } from '../../stores/settingsStore';
import { FunboxCard } from './FunboxCard';

type Category = 'all' | 'content' | 'meme' | 'music' | 'challenge';

export function FunboxGrid() {
  const { activeFunbox, setActiveFunbox } = useSettingsStore();
  const [category, setCategory] = useState<Category>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = category === 'all' ? allFunboxes : allFunboxes.filter(f => f.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(f => f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q));
    }
    return list;
  }, [category, search]);

  const toggle = (id: string) => {
    setActiveFunbox(activeFunbox === id ? null : id);
  };

  const CATS: { label: string; value: Category }[] = [
    { label: 'all', value: 'all' },
    { label: 'content', value: 'content' },
    { label: 'meme', value: 'meme' },
    { label: 'music', value: 'music' },
    { label: 'challenge', value: 'challenge' },
  ];

  return (
    <div id="funbox-section">
      {/* Description */}
      <p className="font-mono mb-3" style={{ color: 'var(--sub)', fontSize: 12 }}>
        add a modifier to your next test. only one active at a time.
      </p>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="search funboxes…"
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

      {/* Category tabs */}
      <div className="flex gap-1 mb-3 flex-wrap">
        {CATS.map(c => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className="font-mono px-3 py-1 rounded-md transition-all"
            style={{
              fontSize: 12,
              backgroundColor: category === c.value ? 'var(--main)' : 'var(--bg2)',
              color: category === c.value ? 'var(--bg)' : 'var(--sub)',
              fontWeight: category === c.value ? 600 : 400,
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { if (category !== c.value) (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
            onMouseLeave={e => { if (category !== c.value) (e.currentTarget as HTMLElement).style.color = 'var(--sub)'; }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
        {filtered.map(f => (
          <FunboxCard
            key={f.id}
            funbox={f}
            active={activeFunbox === f.id}
            onClick={() => toggle(f.id)}
          />
        ))}
        {filtered.length === 0 && (
          <p className="font-mono" style={{ color: 'var(--sub)', fontSize: 13, gridColumn: '1/-1' }}>
            no funboxes match &ldquo;{search}&rdquo;
          </p>
        )}
      </div>

      {/* Active funbox indicator */}
      {activeFunbox && (
        <div className="flex items-center justify-between mt-4 font-mono" style={{ fontSize: 12 }}>
          <span style={{ color: 'var(--sub)' }}>
            active: <span style={{ color: 'var(--main)' }}>{allFunboxes.find(f => f.id === activeFunbox)?.name}</span>
          </span>
          <button
            onClick={() => setActiveFunbox(null)}
            className="transition-colors"
            style={{ color: 'var(--sub)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--error)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--sub)')}
          >
            deactivate
          </button>
        </div>
      )}
    </div>
  );
}
