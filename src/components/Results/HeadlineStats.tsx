import { useEffect, useState } from 'react';
import type { TestStats, TestConfig } from '../../types/index.js';

function useCountUp(target: number, duration = 800) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return val;
}

interface HeadlineStatsProps {
  stats: TestStats;
  config: TestConfig;
  funboxName?: string | null;
  isNewPb?: boolean;
}

export function HeadlineStats({ stats, config, funboxName, isNewPb }: HeadlineStatsProps) {
  const wpm = useCountUp(stats.wpm);
  const acc = useCountUp(Math.round(stats.accuracy));

  const modeLabel = config.mode === 'time'
    ? `time ${config.timeLimit}`
    : config.mode === 'words'
    ? `words ${config.wordLimit}`
    : config.mode;

  return (
    <div className="font-mono" style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'flex-start', minWidth: 140 }}>

      {/* WPM */}
      <div style={{ position: 'relative' }}>
        <div style={{ color: 'var(--sub)', fontSize: 16, fontWeight: 400, lineHeight: 1 }}>wpm</div>
        <div
          style={{ color: 'var(--main)', fontSize: 64, fontWeight: 500, lineHeight: 1, marginTop: 4 }}
          title={String(stats.wpm)}
        >
          {wpm}
        </div>
        {isNewPb && (
          <div style={{
            position: 'absolute',
            top: 0,
            right: -8,
            transform: 'translateX(100%)',
            backgroundColor: 'var(--main)',
            color: 'var(--bg)',
            fontSize: 11,
            fontWeight: 600,
            borderRadius: 5,
            padding: '3px 8px',
            whiteSpace: 'nowrap',
            animation: 'pbPop 0.5s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            pb!
          </div>
        )}
      </div>

      {/* Accuracy */}
      <div>
        <div style={{ color: 'var(--sub)', fontSize: 16, fontWeight: 400, lineHeight: 1 }}>acc</div>
        <div
          style={{ color: 'var(--main)', fontSize: 64, fontWeight: 500, lineHeight: 1, marginTop: 4 }}
          title={`${stats.accuracy}%`}
        >
          {acc}%
        </div>
      </div>

      {/* Test type */}
      <div>
        <div style={{ color: 'var(--sub)', fontSize: 13, marginBottom: 4 }}>test type</div>
        <div style={{ color: 'var(--main)', fontSize: 13, lineHeight: 1.6 }}>
          <div>{modeLabel}</div>
          <div>{config.language}</div>
          {funboxName && <div>{funboxName}</div>}
          {config.punctuation && <div>punctuation</div>}
          {config.numbers && <div>numbers</div>}
        </div>
      </div>

      <style>{`
        @keyframes pbPop {
          0%   { transform: translateX(100%) scale(0.7); opacity: 0; }
          60%  { transform: translateX(100%) scale(1.05); opacity: 1; }
          100% { transform: translateX(100%) scale(1); }
        }
      `}</style>
    </div>
  );
}
