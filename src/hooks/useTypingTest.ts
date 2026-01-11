import { useState, useEffect, useCallback, useRef } from 'react';
import { useTestStore } from '../stores/testStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useUserStore } from '../stores/userStore';
import type { TypedWord, TestResult, WpmDataPoint } from '../types/index.js';
import { getCharStates, calculateAllStats, calculateWpm, calculateRawWpm, calculateAccuracy } from '../utils/calculateStats';
import { generateTestWords } from '../utils/wordGenerator';

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
    config,
    setWords,
    setCurrentWordIndex,
    addTypedWord,
    startTest,
    endTest,
    resetTest,
    setCurrentResult,
    addWpmDataPoint,
    clearWpmHistory,
    wpmHistory,
  } = useTestStore();

  const {
    quickRestart,
    stopOnError,
    confidenceMode,
    quickEnd,
    difficulty,
  } = useSettingsStore();

  const { addTestResult, updateUserStats } = useUserStore();

  const [currentInput, setCurrentInput] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [tabPressed, setTabPressed] = useState(false);

  const timerRef = useRef<number>();
  const wpmTrackerRef = useRef<number>();

  // Initialize words on mount or when config changes
  useEffect(() => {
    const newWords = generateTestWords(mode, {
      wordLimit,
      timeLimit,
      punctuation: config.punctuation,
      numbers: config.numbers,
    });
    setWords(newWords);
  }, [mode, wordLimit, timeLimit, config.punctuation, config.numbers]);

  // Timer for time mode
  useEffect(() => {
    if (mode === 'time' && isActive && !isComplete) {
      timerRef.current = window.setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleTestComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [mode, isActive, isComplete]);

  // WPM tracker (update every second)
  useEffect(() => {
    if (isActive && !isComplete && startTime) {
      wpmTrackerRef.current = window.setInterval(() => {
        const now = Date.now();
        const elapsed = now - startTime;

        const wpm = calculateWpm(typedHistory, elapsed);
        const rawWpm = calculateRawWpm(typedHistory, elapsed);
        const accuracy = calculateAccuracy(typedHistory);

        const dataPoint: WpmDataPoint = {
          time: elapsed / 1000,
          wpm,
          rawWpm,
          accuracy,
        };

        addWpmDataPoint(dataPoint);
      }, 1000);

      return () => {
        if (wpmTrackerRef.current) clearInterval(wpmTrackerRef.current);
      };
    }
  }, [isActive, isComplete, startTime, typedHistory]);

  // Handle test completion
  const handleTestComplete = useCallback(() => {
    if (!startTime) return;

    const endTime = Date.now();
    endTest();

    // Calculate final stats
    const stats = calculateAllStats(typedHistory, wpmHistory, startTime, endTime);

    // Create result
    const result: TestResult = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      config,
      stats,
      wpmHistory,
      typedHistory,
    };

    setCurrentResult(result);
    addTestResult(result);
    updateUserStats(stats.wpm, stats.accuracy, stats.timeElapsed);
  }, [startTime, typedHistory, wpmHistory, config, endTest, setCurrentResult, addTestResult, updateUserStats]);

  // Check if test should end
  useEffect(() => {
    if (!isActive || isComplete) return;

    // Word mode: check if we've completed all words
    if (mode === 'words' && currentWordIndex >= words.length) {
      handleTestComplete();
    }

    // Quick end: check if we've typed the last word
    if (quickEnd && currentWordIndex === words.length - 1 && currentInput.length > 0) {
      handleTestComplete();
    }
  }, [mode, currentWordIndex, words.length, currentInput, isActive, isComplete, quickEnd, handleTestComplete]);

  // Handle key press
  const handleKeyPress = useCallback((key: string) => {
    // Start test on first keypress
    if (!isActive && !isComplete) {
      startTest();
      clearWpmHistory();
      setTimeRemaining(timeLimit);
    }

    // Tab handling for restart
    if (key === 'Tab') {
      setTabPressed(true);
      return;
    }

    if (key === 'Enter' && tabPressed && quickRestart) {
      handleRestart();
      return;
    }

    // Reset tab pressed if any other key
    if (key !== 'Tab') {
      setTabPressed(false);
    }

    if (!isActive || isComplete) return;

    const currentWord = words[currentWordIndex];
    if (!currentWord) return;

    // Handle backspace
    if (key === 'Backspace') {
      if (confidenceMode === 'full') return; // No backspace allowed
      if (confidenceMode === 'partial' && currentInput.length === 0) return; // Can't go back to previous word

      setCurrentInput((prev) => prev.slice(0, -1));
      return;
    }

    // Handle space (word completion)
    if (key === ' ') {
      if (currentInput.length === 0) return; // Don't allow empty words

      // Check for errors in current word
      const hasError = currentInput !== currentWord;

      // Expert mode: fail on incorrect word
      if (difficulty === 'expert' && hasError) {
        handleRestart();
        return;
      }

      // Create typed word record
      const typedWord: TypedWord = {
        word: currentWord,
        typed: currentInput,
        charStates: getCharStates(currentWord, currentInput),
        timestamp: Date.now(),
        duration: 0, // TODO: track per-word timing
      };

      addTypedWord(typedWord);
      setCurrentInput('');
      setCurrentWordIndex(currentWordIndex + 1);

      // Check if this was the last word - the effect will handle completion
      return;
    }

    // Regular character input
    const newInput = currentInput + key;

    // Master mode: fail on any incorrect character
    if (difficulty === 'master') {
      const isCorrect = currentWord.startsWith(newInput);
      if (!isCorrect) {
        handleRestart();
        return;
      }
    }

    // Stop on error (letter mode)
    if (stopOnError === 'letter') {
      const charIndex = currentInput.length;
      if (currentWord[charIndex] !== key) {
        return; // Don't allow incorrect character
      }
    }

    setCurrentInput(newInput);
  }, [
    isActive,
    isComplete,
    words,
    currentWordIndex,
    currentInput,
    tabPressed,
    quickRestart,
    confidenceMode,
    difficulty,
    stopOnError,
    timeLimit,
  ]);

  // Restart test
  const handleRestart = useCallback(() => {
    resetTest();
    setCurrentInput('');
    setTimeRemaining(timeLimit);
    setTabPressed(false);

    // Generate new words
    const newWords = generateTestWords(mode, {
      wordLimit,
      timeLimit,
      punctuation: config.punctuation,
      numbers: config.numbers,
    });
    setWords(newWords);
  }, [mode, wordLimit, timeLimit, config]);

  return {
    currentInput,
    timeRemaining,
    handleKeyPress,
    handleRestart,
  };
}
