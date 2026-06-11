export interface FunboxOption {
  id: string;
  name: string;
  description: string;
  category: 'content' | 'meme' | 'music' | 'challenge';
  requiresSetup?: boolean;
}

// Content funboxes: replace the word list with curated text
export const CONTENT_FUNBOXES = [
  'books', 'messages', 'news', 'history', 'facts',
  'philosophy', 'movie-quotes', 'wikipedia',
];

// Meme funboxes: replace with meme text
export const MEME_FUNBOXES = [
  'brainrot', 'italian-brainrot', 'characters', 'classic-memes', 'gen-z',
];

// Music funboxes: replace with lyrics
export const MUSIC_FUNBOXES = [
  'hiphop-lyrics', 'pop-lyrics', 'rnb-lyrics', 'afrobeats-lyrics',
  'spotify', 'apple-music', 'soundcloud',
];

// Word-pool funboxes: replace the word dictionary with a themed vocabulary (synchronous)
export const WORD_POOL_FUNBOXES = [
  'classic-brainrot', 'character-brainrot',
];

// Transform funboxes: modify words in-place (pure, synchronous)
export const TRANSFORM_FUNBOXES = [
  'backwards', 'all-caps', 'random-case', 'nospace', 'plus-zero', 'plus-one',
  'choo-choo', 'morse', 'binary', 'hexadecimal', 'ascii', 'rot13', 'gibberish',
];

// Challenge funboxes: modify test behavior
export const CHALLENGE_FUNBOXES = [
  'earthquake', 'read-ahead', 'memory', 'read-ahead-hard',
  'weakspot', 'layout-mirror', 'instant-messaging',
];

export const allFunboxes: FunboxOption[] = [
  // ── CONTENT ────────────────────────────────────────────────────
  { id: 'books',          name: 'books',          description: 'Type excerpts from classic literature.',                              category: 'content' },
  { id: 'messages',       name: 'messages',        description: 'Type realistic text messages and DMs.',                              category: 'content' },
  { id: 'news',           name: 'news',            description: 'Type real current news headlines and summaries.',                    category: 'content' },
  { id: 'history',        name: 'history',         description: 'Type famous speeches and historical moments.',                       category: 'content' },
  { id: 'facts',          name: 'facts',           description: 'Type surprising and interesting facts.',                             category: 'content' },
  { id: 'philosophy',     name: 'philosophy',      description: 'Type quotes from great thinkers and philosophers.',                  category: 'content' },
  { id: 'movie-quotes',   name: 'movie quotes',    description: 'Type iconic lines from classic and modern films.',                   category: 'content' },
  { id: 'wikipedia',      name: 'wikipedia',       description: 'Type the opening paragraph of a random Wikipedia article.',          category: 'content' },

  // ── MEME ───────────────────────────────────────────────────────
  { id: 'classic-brainrot',   name: 'classic brainrot',   description: 'Replace words with gen alpha slang, streamer vocab, and brainrot terminology.',    category: 'meme' },
  { id: 'character-brainrot', name: 'character brainrot', description: 'Replace words with iconic character names from anime, games, and pop culture.',      category: 'meme' },
  { id: 'brainrot',       name: 'brainrot',        description: 'Type general brainrot and internet culture text.',                   category: 'meme' },
  { id: 'italian-brainrot', name: 'italian brainrot', description: 'Type the lore of Bombardino, Tralalero and friends.',            category: 'meme' },
  { id: 'characters',     name: 'characters',      description: 'Type monologues from famous internet characters.',                   category: 'meme' },
  { id: 'classic-memes',  name: 'classic memes',   description: 'Type the text of legendary internet memes.',                        category: 'meme' },
  { id: 'gen-z',          name: 'gen z',           description: 'Type authentic gen z voice and dialect text.',                      category: 'meme' },

  // ── MUSIC ──────────────────────────────────────────────────────
  { id: 'hiphop-lyrics',  name: 'hip-hop',         description: 'Type verses from iconic hip-hop tracks.',                           category: 'music' },
  { id: 'pop-lyrics',     name: 'pop',             description: 'Type choruses and verses from popular pop songs.',                   category: 'music' },
  { id: 'rnb-lyrics',     name: 'r&b',             description: 'Type smooth R&B verses and choruses.',                              category: 'music' },
  { id: 'afrobeats-lyrics', name: 'afrobeats',     description: 'Type verses from Afrobeats and Afropop bangers.',                   category: 'music' },
  { id: 'spotify',        name: 'spotify',         description: 'Type lyrics from your recently played Spotify tracks.',             category: 'music',     requiresSetup: true },
  { id: 'apple-music',    name: 'apple music',     description: 'Type lyrics from your Apple Music listening history.',             category: 'music',     requiresSetup: true },
  { id: 'soundcloud',     name: 'soundcloud',      description: 'Paste a SoundCloud URL to type its lyrics.',                        category: 'music',     requiresSetup: true },

  // ── CHALLENGE ──────────────────────────────────────────────────
  { id: 'backwards',      name: 'backwards',       description: 'Type all words spelled backwards.',                                 category: 'challenge' },
  { id: 'all-caps',       name: 'ALL CAPS',        description: 'Every word is in UPPERCASE.',                                       category: 'challenge' },
  { id: 'random-case',    name: 'rAnDoMcAsE',      description: 'rAnDoMlY aLtErNaTeS cAsE on every character.',                     category: 'challenge' },
  { id: 'nospace',        name: 'nospace',         description: 'Typeallwordswithnospacesbetweenthem.',                              category: 'challenge' },
  { id: 'plus-zero',      name: 'plus zero',       description: 'Adds a 0 after every word.',                                        category: 'challenge' },
  { id: 'plus-one',       name: 'plus one',        description: 'Adds a 1 after every word.',                                        category: 'challenge' },
  { id: 'choo-choo',      name: 'choo choo',       description: 'Adds "choo choo" between every word.',                             category: 'challenge' },
  { id: 'morse',          name: 'morse',           description: 'Type words converted into Morse code.',                             category: 'challenge' },
  { id: 'binary',         name: 'binary',          description: 'Type words converted to binary.',                                   category: 'challenge' },
  { id: 'hexadecimal',    name: 'hexadecimal',     description: 'Type words converted to hexadecimal.',                              category: 'challenge' },
  { id: 'ascii',          name: 'ascii',           description: 'Type the ASCII decimal codes of each character.',                   category: 'challenge' },
  { id: 'rot13',          name: 'rot13',           description: 'Every letter is shifted 13 positions (ROT13).',                     category: 'challenge' },
  { id: 'gibberish',      name: 'gibberish',       description: 'Type randomly generated nonsense words.',                           category: 'challenge' },
  { id: 'earthquake',     name: 'earthquake',      description: 'Words randomly shift position mid-test.',                           category: 'challenge' },
  { id: 'read-ahead',     name: 'read ahead',      description: 'Shows upcoming words slightly highlighted.',                        category: 'challenge' },
  { id: 'memory',         name: 'memory',          description: 'Words disappear after you type them.',                              category: 'challenge' },
  { id: 'read-ahead-hard', name: 'read ahead hard', description: 'Shows only 1 upcoming word at a time.',                           category: 'challenge' },
  { id: 'weakspot',       name: 'weakspot',        description: 'Focus test on your most frequently missed keys.',                   category: 'challenge' },
  { id: 'layout-mirror',  name: 'layout mirror',   description: 'Mirrors the keyboard layout horizontally.',                         category: 'challenge' },
  { id: 'instant-messaging', name: 'instant msg',  description: 'Words arrive one by one like a typing indicator.',                 category: 'challenge' },
];

export function getFunboxById(id: string): FunboxOption | undefined {
  return allFunboxes.find(f => f.id === id);
}

export function isContentFunbox(id: string): boolean {
  return CONTENT_FUNBOXES.includes(id) || MEME_FUNBOXES.includes(id) || MUSIC_FUNBOXES.includes(id);
}

export function isTransformFunbox(id: string): boolean {
  return TRANSFORM_FUNBOXES.includes(id);
}
