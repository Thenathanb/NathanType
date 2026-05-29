import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Word } from './Word';
import { useTestStore } from '../../stores/testStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { getCharStates } from '../../utils/calculateStats';

interface TypingAreaProps {
  onKeyPress: (key: string) => void;
  currentInput: string;
}

export function TypingArea({ onKeyPress, currentInput }: TypingAreaProps) {
  const { words, currentWordIndex, typedHistory, isActive, isComplete, mode, quoteSource } = useTestStore();
  const { fontSize, caretStyle, smoothCaret } = useSettingsStore();

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<HTMLDivElement>(null);
  const currentWordRef = useRef<HTMLDivElement>(null);

  const [translateX, setTranslateX] = useState(0);
  const [caretLeft, setCaretLeft] = useState(0);
  const [caretVisible, setCaretVisible] = useState(true);

  const charWidthRef = useRef(0);
  // Keep a mutable copy of translateX so the scroll effect always reads the latest value
  // without needing translateX as a dep (which would cause an infinite loop)
  const translateXRef = useRef(0);

  // Focus on mount and restart
  useEffect(() => {
    if (!isComplete) inputRef.current?.focus();
  }, [isComplete, words]);

  // Measure char width (monospace — all chars same width)
  useLayoutEffect(() => {
    if (!wordsRef.current || words.length === 0) return;
    const firstWord = wordsRef.current.children[0] as HTMLElement | null;
    if (!firstWord) return;
    const span = document.createElement('span');
    const style = window.getComputedStyle(firstWord);
    span.style.cssText = `visibility:hidden;position:absolute;font-family:${style.fontFamily};font-size:${style.fontSize};font-weight:${style.fontWeight}`;
    span.textContent = 'a';
    document.body.appendChild(span);
    charWidthRef.current = span.offsetWidth;
    document.body.removeChild(span);
  }, [words, fontSize]);

  // Update horizontal scroll + caret position on each character typed
  useEffect(() => {
    if (!currentWordRef.current || !containerRef.current || !charWidthRef.current) return;

    const wordLeft = currentWordRef.current.offsetLeft;
    const charLeft = wordLeft + currentInput.length * charWidthRef.current;
    const containerWidth = containerRef.current.offsetWidth;
    const target = containerWidth * 0.35;

    // Read from ref (not stale closure) so both values are computed consistently
    const curTx = translateXRef.current;
    const visualCaretLeft = charLeft - curTx;

    let newTx = curTx;
    if (visualCaretLeft > target) {
      newTx = curTx + (visualCaretLeft - target);
    } else if (visualCaretLeft < target * 0.5 && curTx > 0) {
      newTx = Math.max(0, curTx - (target * 0.5 - visualCaretLeft));
    }

    translateXRef.current = newTx;
    setTranslateX(newTx);
    setCaretLeft(charLeft - newTx); // caret and scroll always agree
  }, [currentWordIndex, currentInput, words]);

  // Reset on restart
  useEffect(() => {
    if (!isActive && !isComplete) {
      translateXRef.current = 0;
      setTranslateX(0);
      setCaretLeft(0);
    }
  }, [isActive, isComplete, words]);

  // Caret blink
  useEffect(() => {
    if (caretStyle === 'off') return;
    const id = setInterval(() => setCaretVisible(v => !v), 530);
    return () => clearInterval(id);
  }, [caretStyle]);

  // Reset blink on keypress (keep visible while typing)
  useEffect(() => {
    setCaretVisible(true);
  }, [currentInput, currentWordIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length > 0) onKeyPress(val[val.length - 1]);
    e.target.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ')              { e.preventDefault(); onKeyPress(' '); }
    else if (e.key === 'Backspace') { e.preventDefault(); onKeyPress('Backspace'); }
    else if (e.key === 'Tab')       { e.preventDefault(); onKeyPress('Tab'); }
    else if (e.key === 'Enter')     { e.preventDefault(); onKeyPress('Enter'); }
    else if (e.key === 'Escape')    { e.preventDefault(); onKeyPress('Escape'); }
  };

  const fontSizeMap: Record<string, string> = {
    small: '20px',
    medium: '32px',
    large: '42px',
    'extra-large': '52px',
  };

  const currentWord = words[currentWordIndex];
  const charStates = currentWord ? getCharStates(currentWord, currentInput) : [];
  const fontSizePx = parseFloat(fontSizeMap[fontSize] || '22px');

  return (
    <div style={{ width: '680px', maxWidth: '90vw' }}>
      {/* Typing capture input (hidden) */}
      <input
        ref={inputRef}
        type="text"
        className="typing-capture-input"
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        disabled={isComplete}
      />

      {/* Clipping container */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          overflow: 'hidden',
          width: '100%',
          height: `${fontSizePx * 2}px`,
          cursor: 'text',
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Scrolling words row */}
        <div
          ref={wordsRef}
          style={{
            whiteSpace: 'nowrap',
            position: 'absolute',
            top: '50%',
            transform: `translateX(${-translateX}px) translateY(-50%)`,
            transition: smoothCaret ? 'transform 0.1s ease-out' : 'none',
            fontSize: fontSizeMap[fontSize] || '22px',
            lineHeight: '1.8',
            fontFamily: 'var(--font-family, "Roboto Mono"), monospace',
          }}
        >
          {words.map((word, wi) => {
            let typed = '';
            let states = word.split('').map(() => 'pending' as const);

            if (wi < currentWordIndex && typedHistory[wi]) {
              typed = typedHistory[wi].typed;
              states = typedHistory[wi].charStates;
            } else if (wi === currentWordIndex) {
              typed = currentInput;
              states = charStates;
            }

            return (
              <Word
                key={`${word}-${wi}`}
                word={word}
                typed={typed}
                charStates={states}
                isActive={wi === currentWordIndex && isActive}
                isPast={wi < currentWordIndex}
                wordRef={wi === currentWordIndex ? currentWordRef : undefined}
              />
            );
          })}
        </div>

        {/* Caret */}
        {isActive && !isComplete && caretStyle !== 'off' && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              left: `${caretLeft}px`,
              width: 2,
              height: `${fontSizePx * 1.3}px`,
              backgroundColor: 'var(--caret-color)',
              opacity: caretVisible ? 1 : 0,
              transition: smoothCaret ? 'left 0.06s ease-out' : 'none',
              pointerEvents: 'none',
              borderRadius: 1,
            }}
          />
        )}
      </div>

      {/* Quote attribution */}
      {mode === 'quote' && quoteSource && (
        <div style={{ color: '#646669', fontSize: 13, textAlign: 'right', marginTop: 12, fontStyle: 'italic' }}>
          — {quoteSource}
        </div>
      )}

      {/* Not-started prompt */}
      {!isActive && !isComplete && (
        <div style={{ color: '#646669', fontSize: 13, textAlign: 'center', marginTop: 16, fontFamily: 'var(--font-family)' }}>
          click here or start typing
        </div>
      )}
    </div>
  );
}
