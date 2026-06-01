import { useState } from 'react';
import { isConnected as spotifyConnected, initiateSpotifyLogin, disconnectSpotify, getCurrentlyPlaying, getRecentlyPlayed } from '../../services/spotify';
import { resolveTrackUrl } from '../../services/soundcloud';
import { fetchLyrics, lyricsToWords } from '../../services/lyricsApi';
import { useTestStore } from '../../stores/testStore';
import type { SongData } from '../../types/index.js';

interface StreamingConnectorProps {
  onLyricsLoaded: (words: string[], song: SongData) => void;
}

export function StreamingConnector({ onLyricsLoaded }: StreamingConnectorProps) {
  const { setContentLoading } = useTestStore();
  const [scUrl, setScUrl] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const spotifyActive = spotifyConnected();

  const loadFromTrack = async (title: string, artist: string, source: SongData['source'], albumArt?: string) => {
    setLoading(true);
    setContentLoading(true);
    setStatusMsg('fetching lyrics…');
    const result = await fetchLyrics(artist, title);
    setLoading(false);
    setContentLoading(false);
    if (!result.found) {
      setStatusMsg('lyrics unavailable — try another song or use the library');
      return;
    }
    setStatusMsg('');
    const words = lyricsToWords(result.lyrics);
    const song: SongData = { title, artist, genre: 'streaming', section: 'full', source, albumArt };
    onLyricsLoaded(words, song);
  };

  const handleSpotifyPlay = async () => {
    setLoading(true);
    const track = (await getCurrentlyPlaying()) || (await getRecentlyPlayed());
    setLoading(false);
    if (!track) { setStatusMsg('no track found — play something on Spotify first'); return; }
    await loadFromTrack(track.title, track.artist, 'spotify', track.albumArt);
  };

  const handleSoundCloudLoad = async () => {
    if (!scUrl.trim()) return;
    setLoading(true);
    const track = await resolveTrackUrl(scUrl.trim());
    setLoading(false);
    if (!track) { setStatusMsg('could not resolve that SoundCloud URL'); return; }
    await loadFromTrack(track.title, track.artist, 'soundcloud', track.thumbnailUrl);
  };

  return (
    <div className="flex flex-col gap-3 w-full font-mono" style={{ fontSize: 13 }}>
      {/* Streaming buttons */}
      <div className="flex gap-2 flex-wrap">
        {spotifyActive ? (
          <div className="flex gap-2 items-center">
            <button
              onClick={handleSpotifyPlay}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#1DB954', color: '#000', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}
            >
              <IconSpotify />
              type current song
            </button>
            <button
              onClick={() => { disconnectSpotify(); window.location.reload(); }}
              style={{ color: '#646669', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}
            >
              disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={() => initiateSpotifyLogin()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#1DB954', color: '#000', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}
          >
            <IconSpotify />
            connect spotify
          </button>
        )}

        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ backgroundColor: '#323437', color: '#646669', border: 'none', cursor: 'not-allowed', fontFamily: 'inherit', fontSize: 13 }}
          title="Apple Music integration requires a developer token — see src/services/appleMusic.ts"
        >
          <IconApple />
          connect apple music
        </button>
      </div>

      {/* SoundCloud URL paste */}
      <div className="flex gap-2">
        <input
          type="url"
          placeholder="paste a soundcloud track url…"
          value={scUrl}
          onChange={e => setScUrl(e.target.value)}
          className="flex-1 font-mono outline-none"
          style={{ backgroundColor: '#2c2e31', color: '#d1d0ce', border: '1px solid #646669', borderRadius: 8, padding: '7px 12px', fontSize: 13 }}
        />
        <button
          onClick={handleSoundCloudLoad}
          disabled={loading || !scUrl.trim()}
          className="px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#FF5500', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}
        >
          load
        </button>
      </div>

      {statusMsg && <p style={{ color: '#ca4754', fontSize: 12 }}>{statusMsg}</p>}

      <div className="flex items-center gap-3">
        <div className="flex-1" style={{ height: 1, backgroundColor: '#646669', opacity: 0.2 }} />
        <span style={{ color: '#646669', fontSize: 12 }}>or browse library</span>
        <div className="flex-1" style={{ height: 1, backgroundColor: '#646669', opacity: 0.2 }} />
      </div>
    </div>
  );
}

function IconSpotify() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}

function IconApple() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}
