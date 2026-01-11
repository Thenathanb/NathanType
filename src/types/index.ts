// Test Modes
export type TestMode = 'time' | 'words' | 'quote' | 'zen' | 'custom' | 'code';

// Character State
export type CharState = 'correct' | 'incorrect' | 'extra' | 'missed' | 'pending';

// Typed Character with metadata
export interface TypedChar {
  char: string;
  state: CharState;
  timestamp: number;
}

// Typed Word with history
export interface TypedWord {
  word: string;
  typed: string;
  charStates: CharState[];
  timestamp: number;
  duration: number; // time spent on this word in ms
}

// Test Configuration
export interface TestConfig {
  mode: TestMode;
  timeLimit: number; // seconds
  wordLimit: number;
  language: string;
  punctuation: boolean;
  numbers: boolean;
  difficulty: 'normal' | 'expert' | 'master';
}

// Test State
export interface TestState {
  mode: TestMode;
  timeLimit: number;
  wordLimit: number;
  words: string[];
  currentWordIndex: number;
  currentCharIndex: number;
  typedHistory: TypedWord[];
  startTime: number | null;
  endTime: number | null;
  isActive: boolean;
  isComplete: boolean;
  config: TestConfig;
}

// Statistics
export interface TestStats {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
  timeElapsed: number; // seconds
}

// WPM data point for graphing
export interface WpmDataPoint {
  time: number; // seconds from start
  wpm: number;
  rawWpm: number;
  accuracy: number;
}

// Test Result (saved after completion)
export interface TestResult {
  id: string;
  timestamp: number;
  config: TestConfig;
  stats: TestStats;
  wpmHistory: WpmDataPoint[];
  typedHistory: TypedWord[];
}

// Theme
export interface Theme {
  id: string;
  name: string;
  bgPrimary: string;
  bgSecondary: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  error: string;
  correct: string;
  caretColor: string;
}

// Settings
export interface Settings {
  // Visual
  theme: string;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  fontFamily: string;
  caretStyle: 'line' | 'block' | 'underline' | 'off';
  caretSpeed: 'slow' | 'medium' | 'fast' | 'off';
  smoothCaret: boolean;
  showLiveWpm: boolean;
  showTimer: boolean;

  // Sound
  soundEnabled: boolean;
  soundVolume: number; // 0-100
  errorSoundEnabled: boolean;

  // Behavior
  quickRestart: boolean; // Tab + Enter or just Tab
  blindMode: boolean; // hide error highlighting
  focusMode: boolean; // dim everything except typing area
  stopOnError: 'off' | 'letter' | 'word';
  confidenceMode: 'off' | 'partial' | 'full'; // disable backspace
  quickEnd: boolean; // end immediately when last word typed

  // Language
  language: string;
  punctuation: boolean;
  numbers: boolean;

  // Difficulty
  difficulty: 'normal' | 'expert' | 'master';
}

// User Profile
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  createdAt: number;
  stats: {
    testsCompleted: number;
    timeTyping: number; // total seconds
    highestWpm: number;
    averageWpm: number;
    averageAccuracy: number;
  };
}

// Leaderboard Entry
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  wpm: number;
  accuracy: number;
  consistency: number;
  timestamp: number;
  mode: TestMode;
  config: TestConfig;
}
