import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Word } from './Word';
import { useTestStore } from '../../stores/testStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { getCharStates } from '../../utils/calculateStats';
import { isContentFunbox } from '../../data/funbox/funbox';
import type { CharState } from '../../types/index.js';

interface TypingAreaProps {
  onKeyPress: (key: string) => void;
  currentInput: string;
  ghostCharIndex?: number;
}

const VISIBLE_ROWS = 3;

export function TypingArea({ onKeyPress, currentInput, ghostCharIndex = -1 }: TypingAreaProps) {
  const { words, currentWordIndex, typedHistory, isActive, isComplete, mode, quoteSource, contentLoading } = useTestStore();
  const { fontSize, caretStyle, smoothCaret, activeFunbox, wordDisplay } = useSettingsStore();

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<HTMLDivElement>(null);
  const currentWordRef = useRef<HTMLDivElement>(null);

  // scroll mode state
  const [translateX, setTranslateX] = useState(0);
  const [caretLeft, setCaretLeft] = useState(0);
  const charWidthRef = useRef(0);
  const translateXRef = useRef(0);

  // multi mode state
  const [translateY, setTranslateY] = useState(0);
  const [caretPos, setCaretPos] = useState({ left: 0, top: 0 });

  const [caretVisible, setCaretVisible] = useState(true);
  const [ghostCaretPos, setGhostCaretPos] = useState({ left: 0, top: 0, visible: false });

  const fontSizeMap: Record<string, string> = {
    small: '24px',
    medium: '32px',
    large: '48px',
    'extra-large': '60px',
  };
  const fontSizePx = parseFloat(fontSizeMap[fontSize] || '22px');
  const lineHeight = fontSizePx * 2; // matches lineHeight: 2 below

  // Focus on mount and restart
  useEffect(() => {
    if (!isComplete) inputRef.current?.focus();
  }, [isComplete, words]);

  // ── Measure char width (shared between both modes) ──────────────────────────
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
  }, [words, fontSize, wordDisplay]);

  // ── Scroll mode: horizontal scroll + caret ──────────────────────────────────
  useEffect(() => {
    if (wordDisplay !== 'scroll') return;
    if (!currentWordRef.current || !containerRef.current || !charWidthRef.current) return;
    const wordLeft = currentWordRef.current.offsetLeft;
    const charLeft = wordLeft + currentInput.length * charWidthRef.current;
    const containerWidth = containerRef.current.offsetWidth;
    const target = containerWidth * 0.35;

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
    setCaretLeft(charLeft - newTx);
  }, [currentWordIndex, currentInput, words, wordDisplay]);

  // ── Multi mode: vertical scroll + caret ─────────────────────────────────────
  useEffect(() => {
    if (wordDisplay !== 'multi') return;
    if (!currentWordRef.current || !wordsRef.current) return;

    const wordEl = currentWordRef.current;
    const wordTop = wordEl.offsetTop;
    const wordLeft = wordEl.offsetLeft;
    const caretX = wordLeft + currentInput.length * (charWidthRef.current || 0);

    // We keep the current word on row 1 (0-indexed) of the visible window
    // so there's always one row of context above and one below
    const targetRowOffset = lineHeight; // one row below top
    const newTy = Math.max(0, wordTop - targetRowOffset);

    setTranslateY(newTy);
    setCaretPos({ left: caretX, top: wordTop - newTy + lineHeight * 0.5 });
  }, [currentWordIndex, currentInput, words, wordDisplay, lineHeight]);

  // Ghost caret position
  useEffect(() => {
    if (ghostCharIndex < 0 || !wordsRef.current || words.length === 0) {
      setGhostCaretPos(p => ({ ...p, visible: false }));
      return;
    }
    // Map global char index to (wordIndex, charOffset)
    let remaining = ghostCharIndex;
    let ghostWordIdx = 0;
    for (let i = 0; i < words.length; i++) {
      const wLen = words[i].length + 1; // +1 for space
      if (remaining < wLen) { ghostWordIdx = i; break; }
      remaining -= wLen;
      ghostWordIdx = i;
    }
    const charOffset = Math.min(remaining, words[ghostWordIdx]?.length ?? 0);
    const wordEl = wordsRef.current.children[ghostWordIdx] as HTMLElement | null;
    if (!wordEl) { setGhostCaretPos(p => ({ ...p, visible: false })); return; }
    const gLeft = wordEl.offsetLeft + charOffset * (charWidthRef.current || 0);
    const gTop = wordEl.offsetTop;
    setGhostCaretPos({ left: gLeft, top: gTop - translateY, visible: true });
  }, [ghostCharIndex, words, translateY]);

  // Reset on restart
  useEffect(() => {
    if (!isActive && !isComplete) {
      translateXRef.current = 0;
      setTranslateX(0);
      setCaretLeft(0);
      setTranslateY(0);
      setCaretPos({ left: 0, top: 0 });
    }
  }, [isActive, isComplete, words]);

  // Caret blink
  useEffect(() => {
    if (caretStyle === 'off') return;
    const id = setInterval(() => setCaretVisible(v => !v), 530);
    return () => clearInterval(id);
  }, [caretStyle]);

  useEffect(() => { setCaretVisible(true); }, [currentInput, currentWordIndex]);

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

  const currentWord = words[currentWordIndex];
  const charStates = currentWord ? getCharStates(currentWord, currentInput) : [];

  const wordElements = words.map((word, wi) => {
    let typed = '';
    let states: CharState[] = word.split('').map(() => 'pending' as const);

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
        wordIndex={wi}
        currentWordIndex={currentWordIndex}
        activeFunbox={activeFunbox}
      />
    );
  });

  const isMulti = wordDisplay === 'multi';
  const containerHeight = isMulti ? lineHeight * VISIBLE_ROWS : fontSizePx * 2;

  return (
    <div style={{ width: '1100px', maxWidth: '92vw' }}>
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

      <div
        ref={containerRef}
        style={{
          position: 'relative',
          overflow: 'hidden',
          width: '100%',
          height: `${containerHeight}px`,
          cursor: 'text',
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {isMulti ? (
          /* ── Multi-row word-wrap layout ── */
          <>
            <div
              ref={wordsRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${-translateY}px)`,
                transition: smoothCaret ? 'transform 0.15s ease-out' : 'none',
                fontSize: fontSizeMap[fontSize] || '22px',
                lineHeight: `${lineHeight}px`,
                fontFamily: 'var(--font-mono, var(--font-family, "Roboto Mono")), monospace',
                display: 'flex',
                flexWrap: 'wrap',
                alignContent: 'flex-start',
              }}
            >
              {wordElements}
            </div>

            {isActive && !isComplete && caretStyle !== 'off' && (
              <div
                style={{
                  position: 'absolute',
                  left: `${caretPos.left}px`,
                  top: `${caretPos.top - fontSizePx * 0.65}px`,
                  width: 2,
                  height: `${fontSizePx * 1.3}px`,
                  backgroundColor: 'var(--caret-color)',
                  opacity: caretVisible ? 1 : 0,
                  transition: smoothCaret ? 'left 0.06s ease-out, top 0.15s ease-out' : 'none',
                  pointerEvents: 'none',
                  borderRadius: 1,
                }}
              />
            )}
            {isActive && !isComplete && ghostCaretPos.visible && (
              <div
                style={{
                  position: 'absolute',
                  left: `${ghostCaretPos.left}px`,
                  top: `${ghostCaretPos.top + lineHeight * 0.5 - fontSizePx * 0.65}px`,
                  width: 2,
                  height: `${fontSizePx * 1.3}px`,
                  backgroundColor: 'var(--sub)',
                  opacity: 0.5,
                  transition: smoothCaret ? 'left 0.3s ease-out, top 0.3s ease-out' : 'none',
                  pointerEvents: 'none',
                  borderRadius: 1,
                }}
              />
            )}
          </>
        ) : (
          /* ── Single-row horizontal scroll layout ── */
          <>
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
                fontFamily: 'var(--font-mono, var(--font-family, "Roboto Mono")), monospace',
              }}
            >
              {wordElements}
            </div>

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
          </>
        )}
      </div>

      {(mode === 'quote' || mode === 'content' || mode === 'meme' || mode === 'songs' || (activeFunbox && isContentFunbox(activeFunbox))) && quoteSource && (
        <div style={{ color: 'var(--sub)', fontSize: 13, textAlign: 'right', marginTop: 12, fontStyle: 'italic' }}>
          — {quoteSource}
        </div>
      )}

      {contentLoading && !isActive && (
        <div style={{ color: 'var(--sub)', fontSize: 13, textAlign: 'center', marginTop: 16, fontFamily: 'var(--font-mono, var(--font-family))' }}>
          fetching content…
        </div>
      )}

      {!isActive && !isComplete && !contentLoading && (
        <div style={{ color: 'var(--sub)', fontSize: 13, textAlign: 'center', marginTop: 16, fontFamily: 'var(--font-mono, var(--font-family))' }}>
          {words.length === 0 && mode === 'songs' ? 'select a genre or connect a streaming service' : 'click here or start typing'}
        </div>
      )}
    </div>
  );
}
