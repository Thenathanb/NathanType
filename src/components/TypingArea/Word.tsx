import type { CharState } from '../../types/index.js';
import { useSettingsStore } from '../../stores/settingsStore';

interface WordProps {
  word: string;
  typed: string;
  charStates: CharState[];
  isActive: boolean;
  isPast?: boolean;
  wordRef?: React.RefObject<HTMLDivElement>;
}

export function Word({ word, typed, charStates, isActive, isPast, wordRef }: WordProps) {
  const { blindMode, showCurrentWordLine } = useSettingsStore();
  const hasError = isPast && typed !== word;

  return (
    <div
      ref={wordRef}
      style={{
        display: 'inline-block',
        marginRight: '0.6em',
        borderBottom: isActive && showCurrentWordLine
          ? '2px solid var(--accent)'
          : hasError
          ? '2px solid #ca475460'
          : 'none',
      }}
    >
      {word.split('').map((char, index) => {
        const state = charStates[index] || 'pending';
        const typedChar = typed[index];

        let color = '#646669'; // pending

        if (!blindMode) {
          if (state === 'correct') color = '#d1d0ce';
          else if (state === 'incorrect' || state === 'extra') color = '#ca4754';
        } else {
          if (typedChar !== undefined) color = '#d1d0ce';
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
          <span key={`extra-${index}`} style={{ color: '#ca4754' }}>
            {char}
          </span>
        ))}
    </div>
  );
}
