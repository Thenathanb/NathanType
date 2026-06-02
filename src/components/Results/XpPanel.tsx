import { useEffect, useState } from 'react';
import type { XpResult } from '../../types/index.js';

interface XpPanelProps {
  xpResult: XpResult;
}

export function XpPanel({ xpResult }: XpPanelProps) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const target = xpResult.xpGained;
    const duration = 800;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [xpResult.xpGained]);

  const { xpBreakdown: bd } = xpResult;
  const rows = [
    { label: 'base',        value: bd.base },
    { label: 'perfect',     value: bd.accuracyBonus },
    { label: 'mode',        value: bd.modeBonus },
    { label: 'streak',      value: bd.streakBonus },
  ].filter(r => r.value > 0);

  const pct = Math.min(100, (xpResult.newXp / xpResult.newXpToNextLevel) * 100);

  return (
    <div className="font-mono" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, minWidth: 160 }}>

      {/* Big XP number */}
      <div style={{ color: 'var(--main)', fontSize: 32, fontWeight: 500, lineHeight: 1 }}>
        +{display}
      </div>

      {/* Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
        {rows.map((r, i) => (
          <div
            key={r.label}
            style={{
              display: 'flex', gap: 12, fontSize: 12,
              animation: `xpRowIn 0.25s ease-out ${i * 80}ms both`,
            }}
          >
            <span style={{ color: 'var(--sub)' }}>{r.label}</span>
            <span style={{ color: 'var(--main)' }}>+{r.value}</span>
          </div>
        ))}
      </div>

      {/* XP progress bar */}
      <div style={{ marginTop: 6, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--sub)', marginBottom: 4 }}>
          <span>lv {xpResult.newLevel}</span>
          <span>{xpResult.newXp} / {xpResult.newXpToNextLevel}</span>
        </div>
        <div style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            backgroundColor: 'var(--main)',
            borderRadius: 2,
            transition: 'width 1.2s ease-out',
          }} />
        </div>
      </div>

      {/* Level up banner */}
      {xpResult.didLevelUp && (
        <div style={{
          color: 'var(--main)',
          fontSize: 13,
          fontWeight: 500,
          marginTop: 4,
          animation: 'levelUpPop 0.6s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          level up → {xpResult.newLevel}
        </div>
      )}

      <style>{`
        @keyframes xpRowIn {
          from { opacity: 0; transform: translateX(8px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes levelUpPop {
          0%   { transform: scale(0.9); opacity: 0; }
          60%  { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
