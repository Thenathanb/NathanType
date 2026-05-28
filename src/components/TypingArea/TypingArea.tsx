import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Word } from './Word';
import { Caret } from './Caret';
import { useTestStore } from '../../stores/testStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { getCharStates } from '../../utils/calculateStats';

interface TypingAreaProps {
  onKeyPress: (key: string) => void;
  currentInput: string;
}

const VISIBLE_ROWS = 3;

export function TypingArea({ onKeyPress, currentInput }: TypingAreaProps) {
  const {
    words,
    currentWordIndex,
    typedHistory,
    isActive,
    isComplete,
    mode,
    quoteSource,
  } = useTestStore();

  const { fontSize, focusMode } = useSettingsStore();

  const inputRef = useRef<HTMLInputElement>(null);
  const wordsRef = useRef<HTMLDivElement>(null);
  const currentWordRef = useRef<HTMLDivElement>(null);
  const lineHeightRef = useRef(0);
  const [translateY, setTranslateY] = useState(0);
  const [caretPos, setCaretPos] = useState({ left: 0, top: 0, height: 24 });

  // Focus input on mount and when test resets
  useEffect(() => {
    if (!isComplete) inputRef.current?.focus();
  }, [isComplete, words]);

  // Measure line height once after words render
  useLayoutEffect(() => {
    if (!wordsRef.current || words.length === 0) return;
    const firstEl = wordsRef.current.children[0] as HTMLElement | null;
    if (!firstEl) return;
    const style = window.getComputedStyle(firstEl);
    const mb = parseFloat(style.marginBottom) || 8;
    lineHeightRef.current = firstEl.offsetHeight + mb;
  }, [words, fontSize]);

  // Row-based scrolling: keep current word on row 1 (Monkeytype style)
  useEffect(() => {
    if (!currentWordRef.current || !lineHeightRef.current) return;
    const wordOffsetTop = currentWordRef.current.offsetTop;
    const lh = lineHeightRef.current;
    const row = Math.round(wordOffsetTop / lh);
    setTranslateY(row >= 1 ? -(row - 1) * lh : 0);
  }, [currentWordIndex]);

  // Reset scroll on restart
  useEffect(() => {
    if (!isActive && !isComplete) setTranslateY(0);
  }, [isActive, isComplete, words]);

  // Caret positioning (getBoundingClientRect accounts for CSS transform)
  useEffect(() => {
    if (!currentWordRef.current || !wordsRef.current) return;
    const wordEl = currentWordRef.current;
    const containerEl = wordsRef.current.parentElement!;

    const wordRect = wordEl.getBoundingClientRect();
    const containerRect = containerEl.getBoundingClientRect();

    const span = document.createElement('span');
    span.style.cssText = `visibility:hidden;position:absolute;font:${window.getComputedStyle(wordEl).font}`;
    span.textContent = currentInput || '';
    document.body.appendChild(span);
    const textWidth = span.offsetWidth;
    document.body.removeChild(span);

    setCaretPos({
      left: wordRect.left - containerRect.left + textWidth,
      top: wordRect.top - containerRect.top,
      height: wordRect.height,
    });
  }, [currentInput, currentWordIndex, words, translateY]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length > 0) onKeyPress(val[val.length - 1]);
    e.target.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ') { e.preventDefault(); onKeyPress(' '); }
    else if (e.key === 'Backspace') { e.preventDefault(); onKeyPress('Backspace'); }
    else if (e.key === 'Tab') { e.preventDefault(); onKeyPress('Tab'); }
    else if (e.key === 'Enter') { e.preventDefault(); onKeyPress('Enter'); }
    else if (e.key === 'Escape') { e.preventDefault(); onKeyPress('Escape'); }
  };

  const fontSizeClasses: Record<string, string> = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-3xl',
    'extra-large': 'text-4xl',
  };

  const currentWord = words[currentWordIndex];
  const charStates = currentWord ? getCharStates(currentWord, currentInput) : [];
  const containerHeight = lineHeightRef.current * VISIBLE_ROWS || 150;

  return (
    <div
      className={`relative w-full max-w-4xl mx-auto ${focusMode ? '' : ''}`}
      onClick={() => inputRef.current?.focus()}
    >
      <input
        ref={inputRef}
        type="text"
        className="hidden-input"
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        disabled={isComplete}
        aria-label="Typing input"
      />

      {/* Clipping container — fixed height, 3 rows */}
      <div
        className={`relative overflow-hidden cursor-pointer ${fontSizeClasses[fontSize]} font-mono`}
        style={{ height: containerHeight || undefined }}
      >
        {/* Scrolling words container */}
        <div
          ref={wordsRef}
          className="leading-relaxed no-select"
          style={{
            transform: `translateY(${translateY}px)`,
            transition: 'transform 0.15s ease-out',
          }}
        >
          {words.map((word, wordIndex) => {
            let typed = '';
            let states = word.split('').map(() => 'pending' as const);

            if (wordIndex < currentWordIndex && typedHistory[wordIndex]) {
              typed = typedHistory[wordIndex].typed;
              states = typedHistory[wordIndex].charStates;
            } else if (wordIndex === currentWordIndex) {
              typed = currentInput;
              states = charStates;
            }

            return (
              <Word
                key={`${word}-${wordIndex}`}
                word={word}
                typed={typed}
                charStates={states}
                isActive={wordIndex === currentWordIndex && isActive}
                isPast={wordIndex < currentWordIndex}
                wordRef={wordIndex === currentWordIndex ? currentWordRef : undefined}
              />
            );
          })}
        </div>

        {/* Caret */}
        {isActive && !isComplete && (
          <Caret left={caretPos.left} top={caretPos.top} height={caretPos.height} />
        )}

        {/* Top fade to hide scrolled rows */}
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{
            height: '2px',
            background: 'linear-gradient(to bottom, var(--bg-primary) 0%, transparent 100%)',
          }}
        />
      </div>

      {/* Quote attribution */}
      {mode === 'quote' && quoteSource && (
        <div className="text-right text-text-secondary text-sm mt-3 italic">
          — {quoteSource}
        </div>
      )}

      {/* Custom mode info */}
      {mode === 'custom' && (
        <div className="text-right text-text-secondary text-sm mt-3">
          custom text
        </div>
      )}

      {/* Instructions */}
      {!isActive && !isComplete && (
        <p className="text-center text-text-secondary text-sm mt-6">
          start typing to begin &nbsp;·&nbsp; <kbd className="opacity-60">Tab</kbd> to restart &nbsp;·&nbsp; <kbd className="opacity-60">Esc</kbd> to cancel
        </p>
      )}

      {isActive && !isComplete && (
        <p className="text-center text-text-secondary text-sm mt-4 opacity-40">
          <kbd>Tab</kbd> restart &nbsp;·&nbsp; <kbd>Esc</kbd> cancel
        </p>
      )}
    </div>
  );
}
