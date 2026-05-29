import type { Theme } from '../types/index.js';
import themesData from '../data/themes/themes.json';

export const themes: Theme[] = themesData as Theme[];

/**
 * Apply theme to document root
 */
export function applyTheme(themeId: string) {
  const theme = themes.find((t) => t.id === themeId);
  if (!theme) return;

  const root = document.documentElement;
  root.style.setProperty('--bg-primary', theme.bgPrimary);
  root.style.setProperty('--bg-secondary', theme.bgSecondary);
  root.style.setProperty('--text-primary', theme.textPrimary);
  root.style.setProperty('--text-secondary', theme.textSecondary);
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--error', theme.error);
  root.style.setProperty('--correct', theme.correct);
  root.style.setProperty('--caret-color', theme.caretColor);
}

/**
 * Get theme by ID
 */
export function getThemeById(themeId: string): Theme | undefined {
  return themes.find((t) => t.id === themeId);
}

/**
 * Get all available themes
 */
export function getAllThemes(): Theme[] {
  return themes;
}

export const FONTS: { id: string; label: string; stack: string }[] = [
  { id: 'Roboto Mono',     label: 'Roboto Mono',     stack: "'Roboto Mono', monospace" },
  { id: 'JetBrains Mono',  label: 'JetBrains Mono',  stack: "'JetBrains Mono', monospace" },
  { id: 'Fira Code',       label: 'Fira Code',        stack: "'Fira Code', monospace" },
  { id: 'Source Code Pro', label: 'Source Code Pro',  stack: "'Source Code Pro', monospace" },
  { id: 'IBM Plex Mono',   label: 'IBM Plex Mono',    stack: "'IBM Plex Mono', monospace" },
  { id: 'Inconsolata',     label: 'Inconsolata',      stack: "'Inconsolata', monospace" },
  { id: 'Space Mono',      label: 'Space Mono',       stack: "'Space Mono', monospace" },
  { id: 'Ubuntu Mono',     label: 'Ubuntu Mono',      stack: "'Ubuntu Mono', monospace" },
];

export function applyFont(fontId: string) {
  const font = FONTS.find((f) => f.id === fontId);
  document.documentElement.style.setProperty(
    '--font-family',
    font ? font.stack : "'Roboto Mono', monospace"
  );
}
