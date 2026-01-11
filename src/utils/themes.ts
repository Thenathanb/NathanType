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
