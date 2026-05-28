import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, TestResult } from '../types/index.js';

export interface PersonalBest {
  wpm: number;
  accuracy: number;
  consistency: number;
  timestamp: number;
}

interface UserStore {
  user: UserProfile | null;
  isAuthenticated: boolean;
  testHistory: TestResult[];
  personalBests: Record<string, PersonalBest>;

  setUser: (user: UserProfile | null) => void;
  login: (user: UserProfile) => void;
  logout: () => void;
  addTestResult: (result: TestResult) => void;
  updateUserStats: (wpm: number, accuracy: number, timeElapsed: number) => void;
  // Returns true if this was a new personal best
  checkAndUpdatePersonalBest: (key: string, wpm: number, accuracy: number, consistency: number) => boolean;
}

export function getPbKey(config: { mode: string; timeLimit: number; wordLimit: number; punctuation: boolean; numbers: boolean }): string {
  return `${config.mode}-${config.timeLimit}-${config.wordLimit}-${config.punctuation ? 'p' : ''}-${config.numbers ? 'n' : ''}`;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      testHistory: [],
      personalBests: {},

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),

      addTestResult: (result) => set((state) => ({
        testHistory: [result, ...state.testHistory].slice(0, 200),
      })),

      updateUserStats: (wpm, accuracy, timeElapsed) => set((state) => {
        if (!state.user) return state;
        const n = state.user.stats.testsCompleted + 1;
        return {
          user: {
            ...state.user,
            stats: {
              testsCompleted: n,
              timeTyping: state.user.stats.timeTyping + timeElapsed,
              highestWpm: Math.max(state.user.stats.highestWpm, wpm),
              averageWpm: Math.round(((state.user.stats.averageWpm * (n - 1) + wpm) / n) * 100) / 100,
              averageAccuracy: Math.round(((state.user.stats.averageAccuracy * (n - 1) + accuracy) / n) * 100) / 100,
            },
          },
        };
      }),

      checkAndUpdatePersonalBest: (key, wpm, accuracy, consistency) => {
        const current = get().personalBests[key];
        const isNewPb = !current || wpm > current.wpm;
        if (isNewPb) {
          set((state) => ({
            personalBests: {
              ...state.personalBests,
              [key]: { wpm, accuracy, consistency, timestamp: Date.now() },
            },
          }));
        }
        return isNewPb;
      },
    }),
    { name: 'nathantype-user' }
  )
);
