export interface SoundCloudTrack {
  title: string;
  artist: string;
  thumbnailUrl?: string;
  trackUrl: string;
}

// Uses SoundCloud's public oEmbed endpoint — no API key required
export async function resolveTrackUrl(trackUrl: string): Promise<SoundCloudTrack | null> {
  try {
    const oembedUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(trackUrl)}&format=json`;
    const res = await fetch(oembedUrl);
    if (!res.ok) return null;
    const data = await res.json() as {
      title?: string;
      author_name?: string;
      thumbnail_url?: string;
    };
    if (!data.title) return null;

    // oEmbed title is often "Song — Artist" — try to split on "by" or "—"
    let title = data.title;
    let artist = data.author_name || '';

    const byMatch = title.match(/^(.+?)\s+by\s+(.+)$/i);
    if (byMatch) { title = byMatch[1].trim(); artist = byMatch[2].trim(); }

    return { title, artist, thumbnailUrl: data.thumbnail_url, trackUrl };
  } catch {
    return null;
  }
}
