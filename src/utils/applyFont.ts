import { allFonts, type FontOption } from '../data/fonts/fonts';

const loaded = new Set<string>();

export function loadGoogleFont(font: FontOption) {
  if (!font.googleFont || !font.googleFamily || loaded.has(font.id)) return;
  loaded.add(font.id);
  const linkId = `nt-font-${font.id}`;
  if (document.getElementById(linkId)) return;
  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${font.googleFamily}:wght@400;500&display=swap`;
  document.head.appendChild(link);
}

export function applyFont(fontId: string) {
  const font = allFonts.find(f => f.id === fontId);
  if (!font) return;
  loadGoogleFont(font);
  // Set both --font-mono (new) and --font-family (legacy) so all components pick it up
  document.documentElement.style.setProperty('--font-mono', font.cssFamily);
  document.documentElement.style.setProperty('--font-family', font.cssFamily);
  document.documentElement.style.setProperty(
    '--font-ligatures',
    font.ligatures ? 'normal' : 'none'
  );
  try {
    localStorage.setItem('nt-font-family', font.cssFamily);
  } catch (_) { /* storage unavailable */ }
}
