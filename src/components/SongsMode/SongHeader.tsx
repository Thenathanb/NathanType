import { useTestStore } from '../../stores/testStore';

export function SongHeader() {
  const { currentSong, isActive } = useTestStore();
  if (!currentSong || !isActive) return null;

  const sourceBadgeColor: Record<string, string> = {
    spotify: '#1DB954',
    applemusic: '#FC3C44',
    soundcloud: '#FF5500',
    library: '#646669',
  };

  return (
    <div
      className="flex items-center gap-3 font-mono"
      style={{ marginBottom: 12, animation: 'fadeIn 0.2s ease-out' }}
    >
      {currentSong.albumArt ? (
        <img
          src={currentSong.albumArt}
          alt="album art"
          style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover' }}
        />
      ) : (
        <div
          className="flex items-center justify-center rounded"
          style={{ width: 32, height: 32, backgroundColor: '#323437', flexShrink: 0 }}
        >
          <IconNote />
        </div>
      )}
      <div className="flex flex-col" style={{ lineHeight: 1.3 }}>
        <span style={{ color: '#d1d0ce', fontSize: 13 }}>{currentSong.title}</span>
        <span style={{ color: '#646669', fontSize: 12 }}>{currentSong.artist}</span>
      </div>
      <span
        className="px-2 py-0.5 rounded text-xs font-mono ml-auto"
        style={{
          backgroundColor: `${sourceBadgeColor[currentSong.source] || '#646669'}22`,
          color: sourceBadgeColor[currentSong.source] || '#646669',
          fontSize: 11,
        }}
      >
        {currentSong.source}
      </span>
    </div>
  );
}

function IconNote() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#646669" strokeWidth="2">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}
