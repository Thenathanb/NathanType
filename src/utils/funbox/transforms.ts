// ── Pure word-list transforms ────────────────────────────────────

export function applyBackwards(words: string[]): string[] {
  return words.map(w => w.split('').reverse().join(''));
}

export function applyAllCaps(words: string[]): string[] {
  return words.map(w => w.toUpperCase());
}

export function applyRandomCase(words: string[]): string[] {
  return words.map(w =>
    w.split('').map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase())).join('')
  );
}

export function applyPlusZero(words: string[]): string[] {
  return words.map(w => w + '0');
}

export function applyPlusOne(words: string[]): string[] {
  return words.map(w => w + '1');
}

export function applyChooChoo(words: string[]): string[] {
  return words.flatMap(w => [w, 'choo', 'choo']);
}

// ── Encoding transforms ─────────────────────────────────────────

const MORSE: Record<string, string> = {
  a:'.-', b:'-...', c:'-.-.', d:'-..', e:'.', f:'..-.', g:'--.', h:'....', i:'..',
  j:'.---', k:'-.-', l:'.-..', m:'--', n:'-.', o:'---', p:'.--.', q:'--.-', r:'.-.',
  s:'...', t:'-', u:'..-', v:'...-', w:'.--', x:'-..-', y:'-.--', z:'--..',
  '0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....',
  '6':'-....','7':'--...','8':'---..','9':'----.',
};

export function toMorse(word: string): string {
  return word.toLowerCase().split('').map(c => MORSE[c] || c).join(' ');
}

export function applyMorse(words: string[]): string[] {
  // Each morse word becomes a single "word" token in the test
  return words.map(toMorse);
}

export function toBinary(word: string): string {
  return word.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
}

export function applyBinary(words: string[]): string[] {
  return words.map(toBinary);
}

export function toHex(word: string): string {
  return word.split('').map(c => c.charCodeAt(0).toString(16)).join(' ');
}

export function applyHex(words: string[]): string[] {
  return words.map(toHex);
}

export function toAscii(word: string): string {
  return word.split('').map(c => c.charCodeAt(0).toString()).join(' ');
}

export function applyAscii(words: string[]): string[] {
  return words.map(toAscii);
}

export function applyRot13(words: string[]): string[] {
  return words.map(w =>
    w.replace(/[a-zA-Z]/g, c => {
      const base = c >= 'a' ? 97 : 65;
      return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
    })
  );
}

// ── Gibberish generator ─────────────────────────────────────────

const CONSONANTS = 'bcdfghjklmnprstvwxz';
const VOWELS = 'aeiou';

function makeGibberishWord(): string {
  const len = 3 + Math.floor(Math.random() * 5);
  let word = '';
  let useConsonant = Math.random() > 0.5;
  for (let i = 0; i < len; i++) {
    const pool = useConsonant ? CONSONANTS : VOWELS;
    word += pool[Math.floor(Math.random() * pool.length)];
    useConsonant = !useConsonant;
  }
  return word;
}

export function generateGibberish(count: number): string[] {
  return Array.from({ length: count }, makeGibberishWord);
}

// ── Mirror keyboard layout map ──────────────────────────────────

const MIRROR_MAP: Record<string, string> = {
  q:'p',w:'o',e:'i',r:'u',t:'y',y:'t',u:'r',i:'e',o:'w',p:'q',
  a:';',s:'l',d:'k',f:'j',g:'h',h:'g',j:'f',k:'d',l:'s',';':'a',
  z:'/',x:'.',c:',',v:'m',b:'n',n:'b',m:'v',',':'c','.':'x','/':'z',
};

export function applyMirror(key: string): string {
  return MIRROR_MAP[key] ?? MIRROR_MAP[key.toLowerCase()] ?? key;
}
