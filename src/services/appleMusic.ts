// ─────────────────────────────────────────────────────────────────
// Apple Music — MusicKit JS v3
//
// Setup:
//   1. Enrol in Apple Developer Program (https://developer.apple.com)
//   2. Create a MusicKit identifier and generate a developer token (JWT)
//   3. Add the MusicKit script to index.html:
//      <script src="https://js-cdn.music.apple.com/musickit/v3/musickit.js"></script>
//   4. Replace APPLE_DEVELOPER_TOKEN below with your signed JWT
// ─────────────────────────────────────────────────────────────────

const APPLE_DEVELOPER_TOKEN = 'PASTE_YOUR_APPLE_DEVELOPER_TOKEN_HERE';

declare global {
  interface Window {
    MusicKit?: {
      configure: (config: { developerToken: string; app: { name: string; build: string } }) => void;
      getInstance: () => AppleMusicInstance;
    };
  }
}

interface AppleMusicInstance {
  authorize: () => Promise<string>;
  unauthorize: () => Promise<void>;
  isAuthorized: boolean;
  api: { recentlyPlayed: (options?: object) => Promise<{ data: AppleMusicItem[] }> };
}

interface AppleMusicItem {
  attributes?: { name: string; artistName: string; artwork?: { url: string } };
}

export interface AppleTrack {
  title: string;
  artist: string;
  albumArt?: string;
}

let _instance: AppleMusicInstance | null = null;

export function initializeAppleMusic(): void {
  if (!window.MusicKit) {
    console.warn('MusicKit JS not loaded — add the script tag to index.html');
    return;
  }
  window.MusicKit.configure({
    developerToken: APPLE_DEVELOPER_TOKEN,
    app: { name: 'NathanType', build: '1.0.0' },
  });
  _instance = window.MusicKit.getInstance();
}

export async function authorizeAppleMusic(): Promise<boolean> {
  if (!_instance) initializeAppleMusic();
  if (!_instance) return false;
  try {
    await _instance.authorize();
    return _instance.isAuthorized;
  } catch {
    return false;
  }
}

export async function getRecentlyPlayed(): Promise<AppleTrack | null> {
  if (!_instance?.isAuthorized) return null;
  try {
    const result = await _instance.api.recentlyPlayed({ limit: 1 });
    const item = result.data[0];
    if (!item?.attributes) return null;
    const art = item.attributes.artwork?.url
      ?.replace('{w}', '32').replace('{h}', '32');
    return { title: item.attributes.name, artist: item.attributes.artistName, albumArt: art };
  } catch {
    return null;
  }
}

export function isConnected(): boolean {
  return !!_instance?.isAuthorized;
}

export async function disconnectAppleMusic(): Promise<void> {
  if (_instance) await _instance.unauthorize().catch(() => {});
}
