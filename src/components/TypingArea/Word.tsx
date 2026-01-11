import type { CharState } from '../../types/index.js';
import { useSettingsStore } from '../../stores/settingsStore';

interface WordProps {
  word: string;
  typed: string;
  charStates: CharState[];
  isActive: boolean;
  wordRef?: React.RefObject<HTMLDivElement>;
}

export function Word({ word, typed, charStates, isActive, wordRef }: WordProps) {
  const { blindMode } = useSettingsStore();

  return (
    <div
      ref={wordRef}
      className={`inline-block mr-3 mb-2 ${isActive ? 'border-b-2 border-accent' : ''}`}
    >
      {word.split('').map((char, index) => {
        const state = charStates[index] || 'pending';
        const typedChar = typed[index];

        let colorClass = 'text-text-secondary'; // pending

        if (!blindMode) {
          if (state === 'correct') {
            colorClass = 'text-correct';
          } else if (state === 'incorrect') {
            colorClass = 'text-error';
          } else if (state === 'extra') {
            colorClass = 'text-error';
          }
        } else {
          // In blind mode, just show typed characters in primary color
          if (typedChar !== undefined) {
            colorClass = 'text-text-primary';
          }
        }

        return (
          <span
            key={`${char}-${index}`}
            className={`${colorClass} transition-colors duration-100`}
          >
            {typedChar !== undefined ? typedChar : char}
          </span>
        );
      })}
      {/* Extra characters typed beyond the word length */}
      {typed.length > word.length &&
        typed
          .slice(word.length)
          .split('')
          .map((char, index) => (
            <span
              key={`extra-${index}`}
              className="text-error"
            >
              {char}
            </span>
          ))}
    </div>
  );
}
