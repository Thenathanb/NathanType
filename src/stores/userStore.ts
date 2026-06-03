import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TestResult } from '../types/index.js';

interface UserStore {
  testHistory: TestResult[];
  addTestResult: (result: TestResult) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      testHistory: [],
      addTestResult: (result) => set((state) => ({
        testHistory: [result, ...state.testHistory].slice(0, 200),
      })),
    }),
    { name: 'nathantype-user' }
  )
);
