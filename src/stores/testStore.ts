import { create } from 'zustand';
import type { TestState, TestMode, TypedWord, TestConfig, TestResult, WpmDataPoint } from '../types/index.js';

interface TestStore extends TestState {
  quoteSource: string | null;
  customText: string | null;

  setMode: (mode: TestMode) => void;
  setTimeLimit: (timeLimit: number) => void;
  setWordLimit: (wordLimit: number) => void;
  setWords: (words: string[]) => void;
  appendWords: (words: string[]) => void;
  setCurrentWordIndex: (index: number) => void;
  setCurrentCharIndex: (index: number) => void;
  addTypedWord: (word: TypedWord) => void;
  startTest: () => void;
  endTest: () => void;
  cancelTest: () => void;
  resetTest: () => void;
  setConfig: (config: Partial<TestConfig>) => void;
  setQuoteSource: (source: string | null) => void;
  setCustomText: (text: string | null) => void;

  currentResult: TestResult | null;
  isNewPersonalBest: boolean;
  setCurrentResult: (result: TestResult, isNewPb?: boolean) => void;
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
  quoteSource: null,
  customText: null,
  currentResult: null,
  isNewPersonalBest: false,
  wpmHistory: [],

  setMode: (mode) => set({ mode }),
  setTimeLimit: (timeLimit) => set({ timeLimit }),
  setWordLimit: (wordLimit) => set({ wordLimit }),
  setWords: (words) => set({ words }),
  appendWords: (words) => set((state) => ({ words: [...state.words, ...words] })),
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

  cancelTest: () => set((state) => ({
    ...initialState,
    mode: state.mode,
    timeLimit: state.timeLimit,
    wordLimit: state.wordLimit,
    config: state.config,
    wpmHistory: [],
    currentResult: null,
    isNewPersonalBest: false,
    quoteSource: state.quoteSource,
    customText: state.customText,
  })),

  resetTest: () => set((state) => ({
    ...initialState,
    mode: state.mode,
    timeLimit: state.timeLimit,
    wordLimit: state.wordLimit,
    config: state.config,
    wpmHistory: [],
    currentResult: null,
    isNewPersonalBest: false,
    quoteSource: null,
    customText: state.customText,
  })),

  setConfig: (config) => set((state) => ({
    config: { ...state.config, ...config },
  })),

  setQuoteSource: (source) => set({ quoteSource: source }),
  setCustomText: (text) => set({ customText: text }),

  setCurrentResult: (result, isNewPb = false) => set({ currentResult: result, isNewPersonalBest: isNewPb }),

  addWpmDataPoint: (point) => set((state) => ({
    wpmHistory: [...state.wpmHistory, point],
  })),

  clearWpmHistory: () => set({ wpmHistory: [] }),
}));
