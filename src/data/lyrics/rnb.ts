export interface SongEntry {
  id: string; title: string; artist: string; genre: string;
  sections: { verse1: string; chorus: string; verse2?: string; full: string; };
}
export const rnbSongs: SongEntry[] = [
  { id: 'rnb1', title: 'placeholder', artist: 'artist', genre: 'rnb',
    sections: { verse1: 'lyrics coming soon.', chorus: 'lyrics coming soon.', full: 'lyrics coming soon.' } },
];
