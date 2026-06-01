import type { CharState } from '../../types/index.js';
import { useSettingsStore } from '../../stores/settingsStore';

interface WordProps {
  word: string;
  typed: string;
  charStates: CharState[];
  isActive: boolean;
  isPast?: boolean;
  wordRef?: React.RefObject<HTMLDivElement | null>;
  wordIndex?: number;
  currentWordIndex?: number;
  activeFunbox?: string | null;
}

export function Word({
  word, typed, charStates, isActive, isPast, wordRef,
  wordIndex = 0, currentWordIndex = 0, activeFunbox,
}: WordProps) {
  const { blindMode, showCurrentWordLine } = useSettingsStore();
  const hasError = isPast && typed !== word;

  const distanceFromCurrent = wordIndex - currentWordIndex;

  const noSpace = activeFunbox === 'nospace';

  // read-ahead-hard: hide everything except current word and next one
  if (activeFunbox === 'read-ahead-hard' && !isPast && !isActive && distanceFromCurrent > 1) {
    return (
      <div
        ref={wordRef}
        style={{ display: 'inline-block', marginRight: noSpace ? 0 : '0.6em', opacity: 0 }}
      >
        {word.split('').map((_, i) => <span key={i} style={{ color: 'transparent' }}>a</span>)}
      </div>
    );
  }

  // memory: hide correctly-typed past words
  const memoryHide = activeFunbox === 'memory' && isPast;

  // read-ahead: highlight the next 3 words slightly
  const readAheadGlow = activeFunbox === 'read-ahead' && !isPast && !isActive && distanceFromCurrent >= 1 && distanceFromCurrent <= 3;

  return (
    <div
      ref={wordRef}
      style={{
        display: 'inline-block',
        marginRight: noSpace ? 0 : '0.6em',
        borderBottom: isActive && showCurrentWordLine
          ? '2px solid var(--accent)'
          : hasError && !memoryHide
          ? '2px solid color-mix(in srgb, var(--error) 38%, transparent)'
          : 'none',
        opacity: readAheadGlow ? 0.5 : 1,
        filter: readAheadGlow ? 'brightness(1.3)' : 'none',
      }}
    >
      {word.split('').map((char, index) => {
        const state = charStates[index] || 'pending';
        const typedChar = typed[index];

        // memory funbox: fade out correctly typed past characters
        if (memoryHide && state === 'correct') {
          return <span key={index} style={{ color: 'transparent' }}>{char}</span>;
        }

        let color = 'var(--sub)'; // pending

        if (!blindMode) {
          if (state === 'correct') color = 'var(--text)';
          else if (state === 'incorrect' || state === 'extra') color = 'var(--error)';
        } else {
          if (typedChar !== undefined) color = 'var(--text)';
        }

        return (
          <span key={index} style={{ color, transition: 'color 0.05s' }}>
            {char}
          </span>
        );
      })}
      {/* Extra characters typed beyond word length */}
      {typed.length > word.length &&
        typed.slice(word.length).split('').map((char, index) => (
          <span key={`extra-${index}`} style={{ color: 'var(--error)' }}>
            {char}
          </span>
        ))}
    </div>
  );
}
