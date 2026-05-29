import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTestStore } from '../stores/testStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useUserStore } from '../stores/userStore';
import type { TypedWord, TestResult, WpmDataPoint } from '../types/index.js';
import { getCharStates, calculateAllStats, calculateWpm, calculateRawWpm, calculateAccuracy } from '../utils/calculateStats';
import { generateTestWords, generateWords } from '../utils/wordGenerator';
import { getPbKey } from '../stores/userStore';

const ZEN_APPEND_THRESHOLD = 30; // append more words when this many left

export function useTypingTest() {
  const {
    mode,
    timeLimit,
    wordLimit,
    words,
    currentWordIndex,
    typedHistory,
    startTime,
    isActive,
    isComplete,
    customText,
    setWords,
    appendWords,
    setCurrentWordIndex,
    addTypedWord,
    startTest,
    cancelTest,
    resetTest,
    addWpmDataPoint,
    clearWpmHistory,
    setQuoteSource,
  } = useTestStore();

  const {
    stopOnError,
    confidenceMode,
    quickEnd,
    difficulty,
    soundEnabled,
    errorSoundEnabled,
    punctuation,
    numbers,
  } = useSettingsStore();

  const { addTestResult, updateUserStats, checkAndUpdatePersonalBest } = useUserStore();

  const [currentInput, setCurrentInput] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);

  const timerRef = useRef<number | undefined>(undefined);
  const wpmTrackerRef = useRef<number | undefined>(undefined);
  const soundsRef = useRef<{ playKeySound: (v?: number) => void; playErrorSound: (v?: number) => void } | null>(null);

  // Lazy-load sounds module to avoid AudioContext issues on initial render
  useEffect(() => {
    import('../utils/sounds').then((mod) => {
      soundsRef.current = mod;
    });
  }, []);

  // Live WPM — computed on every render from current typedHistory + elapsed time
  const liveWpm = useMemo(() => {
    if (!isActive || !startTime || typedHistory.length === 0) return 0;
    const elapsed = Date.now() - startTime;
    return calculateWpm(typedHistory, elapsed);
  }, [isActive, startTime, typedHistory, currentInput]); // currentInput dep triggers recalc on each key

  const liveAccuracy = useMemo(() => {
    if (!isActive || typedHistory.length === 0) return 100;
    return calculateAccuracy(typedHistory);
  }, [isActive, typedHistory, currentInput]);

  // Initialize words on mount or when config changes
  useEffect(() => {
    if (mode === 'custom' && customText) {
      setWords(customText.trim().split(/\s+/));
      setQuoteSource(null);
      return;
    }

    if (mode === 'quote') {
      import('../utils/wordGenerator').then(({ getQuote }) => {
        const { words: qWords, source } = getQuote('medium');
        setWords(qWords);
        setQuoteSource(source);
      });
      return;
    }

    const newWords = generateTestWords(mode, {
      wordLimit,
      timeLimit,
      punctuation,
      numbers,
    });
    setWords(newWords);
    setQuoteSource(null);
  }, [mode, wordLimit, timeLimit, punctuation, numbers, customText]);

  // Zen mode: append more words when running low
  useEffect(() => {
    if (mode !== 'zen' || !isActive) return;
    const remaining = words.length - currentWordIndex;
    if (remaining < ZEN_APPEND_THRESHOLD) {
      appendWords(generateWords(100, { punctuation, numbers }));
    }
  }, [mode, isActive, currentWordIndex, words.length, punctuation, numbers]);

  // Keep a stable ref to mode/settings for use inside intervals
  const settingsRef = useRef({ mode, timeLimit, wordLimit, punctuation, numbers, difficulty });
  useEffect(() => {
    settingsRef.current = { mode, timeLimit, wordLimit, punctuation, numbers, difficulty };
  });

  const handleTestComplete = useCallback(() => {
    // Use getState() to read fresh store values — avoids stale closure from interval capture
    const state = useTestStore.getState();
    if (!state.startTime) return;

    const endTime = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    if (wpmTrackerRef.current) clearInterval(wpmTrackerRef.current);
    state.endTest();

    const { typedHistory: th, wpmHistory: wh, startTime: st } = state;
    const stats = calculateAllStats(th, wh, st!, endTime);

    const s = settingsRef.current;
    const resultConfig = {
      mode: s.mode,
      timeLimit: s.timeLimit,
      wordLimit: s.wordLimit,
      language: 'english',
      punctuation: s.punctuation,
      numbers: s.numbers,
      difficulty: s.difficulty,
    };

    const pbKey = getPbKey(resultConfig);
    const isNewPb = checkAndUpdatePersonalBest(pbKey, stats.wpm, stats.accuracy, stats.consistency);

    const result: TestResult = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      config: resultConfig,
      stats,
      wpmHistory: wh,
      typedHistory: th,
    };

    state.setCurrentResult(result, isNewPb);
    addTestResult(result);
    updateUserStats(stats.wpm, stats.accuracy, stats.timeElapsed);
  }, [checkAndUpdatePersonalBest, addTestResult, updateUserStats]);

  // Keep a stable ref so intervals always call the latest version
  const handleTestCompleteRef = useRef(handleTestComplete);
  useEffect(() => { handleTestCompleteRef.current = handleTestComplete; });

  // Timer for time mode
  useEffect(() => {
    if (mode === 'time' && isActive && !isComplete) {
      timerRef.current = window.setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleTestCompleteRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [mode, isActive, isComplete]);

  // WPM tracker — reads fresh store values via getState() so interval is stable
  useEffect(() => {
    if (isActive && !isComplete) {
      wpmTrackerRef.current = window.setInterval(() => {
        const { typedHistory: th, startTime: st } = useTestStore.getState();
        if (!st) return;
        const elapsed = Date.now() - st;
        const dataPoint: WpmDataPoint = {
          time: elapsed / 1000,
          wpm: calculateWpm(th, elapsed),
          rawWpm: calculateRawWpm(th, elapsed),
          accuracy: calculateAccuracy(th),
        };
        addWpmDataPoint(dataPoint);
      }, 1000);
      return () => { if (wpmTrackerRef.current) clearInterval(wpmTrackerRef.current); };
    }
  }, [isActive, isComplete]);

  // Word mode / custom / quote end detection
  useEffect(() => {
    if (!isActive || isComplete || mode === 'zen') return;
    if ((mode === 'words' || mode === 'custom' || mode === 'quote') && currentWordIndex >= words.length) {
      handleTestComplete();
    }
    if (quickEnd && currentWordIndex === words.length - 1 && currentInput.length > 0) {
      handleTestComplete();
    }
  }, [mode, currentWordIndex, words.length, currentInput, isActive, isComplete, quickEnd]);

  const handleKeyPress = useCallback((key: string, isError = false) => {
    // Escape — cancel the test
    if (key === 'Escape') {
      handleCancel();
      return;
    }

    // Tab — restart immediately (Monkeytype default)
    if (key === 'Tab') {
      handleRestart();
      return;
    }

    // Start on first real keypress
    let justStarted = false;
    if (!isActive && !isComplete && key !== 'Backspace') {
      startTest();
      clearWpmHistory();
      setTimeRemaining(timeLimit);
      justStarted = true;
    }

    // isActive is the stale closure value — use justStarted to not drop the first character
    if ((!isActive && !justStarted) || isComplete) return;

    const currentWord = words[currentWordIndex];
    if (!currentWord) return;

    if (key === 'Backspace') {
      if (confidenceMode === 'full') return;
      if (confidenceMode === 'partial' && currentInput.length === 0) return;
      if (soundEnabled && soundsRef.current) soundsRef.current.playKeySound(0.15);
      setCurrentInput((prev) => prev.slice(0, -1));
      return;
    }

    if (key === ' ') {
      if (currentInput.length === 0) return;

      const hasError = currentInput !== currentWord;
      if (difficulty === 'expert' && hasError) { handleRestart(); return; }

      if (soundEnabled && soundsRef.current) soundsRef.current.playKeySound();

      const typedWord: TypedWord = {
        word: currentWord,
        typed: currentInput,
        charStates: getCharStates(currentWord, currentInput),
        timestamp: Date.now(),
        duration: 0,
      };
      addTypedWord(typedWord);
      setCurrentInput('');
      setCurrentWordIndex(currentWordIndex + 1);
      return;
    }

    const newInput = currentInput + key;

    if (difficulty === 'master') {
      if (!currentWord.startsWith(newInput)) {
        if (errorSoundEnabled && soundsRef.current) soundsRef.current.playErrorSound();
        handleRestart();
        return;
      }
    }

    if (stopOnError === 'letter') {
      const expected = currentWord[currentInput.length];
      if (expected !== key) {
        if (errorSoundEnabled && soundsRef.current) soundsRef.current.playErrorSound();
        return;
      }
    }

    const charIsWrong = isError || (currentWord[currentInput.length] !== undefined && currentWord[currentInput.length] !== key);
    if (soundEnabled && soundsRef.current) {
      if (charIsWrong && errorSoundEnabled) {
        soundsRef.current.playErrorSound();
      } else {
        soundsRef.current.playKeySound();
      }
    }

    setCurrentInput(newInput);

    // Auto-end: finish instantly when the last character of the last word is typed
    const isLastWord = mode !== 'time' && mode !== 'zen' && currentWordIndex === words.length - 1;
    if (isLastWord && newInput === currentWord) {
      const finalWord: TypedWord = {
        word: currentWord,
        typed: newInput,
        charStates: getCharStates(currentWord, newInput),
        timestamp: Date.now(),
        duration: 0,
      };
      addTypedWord(finalWord);
      // Small timeout so the last character renders before results appear
      setTimeout(() => handleTestCompleteRef.current(), 50);
    }
  }, [
    isActive, isComplete, words, currentWordIndex, currentInput,
    confidenceMode, difficulty, stopOnError, timeLimit,
    soundEnabled, errorSoundEnabled,
  ]);

  const handleRestart = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (wpmTrackerRef.current) clearInterval(wpmTrackerRef.current);
    resetTest();
    setCurrentInput('');
    setTimeRemaining(timeLimit);

    if (mode === 'quote') {
      import('../utils/wordGenerator').then(({ getQuote }) => {
        const { words: qWords, source } = getQuote('medium');
        setWords(qWords);
        setQuoteSource(source);
      });
      return;
    }
    if (mode === 'custom' && customText) {
      setWords(customText.trim().split(/\s+/));
      return;
    }
    const newWords = generateTestWords(mode, { wordLimit, timeLimit, punctuation, numbers });
    setWords(newWords);
  }, [mode, wordLimit, timeLimit, punctuation, numbers, customText]);

  const handleCancel = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (wpmTrackerRef.current) clearInterval(wpmTrackerRef.current);
    cancelTest();
    setCurrentInput('');
    setTimeRemaining(timeLimit);
    const newWords = generateTestWords(mode, { wordLimit, timeLimit, punctuation, numbers });
    setWords(newWords);
  }, [mode, wordLimit, timeLimit, punctuation, numbers]);

  return {
    currentInput,
    timeRemaining,
    liveWpm,
    liveAccuracy,
    handleKeyPress,
    handleRestart,
    handleCancel,
  };
}
