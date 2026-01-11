import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, TestResult } from '../types/index.js';

interface UserStore {
  user: UserProfile | null;
  isAuthenticated: boolean;
  testHistory: TestResult[];

  setUser: (user: UserProfile | null) => void;
  login: (user: UserProfile) => void;
  logout: () => void;
  addTestResult: (result: TestResult) => void;
  updateUserStats: (wpm: number, accuracy: number, timeElapsed: number) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      testHistory: [],

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      login: (user) => set({ user, isAuthenticated: true }),

      logout: () => set({ user: null, isAuthenticated: false }),

      addTestResult: (result) => set((state) => ({
        testHistory: [result, ...state.testHistory].slice(0, 100), // Keep last 100 tests
      })),

      updateUserStats: (wpm, accuracy, timeElapsed) => set((state) => {
        if (!state.user) return state;

        const newTestsCompleted = state.user.stats.testsCompleted + 1;
        const newTimeTyping = state.user.stats.timeTyping + timeElapsed;
        const newHighestWpm = Math.max(state.user.stats.highestWpm, wpm);

        // Calculate new average WPM
        const totalWpm = state.user.stats.averageWpm * state.user.stats.testsCompleted + wpm;
        const newAverageWpm = totalWpm / newTestsCompleted;

        // Calculate new average accuracy
        const totalAccuracy = state.user.stats.averageAccuracy * state.user.stats.testsCompleted + accuracy;
        const newAverageAccuracy = totalAccuracy / newTestsCompleted;

        return {
          user: {
            ...state.user,
            stats: {
              testsCompleted: newTestsCompleted,
              timeTyping: newTimeTyping,
              highestWpm: newHighestWpm,
              averageWpm: Math.round(newAverageWpm * 100) / 100,
              averageAccuracy: Math.round(newAverageAccuracy * 100) / 100,
            },
          },
        };
      }),
    }),
    {
      name: 'nathantype-user',
    }
  )
);
