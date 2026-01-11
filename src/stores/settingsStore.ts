import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings } from '../types/index.js';

interface SettingsStore extends Settings {
  updateSettings: (settings: Partial<Settings>) => void;
  resetSettings: () => void;
}

const defaultSettings: Settings = {
  // Visual
  theme: 'serika-dark',
  fontSize: 'medium',
  fontFamily: 'Roboto Mono',
  caretStyle: 'line',
  caretSpeed: 'medium',
  smoothCaret: true,
  showLiveWpm: true,
  showTimer: true,

  // Sound
  soundEnabled: false,
  soundVolume: 50,
  errorSoundEnabled: false,

  // Behavior
  quickRestart: true,
  blindMode: false,
  focusMode: false,
  stopOnError: 'off',
  confidenceMode: 'off',
  quickEnd: false,

  // Language
  language: 'english',
  punctuation: false,
  numbers: false,

  // Difficulty
  difficulty: 'normal',
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,
      updateSettings: (settings) => set((state) => ({ ...state, ...settings })),
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'nathantype-settings',
    }
  )
);
