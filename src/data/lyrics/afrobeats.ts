export interface SongEntry {
  id: string; title: string; artist: string; genre: string;
  sections: { verse1: string; chorus: string; verse2?: string; full: string; };
}
export const afrobeatsSongs: SongEntry[] = [
  { id: 'afrobeats1', title: 'placeholder', artist: 'artist', genre: 'afrobeats',
    sections: { verse1: 'lyrics coming soon.', chorus: 'lyrics coming soon.', full: 'lyrics coming soon.' } },
];
