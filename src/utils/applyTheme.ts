import type { NTTheme } from '../data/themes/themes';

export function applyTheme(theme: NTTheme) {
  const r = document.documentElement.style;
  r.setProperty('--bg',    theme.bg);
  r.setProperty('--bg2',   theme.bg2);
  r.setProperty('--main',  theme.main);
  r.setProperty('--text',  theme.text);
  r.setProperty('--sub',   theme.sub);
  r.setProperty('--error', theme.error);
  // Legacy aliases
  r.setProperty('--bg-primary',     theme.bg);
  r.setProperty('--bg-secondary',   theme.bg2);
  r.setProperty('--accent',         theme.main);
  r.setProperty('--text-primary',   theme.text);
  r.setProperty('--text-secondary', theme.sub);
  r.setProperty('--correct',        theme.text);
  r.setProperty('--caret-color',    theme.main);

  // RGB theme uses a CSS animation on --main; all others use a static value
  if (theme.id === 'rgb') {
    document.documentElement.classList.add('theme-rgb');
  } else {
    document.documentElement.classList.remove('theme-rgb');
  }

  // Cache vars so index.html early-load script can restore them before React mounts
  try {
    localStorage.setItem('nt-theme-vars', JSON.stringify({
      bg: theme.bg, bg2: theme.bg2, main: theme.main,
      text: theme.text, sub: theme.sub, error: theme.error,
    }));
  } catch (_) { /* storage unavailable */ }

  // Update favicon to match theme
  try {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="${theme.bg2}"/><text x="16" y="23" font-family="'Courier New',monospace" font-size="18" font-weight="700" text-anchor="middle" fill="${theme.main}">nt</text></svg>`;
    const el = document.getElementById('favicon') as HTMLLinkElement | null;
    if (el) el.href = 'data:image/svg+xml,' + encodeURIComponent(svg);
  } catch (_) {}
}
