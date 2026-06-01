// ─────────────────────────────────────────────────────────────────
// Spotify Web API — PKCE OAuth flow (no backend required)
//
// Setup:
//   1. Go to https://developer.spotify.com/dashboard and create an app
//   2. Add http://localhost:5173/callback (and your prod URL) as Redirect URI
//   3. Replace SPOTIFY_CLIENT_ID below with your app's Client ID
// ─────────────────────────────────────────────────────────────────

const SPOTIFY_CLIENT_ID = 'PASTE_YOUR_SPOTIFY_CLIENT_ID_HERE';
const REDIRECT_URI = `${window.location.origin}/callback`;
const SCOPES = ['user-read-recently-played', 'user-read-currently-playing'].join(' ');

const LS_KEYS = {
  access: 'spotify_access_token',
  refresh: 'spotify_refresh_token',
  expiry: 'spotify_token_expiry',
  verifier: 'spotify_code_verifier',
};

export interface SpotifyTrack {
  title: string;
  artist: string;
  albumArt?: string;
  uri: string;
}

// ── PKCE helpers ─────────────────────────────────────────────────

function generateRandom(len: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  return Array.from(crypto.getRandomValues(new Uint8Array(len)))
    .map(b => chars[b % chars.length])
    .join('');
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(plain));
}

function base64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// ── Auth ─────────────────────────────────────────────────────────

export async function initiateSpotifyLogin(): Promise<void> {
  const verifier = generateRandom(64);
  const challenge = base64url(await sha256(verifier));
  localStorage.setItem(LS_KEYS.verifier, verifier);

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    scope: SCOPES,
  });
  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

export async function handleSpotifyCallback(code: string): Promise<boolean> {
  const verifier = localStorage.getItem(LS_KEYS.verifier);
  if (!verifier) return false;

  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: verifier,
      }),
    });
    if (!res.ok) return false;
    const data = await res.json() as { access_token: string; refresh_token: string; expires_in: number };
    localStorage.setItem(LS_KEYS.access, data.access_token);
    localStorage.setItem(LS_KEYS.refresh, data.refresh_token);
    localStorage.setItem(LS_KEYS.expiry, String(Date.now() + data.expires_in * 1000));
    localStorage.removeItem(LS_KEYS.verifier);
    return true;
  } catch {
    return false;
  }
}

export async function refreshToken(): Promise<boolean> {
  const refresh = localStorage.getItem(LS_KEYS.refresh);
  if (!refresh) return false;
  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: refresh,
      }),
    });
    if (!res.ok) return false;
    const data = await res.json() as { access_token: string; expires_in: number; refresh_token?: string };
    localStorage.setItem(LS_KEYS.access, data.access_token);
    localStorage.setItem(LS_KEYS.expiry, String(Date.now() + data.expires_in * 1000));
    if (data.refresh_token) localStorage.setItem(LS_KEYS.refresh, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

export function isConnected(): boolean {
  return !!localStorage.getItem(LS_KEYS.access);
}

export function disconnectSpotify(): void {
  Object.values(LS_KEYS).forEach(k => localStorage.removeItem(k));
}

async function getValidToken(): Promise<string | null> {
  const expiry = Number(localStorage.getItem(LS_KEYS.expiry) || 0);
  if (Date.now() > expiry - 60_000) {
    const ok = await refreshToken();
    if (!ok) return null;
  }
  return localStorage.getItem(LS_KEYS.access);
}

// ── API calls ────────────────────────────────────────────────────

export async function getCurrentlyPlaying(): Promise<SpotifyTrack | null> {
  const token = await getValidToken();
  if (!token) return null;
  try {
    const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 204 || !res.ok) return null;
    const data = await res.json() as { item?: { name: string; artists: { name: string }[]; album: { images: { url: string }[] }; uri: string } };
    if (!data.item) return null;
    return {
      title: data.item.name,
      artist: data.item.artists.map(a => a.name).join(', '),
      albumArt: data.item.album.images[2]?.url,
      uri: data.item.uri,
    };
  } catch {
    return null;
  }
}

export async function getRecentlyPlayed(): Promise<SpotifyTrack | null> {
  const token = await getValidToken();
  if (!token) return null;
  try {
    const res = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json() as { items?: { track: { name: string; artists: { name: string }[]; album: { images: { url: string }[] }; uri: string } }[] };
    const track = data.items?.[0]?.track;
    if (!track) return null;
    return {
      title: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      albumArt: track.album.images[2]?.url,
      uri: track.uri,
    };
  } catch {
    return null;
  }
}
