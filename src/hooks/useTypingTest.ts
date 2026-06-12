import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTestStore } from '../stores/testStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useUserStore } from '../stores/userStore';
import type { TypedWord, TestResult, WpmDataPoint } from '../types/index.js';
import { getCharStates, calculateAllStats, calculateWpm, calculateRawWpm, calculateAccuracy } from '../utils/calculateStats';
import { generateTestWords, generateWords } from '../utils/wordGenerator';
import { useAuth, getPbEntry } from '../context/AuthContext';
import { saveTestResult, computeXpResult, incrementTestsStarted } from '../utils/firestoreService';
import { invalidateTestResultsCache } from './useTestResults';
import { getActiveFunboxWords } from '../utils/funbox/index';
import {
  CONTENT_FUNBOXES, MEME_FUNBOXES, MUSIC_FUNBOXES, isContentFunbox,
} from '../data/funbox/funbox';

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
    // new-mode state
    contentCategory,
    memeSubmode,
    songGenre,
    songSection,
    setContentLoading,
    setMemeLabel,
    setCurrentSong,
    contentFormatType,
    contentReloadKey,
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
    activeFunbox,
    ghostMode,
  } = useSettingsStore();

  const { addTestResult } = useUserStore();
  const { currentUser, userProfile } = useAuth();

  const [currentInput, setCurrentInput] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);

  const timerRef = useRef<number | undefined>(undefined);
  const wpmTrackerRef = useRef<number | undefined>(undefined);
  const prevErrorsRef = useRef(0);
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
  // Content-replacing funboxes are handled in the separate effect below
  useEffect(() => {
    if (activeFunbox && isContentFunbox(activeFunbox)) return; // handled separately

    if (mode === 'custom' && customText) {
      setWords(getActiveFunboxWords(customText.trim().split(/\s+/), activeFunbox));
      setQuoteSource(null);
      return;
    }

    if (mode === 'quote') {
      import('../utils/wordGenerator').then(({ getQuote }) => {
        const { words: qWords, source } = getQuote('medium');
        setWords(getActiveFunboxWords(qWords, activeFunbox));
        setQuoteSource(source);
      });
      return;
    }

    const newWords = generateTestWords(mode, { wordLimit, timeLimit, punctuation, numbers });
    setWords(getActiveFunboxWords(newWords, activeFunbox));
    setQuoteSource(null);
  }, [mode, wordLimit, timeLimit, punctuation, numbers, customText, activeFunbox]);

  // ── Funbox content loading (overrides base word list) ─────────
  useEffect(() => {
    if (!activeFunbox || !isContentFunbox(activeFunbox)) return;
    let cancelled = false;
    setContentLoading(true);

    const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    (async () => {
      try {
        let words: string[] = [];
        let source: string | null = null;

        // ── Text content ────────────────────────────────────────
        if (CONTENT_FUNBOXES.includes(activeFunbox)) {
          if (activeFunbox === 'books') {
            const { books } = await import('../data/content/books');
            const e = pick(books);
            words = e.excerpt.split(/\s+/).filter(Boolean);
            source = `from: ${e.title} — ${e.author}`;
          } else if (activeFunbox === 'messages') {
            const { messages } = await import('../data/content/messages');
            const e = pick(messages);
            words = e.text.split(/\s+/).filter(Boolean);
          } else if (activeFunbox === 'news') {
            const { newsExcerpts } = await import('../data/content/news');
            const e = pick(newsExcerpts);
            words = e.text.split(/\s+/).filter(Boolean);
            source = `source: ${e.source}`;
          } else if (activeFunbox === 'history') {
            const { historyExcerpts } = await import('../data/content/history');
            const e = pick(historyExcerpts);
            words = e.text.split(/\s+/).filter(Boolean);
            source = `${e.context} — ${e.year}`;
          } else if (activeFunbox === 'facts') {
            const { facts } = await import('../data/content/facts');
            const e = pick(facts);
            words = e.text.split(/\s+/).filter(Boolean);
            source = e.category;
          } else if (activeFunbox === 'philosophy') {
            const { philosophyQuotes } = await import('../data/content/philosophy');
            const e = pick(philosophyQuotes);
            words = e.text.split(/\s+/).filter(Boolean);
            source = `— ${e.philosopher}`;
          } else if (activeFunbox === 'movie-quotes') {
            const { movieQuotes } = await import('../data/content/moviequotes');
            const e = pick(movieQuotes);
            words = e.text.split(/\s+/).filter(Boolean);
            source = `${e.film} (${e.year})`;
          } else if (activeFunbox === 'wikipedia') {
            // Try live Wikipedia API first, fall back to local
            try {
              const res = await fetch('https://en.wikipedia.org/api/rest_v1/page/random/summary');
              if (!res.ok) throw new Error('fetch failed');
              const data = await res.json();
              const excerpt = (data.extract || '').slice(0, 300).trim();
              if (excerpt.length > 20) {
                words = excerpt.split(/\s+/).filter(Boolean);
                source = `wikipedia: ${data.title}`;
              } else throw new Error('too short');
            } catch {
              const { wikiExcerpts } = await import('../data/content/wikipedia');
              const e = pick(wikiExcerpts);
              words = e.text.split(/\s+/).filter(Boolean);
              source = `wikipedia: ${e.title}`;
            }
          }
        }

        // ── Meme content ────────────────────────────────────────
        if (MEME_FUNBOXES.includes(activeFunbox)) {
          let entry: { text: string; label: string } | null = null;
          if (activeFunbox === 'brainrot') {
            const { brainrot } = await import('../data/memes/brainrot');
            entry = pick(brainrot);
          } else if (activeFunbox === 'classic-memes') {
            const { classics } = await import('../data/memes/classics');
            entry = pick(classics);
          } else if (activeFunbox === 'gen-z') {
            const { genz } = await import('../data/memes/genz');
            entry = pick(genz);
          } else if (activeFunbox === 'italian-brainrot') {
            const { italian } = await import('../data/memes/italian');
            entry = pick(italian);
          } else if (activeFunbox === 'characters') {
            const { characters } = await import('../data/memes/characters');
            entry = pick(characters);
          }
          if (entry) {
            words = entry.text.split(/\s+/).filter(Boolean);
            source = entry.label;
          }
        }

        // ── Lyrics content ──────────────────────────────────────
        if (MUSIC_FUNBOXES.includes(activeFunbox)) {
          type SongEntry = { id: string; title: string; artist: string; genre: string; sections: { verse1: string; chorus: string; verse2?: string; full: string } };
          let songs: SongEntry[] = [];
          if (activeFunbox === 'hiphop-lyrics') songs = (await import('../data/lyrics/hiphop')).hiphopSongs;
          else if (activeFunbox === 'pop-lyrics') songs = (await import('../data/lyrics/pop')).popSongs;
          else if (activeFunbox === 'rnb-lyrics') songs = (await import('../data/lyrics/rnb')).rnbSongs;
          else if (activeFunbox === 'afrobeats-lyrics') songs = (await import('../data/lyrics/afrobeats')).afrobeatsSongs;

          if (songs.length > 0) {
            const song = pick(songs);
            const text = song.sections.verse1 || song.sections.full;
            words = text.split(/\s+/).filter(Boolean);
            source = `${song.title} — ${song.artist}`;
          }
        }

        if (!cancelled && words.length > 0) {
          setWords(words);
          setQuoteSource(source);
          setContentLoading(false);
        } else if (!cancelled) {
          setContentLoading(false);
        }
      } catch (err) {
        console.error('Funbox content load failed:', err);
        if (!cancelled) setContentLoading(false);
      }
    })();

    return () => { cancelled = true; };
  // contentReloadKey increments on reset/cancel so fresh content loads after every test
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFunbox, contentReloadKey]);

  // ── Content mode loading ─────────────────────────────────────
  useEffect(() => {
    if (mode !== 'content') return;
    let cancelled = false;
    setContentLoading(true);

    const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    (async () => {
      try {
        let words: string[] = [];
        let source: string | null = null;

        if (contentCategory === 'books') {
          const { books } = await import('../data/content/books');
          const e = pick(books);
          words = e.excerpt.split(/\s+/).filter(Boolean);
          source = `from: ${e.title} — ${e.author}`;
        } else if (contentCategory === 'messages') {
          const { messages } = await import('../data/content/messages');
          const e = pick(messages);
          words = e.text.split(/\s+/).filter(Boolean);
          source = null;
        } else if (contentCategory === 'news') {
          const { newsExcerpts } = await import('../data/content/news');
          const e = pick(newsExcerpts);
          words = e.text.split(/\s+/).filter(Boolean);
          source = `source: ${e.source}`;
        } else if (contentCategory === 'history') {
          const { historyExcerpts } = await import('../data/content/history');
          const e = pick(historyExcerpts);
          words = e.text.split(/\s+/).filter(Boolean);
          source = `${e.context} — ${e.year}`;
        } else if (contentCategory === 'facts') {
          const { facts } = await import('../data/content/facts');
          const e = pick(facts);
          words = e.text.split(/\s+/).filter(Boolean);
          source = e.category;
        }

        if (!cancelled) {
          setWords(words);
          setQuoteSource(source);
          setContentLoading(false);
        }
      } catch (err) {
        console.error('Failed to load content:', err);
        if (!cancelled) setContentLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [mode, contentCategory]);

  // ── Meme mode loading ────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'meme') return;
    let cancelled = false;
    setContentLoading(true);

    const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    (async () => {
      try {
        let entry: { text: string; label: string } | null = null;

        if (memeSubmode === 'brainrot') {
          const { brainrot } = await import('../data/memes/brainrot');
          entry = pick(brainrot);
        } else if (memeSubmode === 'classics') {
          const { classics } = await import('../data/memes/classics');
          entry = pick(classics);
        } else if (memeSubmode === 'genz') {
          const { genz } = await import('../data/memes/genz');
          entry = pick(genz);
        } else if (memeSubmode === 'italian') {
          const { italian } = await import('../data/memes/italian');
          entry = pick(italian);
        } else if (memeSubmode === 'characters') {
          const { characters } = await import('../data/memes/characters');
          entry = pick(characters);
        }

        if (!cancelled && entry) {
          const allWords = entry.text.split(/\s+/).filter(Boolean);
          setWords(contentFormatType === 'words' ? allWords.slice(0, wordLimit) : allWords);
          setQuoteSource(entry.label);
          setMemeLabel(entry.label);
          setContentLoading(false);
        }
      } catch (err) {
        console.error('Failed to load meme:', err);
        if (!cancelled) setContentLoading(false);
      }
    })();

    return () => { cancelled = true; };
  // contentReloadKey increments on reset/cancel to reload fresh content
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, memeSubmode, contentReloadKey, contentFormatType, wordLimit]);

  // ── Songs mode loading (library) ─────────────────────────────
  useEffect(() => {
    if (mode !== 'songs') return;
    let cancelled = false;
    setContentLoading(true);

    const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    (async () => {
      try {
        type SongEntry = { id: string; title: string; artist: string; genre: string; sections: { verse1: string; chorus: string; verse2?: string; full: string } };
        let songs: SongEntry[] = [];

        if (songGenre === 'hiphop') {
          songs = (await import('../data/lyrics/hiphop')).hiphopSongs;
        } else if (songGenre === 'pop') {
          songs = (await import('../data/lyrics/pop')).popSongs;
        } else if (songGenre === 'rnb') {
          songs = (await import('../data/lyrics/rnb')).rnbSongs;
        } else if (songGenre === 'afrobeats') {
          songs = (await import('../data/lyrics/afrobeats')).afrobeatsSongs;
        } else if (songGenre === 'rock') {
          songs = (await import('../data/lyrics/rock')).rockSongs;
        }

        if (cancelled || songs.length === 0) { setContentLoading(false); return; }

        const song = pick(songs);
        const sectionText =
          songSection === 'verse1' ? song.sections.verse1 :
          songSection === 'chorus' ? song.sections.chorus :
          songSection === 'verse2' ? (song.sections.verse2 ?? song.sections.full) :
          song.sections.full;

        const allWords = sectionText.split(/\s+/).filter(Boolean);
        setWords(contentFormatType === 'words' ? allWords.slice(0, wordLimit) : allWords);
        setCurrentSong({ title: song.title, artist: song.artist, genre: songGenre, section: songSection, source: 'library' });
        setQuoteSource(`${song.title} — ${song.artist}`);
        setContentLoading(false);
      } catch (err) {
        console.error('Failed to load song:', err);
        if (!cancelled) setContentLoading(false);
      }
    })();

    return () => { cancelled = true; };
  // contentReloadKey increments on reset/cancel to reload fresh content
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, songGenre, songSection, contentReloadKey, contentFormatType, wordLimit]);

  // Zen mode: append more words when running low
  useEffect(() => {
    if (mode !== 'zen' || !isActive) return;
    const remaining = words.length - currentWordIndex;
    if (remaining < ZEN_APPEND_THRESHOLD) {
      appendWords(generateWords(100, { punctuation, numbers }));
    }
  }, [mode, isActive, currentWordIndex, words.length, punctuation, numbers]);

  // Keep a stable ref to mode/settings for use inside intervals
  const settingsRef = useRef({ mode, timeLimit, wordLimit, punctuation, numbers, difficulty, activeFunbox, contentFormatType });
  useEffect(() => {
    settingsRef.current = { mode, timeLimit, wordLimit, punctuation, numbers, difficulty, activeFunbox, contentFormatType };
  });

  // ── Earthquake funbox: shuffle upcoming words every 3-5s ──────
  const earthquakeRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  useEffect(() => {
    if (activeFunbox !== 'earthquake' || !isActive || isComplete) {
      if (earthquakeRef.current) clearInterval(earthquakeRef.current);
      return;
    }
    const scheduleNext = () => {
      const delay = 3000 + Math.random() * 2000;
      earthquakeRef.current = setTimeout(() => {
        const { words: currentWords, currentWordIndex: cwi } = useTestStore.getState();
        if (cwi < currentWords.length - 2) {
          const upcoming = [...currentWords.slice(cwi + 1)];
          // Fisher-Yates shuffle of 3 random positions
          for (let i = 0; i < 3; i++) {
            const a = Math.floor(Math.random() * upcoming.length);
            const b = Math.floor(Math.random() * upcoming.length);
            [upcoming[a], upcoming[b]] = [upcoming[b], upcoming[a]];
          }
          useTestStore.getState().setWords([...currentWords.slice(0, cwi + 1), ...upcoming]);
        }
        scheduleNext();
      }, delay) as unknown as ReturnType<typeof setInterval>;
    };
    scheduleNext();
    return () => { if (earthquakeRef.current) clearTimeout(earthquakeRef.current as unknown as ReturnType<typeof setTimeout>); };
  }, [activeFunbox, isActive, isComplete]);

  const handleTestComplete = useCallback(() => {
    // Use getState() to read fresh store values — avoids stale closure from interval capture
    const state = useTestStore.getState();
    if (!state.startTime) return;

    if (timerRef.current) clearInterval(timerRef.current);
    if (wpmTrackerRef.current) clearInterval(wpmTrackerRef.current);
    state.endTest();

    const { typedHistory: th, wpmHistory: wh, startTime: st } = state;
    const s = settingsRef.current;
    // For time-based modes use the exact limit as the denominator so WPM doesn't
    // drift from setInterval jitter. All other modes use the actual wall-clock end time.
    const isTimeFormat = s.mode === 'time' ||
      ((s.mode === 'meme' || s.mode === 'songs') && s.contentFormatType === 'time');
    const endTime = isTimeFormat ? st! + s.timeLimit * 1000 : Date.now();
    const stats = calculateAllStats(th, wh, st!, endTime);

    const resultConfig = {
      mode: s.mode,
      timeLimit: s.timeLimit,
      wordLimit: s.wordLimit,
      language: 'english',
      punctuation: s.punctuation,
      numbers: s.numbers,
      difficulty: s.difficulty,
    };

    // Compare against live Firestore PBs (from AuthContext) rather than a local Zustand map
    // that was never hydrated from Firestore — fixes the "always new PB on first session" bug.
    const pbMode = s.mode === 'time' ? 'time' : s.mode === 'words' ? 'words' : null
    const pbMode2 = String(s.mode === 'time' ? s.timeLimit : s.wordLimit)
    const existingPb = pbMode && userProfile ? getPbEntry(userProfile, pbMode as 'time' | 'words', pbMode2) : null
    const isNewPb = !!pbMode && stats.wpm > (existingPb?.wpm ?? 0)

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

    // XP: compute locally so the results screen updates immediately,
    // then persist to Firestore in the background.
    if (currentUser) {
      const modeOption = s.mode === 'time' ? s.timeLimit : s.wordLimit;
      const testData = {
        wpm: stats.wpm,
        rawWpm: stats.rawWpm,
        accuracy: stats.accuracy,
        consistency: stats.consistency,
        mode: s.mode,
        modeOption,
        language: 'english',
        punctuation: s.punctuation,
        numbers: s.numbers,
        chars: {
          correct: stats.correctChars,
          incorrect: stats.incorrectChars,
          extra: stats.extraChars,
          missed: stats.missedChars,
        },
      };

      // Show XP instantly — pass streak so the displayed bonus matches what Firestore will write
      const currentTotalXp = userProfile?.xp ?? 0;
      const streakLength = userProfile?.streak?.length ?? 0;
      const xpResult = computeXpResult(currentTotalXp, testData, stats.timeElapsed, streakLength);
      useTestStore.getState().setXpResult(xpResult);

      // Persist to Firestore in the background
      saveTestResult(currentUser.uid, testData, stats.timeElapsed)
        .then(() => { invalidateTestResultsCache(currentUser.uid); })
        .catch((err) => { console.error('Firestore save failed:', err); });
    }
  }, [addTestResult, currentUser, userProfile]);

  // Keep a stable ref so intervals always call the latest version
  const handleTestCompleteRef = useRef(handleTestComplete);
  useEffect(() => { handleTestCompleteRef.current = handleTestComplete; });

  // Stable ref for handleRestart (defined later; updated after each render)
  const handleRestartRef = useRef<() => void>(() => {});

  // Timer for time mode — also fires for meme/songs when format is time
  useEffect(() => {
    const isTimeBased = mode === 'time' ||
      ((mode === 'meme' || mode === 'songs') && contentFormatType === 'time');
    if (isTimeBased && isActive && !isComplete) {
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
  }, [mode, isActive, isComplete, contentFormatType]);

  // WPM tracker — reads fresh store values via getState() so interval is stable
  useEffect(() => {
    if (isActive && !isComplete) {
      prevErrorsRef.current = 0;
      wpmTrackerRef.current = window.setInterval(() => {
        const { typedHistory: th, startTime: st } = useTestStore.getState();
        if (!st) return;
        const elapsed = Date.now() - st;
        const totalErrors = th.reduce((n, w) =>
          n + w.charStates.filter(s => s === 'incorrect' || s === 'extra').length, 0);
        const errorsThisSecond = Math.max(0, totalErrors - prevErrorsRef.current);
        prevErrorsRef.current = totalErrors;
        const currentWpm = calculateWpm(th, elapsed);
        const currentAcc = calculateAccuracy(th);
        const dataPoint: WpmDataPoint = {
          time: elapsed / 1000,
          wpm: currentWpm,
          rawWpm: calculateRawWpm(th, elapsed),
          accuracy: currentAcc,
          errors: errorsThisSecond,
        };
        addWpmDataPoint(dataPoint);

        // End test (show results) if below min thresholds (only after 3s)
        const { minSpeedEnabled: mse, minSpeed: ms, minAccuracyEnabled: mae, minAccuracy: ma } = useSettingsStore.getState();
        if (elapsed >= 3000) {
          if (mse && currentWpm > 0 && currentWpm < ms) {
            useTestStore.getState().setFailReason('min-speed');
            handleTestCompleteRef.current(); return;
          }
          if (mae && th.length >= 3 && currentAcc < ma) {
            useTestStore.getState().setFailReason('min-accuracy');
            handleTestCompleteRef.current(); return;
          }
        }
      }, 1000);
      return () => { if (wpmTrackerRef.current) clearInterval(wpmTrackerRef.current); };
    }
  }, [isActive, isComplete]);

  // Word mode / custom / quote / meme-words / songs-words end detection
  useEffect(() => {
    if (!isActive || isComplete || mode === 'zen') return;
    const isWordBased = mode === 'words' || mode === 'custom' || mode === 'quote' ||
      ((mode === 'meme' || mode === 'songs') && contentFormatType === 'words');
    if (isWordBased && currentWordIndex >= words.length) {
      handleTestComplete();
    }
    if (quickEnd && currentWordIndex === words.length - 1 && currentInput.length > 0) {
      handleTestComplete();
    }
  }, [mode, currentWordIndex, words.length, currentInput, isActive, isComplete, quickEnd, contentFormatType]);

  const handleKeyPress = useCallback((key: string, isError = false) => {
    // Normalize capital I → lowercase i
    if (key === 'I') key = 'i';

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
      if (currentUser) incrementTestsStarted(currentUser.uid);
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
    prevErrorsRef.current = 0;
    resetTest();
    setCurrentInput('');
    setTimeRemaining(timeLimit);

    // Content funboxes re-trigger via their own useEffect when resetTest fires
    if (activeFunbox && isContentFunbox(activeFunbox)) return;

    // meme/songs/content reload via their loading useEffect (contentReloadKey incremented by resetTest)
    if (mode === 'meme' || mode === 'songs' || mode === 'content') return;

    if (mode === 'quote') {
      import('../utils/wordGenerator').then(({ getQuote }) => {
        const { words: qWords, source } = getQuote('medium');
        setWords(getActiveFunboxWords(qWords, activeFunbox));
        setQuoteSource(source);
      });
      return;
    }
    if (mode === 'custom' && customText) {
      setWords(getActiveFunboxWords(customText.trim().split(/\s+/), activeFunbox));
      return;
    }
    const newWords = generateTestWords(mode, { wordLimit, timeLimit, punctuation, numbers });
    setWords(getActiveFunboxWords(newWords, activeFunbox));
  }, [mode, wordLimit, timeLimit, punctuation, numbers, customText, activeFunbox]);
  useEffect(() => { handleRestartRef.current = handleRestart; });

  const handleCancel = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (wpmTrackerRef.current) clearInterval(wpmTrackerRef.current);
    cancelTest();
    setCurrentInput('');
    setTimeRemaining(timeLimit);
    // meme/songs/content reload via their loading useEffect (contentReloadKey incremented by cancelTest)
    if (mode === 'meme' || mode === 'songs' || mode === 'content') return;
    const newWords = generateTestWords(mode, { wordLimit, timeLimit, punctuation, numbers });
    setWords(newWords);
  }, [mode, wordLimit, timeLimit, punctuation, numbers]);

  // Ghost caret: global char index the ghost should have reached based on PB WPM
  const pbMode = mode === 'time' ? 'time' : mode === 'words' ? 'words' : null;
  const pbMode2 = String(mode === 'time' ? timeLimit : wordLimit);
  const pbWpm = pbMode && userProfile ? (getPbEntry(userProfile, pbMode, pbMode2)?.wpm ?? 0) : 0;

  const ghostCharIndex = useMemo(() => {
    if (!ghostMode || !isActive || pbWpm <= 0) return -1;
    const { startTime } = useTestStore.getState();
    if (!startTime) return -1;
    const elapsedMin = (Date.now() - startTime) / 60000;
    return Math.floor(pbWpm * 5 * elapsedMin);
  }, [ghostMode, isActive, pbWpm, liveWpm]); // liveWpm re-runs this every second

  return {
    currentInput,
    timeRemaining,
    liveWpm,
    liveAccuracy,
    handleKeyPress,
    handleRestart,
    handleCancel,
    ghostCharIndex,
  };
}
