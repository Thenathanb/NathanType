import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings } from '../types/index.js';

interface SettingsStore extends Settings {
  fontId: string;
  activeFunbox: string | null;
  resultSaving: boolean;
  setActiveFunbox: (id: string | null) => void;
  updateSettings: (settings: Partial<Settings & { fontId: string; resultSaving: boolean }>) => void;
  resetSettings: () => void;
}

const defaultSettings: Settings & { fontId: string; activeFunbox: string | null; resultSaving: boolean } = {
  // Visual
  theme: 'serika-dark',
  fontId: 'roboto-mono',
  fontSize: 'medium',
  fontFamily: 'Roboto Mono',
  caretStyle: 'line',
  caretSpeed: 'medium',
  smoothCaret: true,
  showLiveWpm: true,
  showLiveAccuracy: true,
  showTimer: true,

  // Sound
  soundEnabled: false,
  soundVolume: 50,
  errorSoundEnabled: false,

  // Behavior
  quickRestart: true,
  blindMode: false,
  focusMode: false,
  showCurrentWordLine: true,
  stopOnError: 'off',
  confidenceMode: 'off',
  quickEnd: false,

  // Language
  language: 'english',
  punctuation: false,
  numbers: false,

  // Difficulty
  difficulty: 'normal',

  // Layout
  wordDisplay: 'multi',

  // Favorites
  favoriteThemes: [],

  // Funbox
  activeFunbox: null,

  // Result saving
  resultSaving: true,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,
      setActiveFunbox: (id) => {
        set({ activeFunbox: id });
        try { if (id) localStorage.setItem('nt-funbox', id); else localStorage.removeItem('nt-funbox'); } catch (_) {}
      },
      updateSettings: (settings) => set((state) => ({ ...state, ...settings })),
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'nathantype-settings',
    }
  )
);
