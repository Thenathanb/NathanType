import type { TypedWord, TestStats, CharState, WpmDataPoint } from '../types/index.js';

/**
 * Calculate WPM (Words Per Minute)
 * Standard formula: (characters / 5) / (time in minutes)
 * Only counts characters in correctly typed words
 */
export function calculateWpm(
  typedHistory: TypedWord[],
  timeElapsedMs: number
): number {
  if (timeElapsedMs === 0) return 0;

  const correctChars = typedHistory.reduce((acc, word) => {
    // Only count characters from fully correct words
    const isWordCorrect = word.charStates.every(
      (state) => state === 'correct'
    ) && word.typed === word.word;

    return acc + (isWordCorrect ? word.word.length : 0);
  }, 0);

  const timeInMinutes = timeElapsedMs / 1000 / 60;
  return Math.round((correctChars / 5) / timeInMinutes);
}

/**
 * Calculate Raw WPM
 * Same as WPM but includes all typed characters (correct or incorrect)
 */
export function calculateRawWpm(
  typedHistory: TypedWord[],
  timeElapsedMs: number
): number {
  if (timeElapsedMs === 0) return 0;

  const totalChars = typedHistory.reduce(
    (acc, word) => acc + word.typed.length,
    0
  );

  const timeInMinutes = timeElapsedMs / 1000 / 60;
  return Math.round((totalChars / 5) / timeInMinutes);
}

/**
 * Calculate accuracy percentage
 * (correct characters) / (total characters) * 100
 */
export function calculateAccuracy(typedHistory: TypedWord[]): number {
  if (typedHistory.length === 0) return 100;

  let correctChars = 0;
  let totalChars = 0;

  typedHistory.forEach((word) => {
    word.charStates.forEach((state) => {
      totalChars++;
      if (state === 'correct') {
        correctChars++;
      }
    });
  });

  if (totalChars === 0) return 100;
  return Math.round((correctChars / totalChars) * 100 * 100) / 100;
}

/**
 * Calculate consistency
 * Based on coefficient of variation of WPM over time
 * Lower variance = higher consistency
 */
export function calculateConsistency(wpmHistory: WpmDataPoint[]): number {
  if (wpmHistory.length < 2) return 100;

  const wpms = wpmHistory.map((point) => point.wpm);
  const mean = wpms.reduce((sum, wpm) => sum + wpm, 0) / wpms.length;

  if (mean === 0) return 100;

  const variance =
    wpms.reduce((sum, wpm) => sum + Math.pow(wpm - mean, 2), 0) / wpms.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / mean;

  // Map CV to 0-100 scale (lower CV = higher consistency)
  // CV of 0.3 or higher = 0 consistency, CV of 0 = 100 consistency
  const consistency = Math.max(0, 100 - coefficientOfVariation * 333);

  return Math.round(consistency);
}

/**
 * Count characters by state
 */
export function countCharacters(typedHistory: TypedWord[]) {
  let correct = 0;
  let incorrect = 0;
  let extra = 0;
  let missed = 0;

  typedHistory.forEach((word) => {
    word.charStates.forEach((state) => {
      switch (state) {
        case 'correct':
          correct++;
          break;
        case 'incorrect':
          incorrect++;
          break;
        case 'extra':
          extra++;
          break;
        case 'missed':
          missed++;
          break;
      }
    });

    // Count missed characters (characters in original word not typed)
    if (word.typed.length < word.word.length) {
      missed += word.word.length - word.typed.length;
    }
  });

  return { correct, incorrect, extra, missed };
}

/**
 * Calculate all statistics at once
 */
export function calculateAllStats(
  typedHistory: TypedWord[],
  wpmHistory: WpmDataPoint[],
  startTime: number,
  endTime: number
): TestStats {
  const timeElapsedMs = endTime - startTime;
  const timeElapsed = Math.round(timeElapsedMs / 1000);

  const wpm = calculateWpm(typedHistory, timeElapsedMs);
  const rawWpm = calculateRawWpm(typedHistory, timeElapsedMs);
  const accuracy = calculateAccuracy(typedHistory);
  const consistency = calculateConsistency(wpmHistory);
  const { correct, incorrect, extra, missed } = countCharacters(typedHistory);

  return {
    wpm,
    rawWpm,
    accuracy,
    consistency,
    correctChars: correct,
    incorrectChars: incorrect,
    extraChars: extra,
    missedChars: missed,
    timeElapsed,
  };
}

/**
 * Determine character states for a typed word
 */
export function getCharStates(originalWord: string, typedWord: string): CharState[] {
  const states: CharState[] = [];
  const maxLength = Math.max(originalWord.length, typedWord.length);

  for (let i = 0; i < maxLength; i++) {
    if (i >= originalWord.length) {
      // Extra characters typed
      states.push('extra');
    } else if (i >= typedWord.length) {
      // Missed characters (not typed yet)
      states.push('missed');
    } else if (originalWord[i] === typedWord[i]) {
      // Correct character
      states.push('correct');
    } else {
      // Incorrect character
      states.push('incorrect');
    }
  }

  return states;
}
