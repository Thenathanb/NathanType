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
  const { blindMode } = useSettingsStore();

  const hasError = isPast && typed !== word;

  return (
    <div
      ref={wordRef}
      className={`inline-block mr-3 mb-2 ${
        isActive ? 'border-b-2 border-accent' : ''
      } ${hasError ? 'border-b-2 border-error border-opacity-60' : ''}`}
    >
      {word.split('').map((char, index) => {
        const state = charStates[index] || 'pending';
        const typedChar = typed[index];

        let colorClass = 'text-text-secondary'; // pending

        if (!blindMode) {
          if (state === 'correct') colorClass = 'text-correct';
          else if (state === 'incorrect' || state === 'extra') colorClass = 'text-error';
        } else {
          if (typedChar !== undefined) colorClass = 'text-text-primary';
        }

        return (
          <span key={index} className={`${colorClass} transition-colors duration-75`}>
            {typedChar !== undefined ? typedChar : char}
          </span>
        );
      })}
      {/* Extra characters typed beyond word length */}
      {typed.length > word.length &&
        typed.slice(word.length).split('').map((char, index) => (
          <span key={`extra-${index}`} className="text-error">
            {char}
          </span>
        ))}
    </div>
  );
}
