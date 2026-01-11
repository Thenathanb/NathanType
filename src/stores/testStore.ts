import { create } from 'zustand';
import type { TestState, TestMode, TypedWord, TestConfig, TestResult, WpmDataPoint } from '../types/index.js';

interface TestStore extends TestState {
  setMode: (mode: TestMode) => void;
  setTimeLimit: (timeLimit: number) => void;
  setWordLimit: (wordLimit: number) => void;
  setWords: (words: string[]) => void;
  setCurrentWordIndex: (index: number) => void;
  setCurrentCharIndex: (index: number) => void;
  addTypedWord: (word: TypedWord) => void;
  startTest: () => void;
  endTest: () => void;
  resetTest: () => void;
  setConfig: (config: Partial<TestConfig>) => void;

  // Results
  currentResult: TestResult | null;
  setCurrentResult: (result: TestResult) => void;
  wpmHistory: WpmDataPoint[];
  addWpmDataPoint: (point: WpmDataPoint) => void;
  clearWpmHistory: () => void;
}

const defaultConfig: TestConfig = {
  mode: 'time',
  timeLimit: 30,
  wordLimit: 25,
  language: 'english',
  punctuation: false,
  numbers: false,
  difficulty: 'normal',
};

const initialState: TestState = {
  mode: 'time',
  timeLimit: 30,
  wordLimit: 25,
  words: [],
  currentWordIndex: 0,
  currentCharIndex: 0,
  typedHistory: [],
  startTime: null,
  endTime: null,
  isActive: false,
  isComplete: false,
  config: defaultConfig,
};

export const useTestStore = create<TestStore>((set) => ({
  ...initialState,
  currentResult: null,
  wpmHistory: [],

  setMode: (mode) => set({ mode }),
  setTimeLimit: (timeLimit) => set({ timeLimit }),
  setWordLimit: (wordLimit) => set({ wordLimit }),
  setWords: (words) => set({ words }),
  setCurrentWordIndex: (index) => set({ currentWordIndex: index }),
  setCurrentCharIndex: (index) => set({ currentCharIndex: index }),

  addTypedWord: (word) => set((state) => ({
    typedHistory: [...state.typedHistory, word],
  })),

  startTest: () => set({
    startTime: Date.now(),
    isActive: true,
    isComplete: false,
    typedHistory: [],
    currentWordIndex: 0,
    currentCharIndex: 0,
  }),

  endTest: () => set({
    endTime: Date.now(),
    isActive: false,
    isComplete: true,
  }),

  resetTest: () => set({
    ...initialState,
    mode: initialState.mode,
    timeLimit: initialState.timeLimit,
    wordLimit: initialState.wordLimit,
    config: initialState.config,
    wpmHistory: [],
    currentResult: null,
  }),

  setConfig: (config) => set((state) => ({
    config: { ...state.config, ...config },
  })),

  setCurrentResult: (result) => set({ currentResult: result }),

  addWpmDataPoint: (point) => set((state) => ({
    wpmHistory: [...state.wpmHistory, point],
  })),

  clearWpmHistory: () => set({ wpmHistory: [] }),
}));
