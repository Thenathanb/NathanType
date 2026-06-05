import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TestState, TestMode, TypedWord, TestConfig, TestResult, WpmDataPoint, XpResult, ContentCategory, MemeSubmode, SongGenre, SongSection, SongData } from '../types/index.js';

interface TestStore extends TestState {
  quoteSource: string | null;
  customText: string | null;

  // Format control for meme/songs modes: 'time' or 'words'
  contentFormatType: 'time' | 'words';
  setContentFormatType: (t: 'time' | 'words') => void;
  // Incremented by resetTest/cancelTest so meme/songs loading effects re-fire on restart
  contentReloadKey: number;

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
  xpResult: XpResult | null;
  setXpResult: (result: XpResult | null) => void;

  // Per-mode secondary state
  contentCategory: ContentCategory;
  setContentCategory: (cat: ContentCategory) => void;
  memeSubmode: MemeSubmode;
  setMemeSubmode: (sub: MemeSubmode) => void;
  memeLabel: string | null;
  setMemeLabel: (label: string | null) => void;
  songGenre: SongGenre;
  setSongGenre: (genre: SongGenre) => void;
  songSection: SongSection;
  setSongSection: (section: SongSection) => void;
  currentSong: SongData | null;
  setCurrentSong: (song: SongData | null) => void;
  contentLoading: boolean;
  setContentLoading: (loading: boolean) => void;
  restartSignal: number;
  triggerRestart: () => void;
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

export const useTestStore = create<TestStore>()(
  persist(
    (set) => ({
  ...initialState,
  quoteSource: null,
  customText: null,
  currentResult: null,
  isNewPersonalBest: false,
  wpmHistory: [],
  xpResult: null,
  contentCategory: 'books',
  memeSubmode: 'brainrot',
  memeLabel: null,
  songGenre: 'hiphop',
  songSection: 'verse1',
  currentSong: null,
  contentLoading: false,
  restartSignal: 0,
  contentFormatType: 'words' as 'time' | 'words',
  contentReloadKey: 0,

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
    xpResult: null,
    memeLabel: null,
    quoteSource: state.quoteSource,
    customText: state.customText,
    contentCategory: state.contentCategory,
    memeSubmode: state.memeSubmode,
    songGenre: state.songGenre,
    songSection: state.songSection,
    currentSong: null,
    contentLoading: false,
    contentFormatType: state.contentFormatType,
    contentReloadKey: state.contentReloadKey + 1,
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
    xpResult: null,
    memeLabel: null,
    quoteSource: null,
    customText: state.customText,
    contentCategory: state.contentCategory,
    memeSubmode: state.memeSubmode,
    songGenre: state.songGenre,
    songSection: state.songSection,
    currentSong: null,
    contentLoading: false,
    contentFormatType: state.contentFormatType,
    contentReloadKey: state.contentReloadKey + 1,
  })),

  setConfig: (config) => set((state) => ({
    config: { ...state.config, ...config },
  })),

  setQuoteSource: (source) => set({ quoteSource: source }),
  setCustomText: (text) => set({ customText: text }),

  setCurrentResult: (result, isNewPb = false) => set({ currentResult: result, isNewPersonalBest: isNewPb }),
  setXpResult: (result) => set({ xpResult: result }),
  setContentFormatType: (contentFormatType) => set({ contentFormatType }),
  setContentCategory: (contentCategory) => set({ contentCategory }),
  setMemeSubmode: (memeSubmode) => set({ memeSubmode }),
  setMemeLabel: (memeLabel) => set({ memeLabel }),
  setSongGenre: (songGenre) => set({ songGenre }),
  setSongSection: (songSection) => set({ songSection }),
  setCurrentSong: (currentSong) => set({ currentSong }),
  setContentLoading: (contentLoading) => set({ contentLoading }),
  triggerRestart: () => set((state) => ({ restartSignal: state.restartSignal + 1 })),

  addWpmDataPoint: (point) => set((state) => ({
    wpmHistory: [...state.wpmHistory, point],
  })),

  clearWpmHistory: () => set({ wpmHistory: [] }),
    }),
    {
      name: 'nathantype-test-config',
      // Persist mode choices and sub-mode selections — never persist active test state
      partialize: (state) => ({
        mode: state.mode,
        timeLimit: state.timeLimit,
        wordLimit: state.wordLimit,
        contentCategory: state.contentCategory,
        memeSubmode: state.memeSubmode,
        songGenre: state.songGenre,
        songSection: state.songSection,
        contentFormatType: state.contentFormatType,
      }),
    }
  )
);
