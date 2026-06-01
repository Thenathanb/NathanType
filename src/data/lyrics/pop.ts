export interface SongEntry {
  id: string; title: string; artist: string; genre: string;
  sections: { verse1: string; chorus: string; verse2?: string; full: string; };
}
export const popSongs: SongEntry[] = [
  { id: 'pop1', title: 'placeholder', artist: 'artist', genre: 'pop',
    sections: { verse1: 'lyrics coming soon.', chorus: 'lyrics coming soon.', full: 'lyrics coming soon.' } },
];
