import { useCallback } from 'react';
import { useTestStore } from '../../stores/testStore';
import { LyricsSectionTabs } from './LyricsSectionTabs';
import { StreamingConnector } from './StreamingConnector';
import type { SongData, SongGenre } from '../../types/index.js';

const GENRES: { value: SongGenre; label: string }[] = [
  { value: 'hiphop',    label: 'hip-hop' },
  { value: 'pop',       label: 'pop' },
  { value: 'rnb',       label: 'r&b' },
  { value: 'afrobeats', label: 'afrobeats' },
  { value: 'rock',      label: 'rock' },
];

interface SongsModeProps {
  onSongLoad: (words: string[], song: SongData) => void;
}

export function SongsModeSelector({ onSongLoad }: SongsModeProps) {
  const { songGenre, setSongGenre, isActive } = useTestStore();

  const handleLyricsLoaded = useCallback((words: string[], song: SongData) => {
    onSongLoad(words, song);
  }, [onSongLoad]);

  if (isActive) return null;

  return (
    <div className="flex flex-col gap-3 w-full font-mono" style={{ maxWidth: 680, fontSize: 13 }}>
      {/* Streaming connectors */}
      <StreamingConnector onLyricsLoaded={handleLyricsLoaded} />

      {/* Genre selector */}
      <div className="flex items-center gap-2 flex-wrap">
        {GENRES.map(g => (
          <button
            key={g.value}
            onClick={() => setSongGenre(g.value)}
            className="px-3 py-1 rounded-full transition-all"
            style={{
              backgroundColor: songGenre === g.value ? '#e2b714' : '#323437',
              color: songGenre === g.value ? '#2c2e31' : '#646669',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 12,
            }}
            onMouseEnter={e => { if (songGenre !== g.value) e.currentTarget.style.color = '#d1d0ce'; }}
            onMouseLeave={e => { if (songGenre !== g.value) e.currentTarget.style.color = '#646669'; }}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Section picker */}
      <LyricsSectionTabs />
    </div>
  );
}
