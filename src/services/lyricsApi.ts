const BASE = 'https://api.lyrics.ovh/v1';

export interface LyricsResult {
  lyrics: string;
  found: boolean;
}

export async function fetchLyrics(artist: string, title: string): Promise<LyricsResult> {
  try {
    const url = `${BASE}/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
    const res = await fetch(url);
    if (!res.ok) return { lyrics: '', found: false };
    const data = await res.json() as { lyrics?: string; error?: string };
    if (data.error || !data.lyrics) return { lyrics: '', found: false };
    // Normalise: replace \r\n with space, collapse runs of newlines to single space
    const clean = data.lyrics.replace(/\r\n/g, '\n').replace(/\n{2,}/g, '\n').trim();
    return { lyrics: clean, found: true };
  } catch {
    return { lyrics: '', found: false };
  }
}

// Convert raw lyrics string to a word array suitable for the typing engine.
// Line breaks become a space — single-row scrolling mode.
export function lyricsToWords(lyrics: string): string[] {
  return lyrics
    .split(/[\n\s]+/)
    .map(w => w.trim())
    .filter(Boolean);
}
