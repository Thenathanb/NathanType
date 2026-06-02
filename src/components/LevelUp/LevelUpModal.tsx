import { useEffect, useState } from 'react';
import { getLevelTier, getNextTier } from '../../data/levels/levels';
import type { XpResult } from '../../types/index.js';

interface LevelUpModalProps {
  xpResult: XpResult;
  onClose: () => void;
}

// Generate random confetti particles
const PARTICLE_COUNT = 60;
const COLORS = ['var(--main)', 'var(--text)', 'var(--sub)', '#fff'];

function Confetti() {
  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.8}s`,
    duration: `${1.2 + Math.random() * 1}s`,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: `${4 + Math.random() * 6}px`,
    rotate: `${Math.random() * 360}deg`,
    drift: `${(Math.random() - 0.5) * 120}px`,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 1 }}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            top: '-10px',
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            transform: `rotate(${p.rotate})`,
            animation: `confettiFall ${p.duration} ${p.delay} ease-in forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(110vh) translateX(${Math.random() > 0.5 ? '' : '-'}80px) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export function LevelUpModal({ xpResult, onClose }: LevelUpModalProps) {
  const [visible, setVisible] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Small delay so it pops in after results render
    const t1 = setTimeout(() => setVisible(true), 100);
    const t2 = setTimeout(() => setShowContent(true), 300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === 'Tab' || e.key === 'Enter') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const tier = getLevelTier(xpResult.newLevel);
  const prevTier = getLevelTier(xpResult.prevLevel);
  const nextTier = getNextTier(xpResult.newLevel);
  const titleChanged = tier.title !== prevTier.title;
  const xpPct = Math.min(100, (xpResult.newXp / xpResult.newXpToNextLevel) * 100);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{
        backgroundColor: 'rgba(0,0,0,0.75)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 250ms ease',
      }}
      onClick={onClose}
    >
      <Confetti />

      <div
        className="relative font-mono text-center"
        style={{
          backgroundColor: 'var(--bg)',
          border: '1px solid var(--main)',
          borderRadius: 16,
          padding: '40px 48px',
          maxWidth: 440,
          width: '90%',
          zIndex: 2,
          transform: showContent ? 'scale(1) translateY(0)' : 'scale(0.85) translateY(24px)',
          opacity: showContent ? 1 : 0,
          transition: 'transform 350ms cubic-bezier(0.34,1.56,0.64,1), opacity 300ms ease',
          boxShadow: '0 0 60px color-mix(in srgb, var(--main) 20%, transparent)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Level number burst */}
        <div style={{ marginBottom: 8 }}>
          <div
            className="inline-flex items-center justify-center font-mono font-bold"
            style={{
              width: 80, height: 80,
              borderRadius: '50%',
              backgroundColor: 'color-mix(in srgb, var(--main) 15%, transparent)',
              border: '2px solid var(--main)',
              color: 'var(--main)',
              fontSize: 32,
              marginBottom: 12,
            }}
          >
            {xpResult.newLevel}
          </div>
        </div>

        <div style={{ color: 'var(--sub)', fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>
          level up
        </div>

        <div style={{ color: 'var(--main)', fontSize: 32, fontWeight: 700, marginBottom: 4 }}>
          {tier.title}
        </div>

        <div style={{ color: 'var(--sub)', fontSize: 13, marginBottom: titleChanged ? 20 : 12 }}>
          {tier.subtitle}
        </div>

        {/* Tier promotion banner */}
        {titleChanged && (
          <div
            className="rounded-lg px-4 py-2 mb-5"
            style={{ backgroundColor: 'color-mix(in srgb, var(--main) 12%, transparent)', color: 'var(--main)', fontSize: 13 }}
          >
            {prevTier.title} → <strong>{tier.title}</strong>
          </div>
        )}

        {/* XP progress to next tier */}
        {nextTier && (
          <div className="mb-6">
            <div className="flex justify-between mb-1" style={{ fontSize: 11, color: 'var(--sub)' }}>
              <span>next: {nextTier.title} at level {nextTier.minLevel}</span>
              <span>{xpResult.newXp} / {xpResult.newXpToNextLevel} xp</span>
            </div>
            <div style={{ height: 4, backgroundColor: 'color-mix(in srgb, var(--sub) 25%, transparent)', borderRadius: 2 }}>
              <div
                style={{
                  height: '100%',
                  width: `${xpPct}%`,
                  backgroundColor: 'var(--main)',
                  borderRadius: 2,
                  transition: 'width 0.8s ease 0.4s',
                }}
              />
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="font-mono transition-opacity hover:opacity-80"
          style={{
            backgroundColor: 'var(--main)',
            color: 'var(--bg)',
            border: 'none',
            borderRadius: 8,
            padding: '10px 32px',
            fontSize: 14,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          continue
        </button>

        <p style={{ color: 'var(--sub)', fontSize: 11, marginTop: 12 }}>
          press tab, enter, or esc
        </p>
      </div>
    </div>
  );
}
