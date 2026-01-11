import { useEffect, useRef, useState } from 'react';
import { Word } from './Word';
import { Caret } from './Caret';
import { useTestStore } from '../../stores/testStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { getCharStates } from '../../utils/calculateStats';

interface TypingAreaProps {
  onKeyPress: (key: string) => void;
  currentInput: string;
}

export function TypingArea({ onKeyPress, currentInput }: TypingAreaProps) {
  const {
    words,
    currentWordIndex,
    typedHistory,
    isActive,
    isComplete,
  } = useTestStore();

  const { fontSize, focusMode } = useSettingsStore();

  const [caretPosition, setCaretPosition] = useState({ left: 0, top: 0, height: 24 });
  const inputRef = useRef<HTMLInputElement>(null);
  const currentWordRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus input on mount and when clicking the typing area
  useEffect(() => {
    if (!isComplete && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isComplete]);

  // Calculate caret position
  useEffect(() => {
    if (!currentWordRef.current || !containerRef.current) return;

    const wordRect = currentWordRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    // Create a temporary span to measure text width
    const tempSpan = document.createElement('span');
    tempSpan.style.visibility = 'hidden';
    tempSpan.style.position = 'absolute';
    tempSpan.style.font = window.getComputedStyle(currentWordRef.current).font;
    tempSpan.textContent = currentInput || '';
    document.body.appendChild(tempSpan);

    const textWidth = tempSpan.offsetWidth;
    document.body.removeChild(tempSpan);

    setCaretPosition({
      left: wordRect.left - containerRect.left + textWidth,
      top: wordRect.top - containerRect.top,
      height: wordRect.height,
    });
  }, [currentInput, currentWordIndex, words]);

  // Handle input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const lastChar = value[value.length - 1];
    if (lastChar) {
      onKeyPress(lastChar);
    }
    // Reset input
    e.target.value = '';
  };

  // Handle key down for special keys
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ') {
      e.preventDefault();
      onKeyPress(' ');
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      onKeyPress('Backspace');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      onKeyPress('Tab');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      onKeyPress('Enter');
    }
  };

  const fontSizeClasses = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-3xl',
    'extra-large': 'text-4xl',
  };

  const currentWord = words[currentWordIndex];
  const charStates = currentWord ? getCharStates(currentWord, currentInput) : [];

  return (
    <div
      className={`relative w-full max-w-4xl mx-auto ${focusMode ? 'opacity-100' : ''}`}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Hidden input for capturing keystrokes */}
      <input
        ref={inputRef}
        type="text"
        className="hidden-input"
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        disabled={isComplete}
      />

      {/* Typing area */}
      <div
        ref={containerRef}
        className={`relative p-6 ${fontSizeClasses[fontSize]} font-mono leading-relaxed no-select cursor-pointer`}
        style={{ minHeight: '200px' }}
      >
        {words.slice(0, Math.min(words.length, currentWordIndex + 30)).map((word, wordIndex) => {
          // Get typed version from history or current input
          let typed = '';
          let states = word.split('').map(() => 'pending' as const);

          if (wordIndex < currentWordIndex && typedHistory[wordIndex]) {
            // Word from history
            typed = typedHistory[wordIndex].typed;
            states = typedHistory[wordIndex].charStates;
          } else if (wordIndex === currentWordIndex) {
            // Current word being typed
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
              wordRef={wordIndex === currentWordIndex ? currentWordRef : undefined}
            />
          );
        })}

        {/* Caret */}
        {isActive && !isComplete && (
          <Caret
            left={caretPosition.left}
            top={caretPosition.top}
            height={caretPosition.height}
          />
        )}
      </div>

      {/* Instructions */}
      {!isActive && !isComplete && (
        <div className="text-center text-text-secondary text-sm mt-4">
          Click here or start typing to begin
        </div>
      )}

      {!isComplete && (
        <div className="text-center text-text-secondary text-sm mt-4">
          Tab + Enter to restart
        </div>
      )}
    </div>
  );
}
