import type { TypedWord, CharState } from '../../types/index.js';

interface WordsHistoryProps {
  typedHistory: TypedWord[];
  open: boolean;
}

function charColor(state: CharState) {
  switch (state) {
    case 'correct':   return 'var(--text)';
    case 'incorrect': return 'var(--error)';
    case 'extra':     return 'var(--error)';
    case 'missed':    return 'color-mix(in srgb, var(--sub) 50%, transparent)';
    default:          return 'var(--sub)';
  }
}

export function WordsHistory({ typedHistory, open }: WordsHistoryProps) {
  if (!open) return null;

  return (
    <div
      className="font-mono"
      style={{
        marginTop: 28,
        padding: '20px 20px',
        backgroundColor: 'var(--bg2)',
        borderRadius: 10,
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      <div style={{ color: 'var(--main)', fontSize: 13, marginBottom: 12 }}>words</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {typedHistory.map((tw, wi) => {
          const hasError = tw.charStates.some(s => s === 'incorrect' || s === 'extra' || s === 'missed');
          return (
            <span
              key={wi}
              style={{
                display: 'inline-block',
                backgroundColor: 'var(--bg)',
                borderRadius: 5,
                padding: '3px 8px',
                fontSize: 13,
                border: hasError
                  ? '0.5px solid color-mix(in srgb, var(--error) 30%, transparent)'
                  : '0.5px solid transparent',
              }}
            >
              {/* Original word characters */}
              {tw.word.split('').map((ch, ci) => (
                <span
                  key={ci}
                  style={{
                    color: charColor(tw.charStates[ci] ?? 'missed'),
                    textDecoration: tw.charStates[ci] === 'incorrect' ? 'underline' : 'none',
                    fontSize: tw.charStates[ci] === 'extra' ? 11 : 13,
                  }}
                >
                  {ch}
                </span>
              ))}
              {/* Extra characters typed beyond word length */}
              {tw.typed.length > tw.word.length &&
                tw.typed.slice(tw.word.length).split('').map((ch, ci) => (
                  <span key={`x${ci}`} style={{ color: 'var(--error)', fontSize: 11 }}>{ch}</span>
                ))
              }
            </span>
          );
        })}
      </div>
    </div>
  );
}
