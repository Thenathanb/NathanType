import { useTestStore } from '../../stores/testStore';
import { useUserStore, getPbKey } from '../../stores/userStore';
import { WpmChart } from './WpmChart';
import { useAuth } from '../../context/AuthContext';
import type { XpResult } from '../../types/index.js';
import { MemeReaction } from '../MemeMode/MemeReaction';

interface ResultsDisplayProps {
  onRestart: () => void;
}

export function ResultsDisplay({ onRestart, onOpenAuth }: ResultsDisplayProps & { onOpenAuth?: () => void }) {
  const { currentResult, isNewPersonalBest, mode, xpResult, currentSong } = useTestStore();
  const { personalBests } = useUserStore();
  const { currentUser } = useAuth();

  if (!currentResult) return null;

  const { stats, wpmHistory, config } = currentResult;
  const pbKey = getPbKey({ ...config, mode });
  const pb = personalBests[pbKey];

  const modeLabel = config.mode === 'time'
    ? `time ${config.timeLimit}`
    : config.mode === 'words'
    ? `words ${config.wordLimit}`
    : config.mode;

  const testTypeLabel = `${modeLabel} · ${config.language}${config.punctuation ? ' · punctuation' : ''}${config.numbers ? ' · numbers' : ''}`;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8" style={{ animation: 'fadeIn 0.2s ease-out' }}>

      {/* Test type label */}
      <div className="text-center mb-6 font-mono" style={{ color: 'var(--sub)', fontSize: 13 }}>
        {testTypeLabel}
      </div>

      {/* New PB banner */}
      {isNewPersonalBest && (
        <div className="text-center mb-6 font-mono font-bold" style={{ color: 'var(--main)', fontSize: 16 }}>
          new personal best
        </div>
      )}

      {/* Main stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <StatBlock label="wpm" value={stats.wpm} accent />
        <StatBlock label="acc" value={`${stats.accuracy}%`} />
        <StatBlock label="raw" value={stats.rawWpm} />
        <StatBlock label="consistency" value={`${stats.consistency}%`} />
      </div>

      {/* WPM Chart */}
      <WpmChart data={wpmHistory} />

      {/* Detail cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-sm">
        {/* Characters */}
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg2)' }}>
          <div className="mb-3 uppercase tracking-wider" style={{ color: 'var(--sub)', fontSize: 11 }}>characters</div>
          <div className="space-y-1.5">
            <Row label="correct"   value={stats.correctChars}   color="var(--text)" />
            <Row label="incorrect" value={stats.incorrectChars} color="var(--error)" />
            <Row label="extra"     value={stats.extraChars}     color="var(--error)" />
            <Row label="missed"    value={stats.missedChars}    color="var(--sub)" />
          </div>
        </div>

        {/* Test info */}
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg2)' }}>
          <div className="mb-3 uppercase tracking-wider" style={{ color: 'var(--sub)', fontSize: 11 }}>test</div>
          <div className="space-y-1.5">
            <Row label="mode"     value={modeLabel} />
            <Row label="language" value={config.language} />
            <Row label="time"     value={`${stats.timeElapsed}s`} />
            {config.punctuation && <Row label="punctuation" value="on" />}
            {config.numbers     && <Row label="numbers"     value="on" />}
          </div>
        </div>

        {/* Personal best */}
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg2)' }}>
          <div className="mb-3 uppercase tracking-wider" style={{ color: 'var(--sub)', fontSize: 11 }}>personal best</div>
          {pb ? (
            <div className="space-y-1.5">
              <Row label="wpm"         value={pb.wpm}           color={isNewPersonalBest ? 'var(--main)' : undefined} />
              <Row label="accuracy"    value={`${pb.accuracy}%`} />
              <Row label="consistency" value={`${pb.consistency}%`} />
              <Row
                label="date"
                value={new Date(pb.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              />
            </div>
          ) : (
            <div style={{ color: 'var(--sub)', fontSize: 13 }}>no data yet</div>
          )}
        </div>
      </div>

      {/* Meme reaction */}
      {mode === 'meme' && (
        <div className="mt-6">
          <MemeReaction wpm={stats.wpm} />
        </div>
      )}

      {/* Song credits */}
      {mode === 'songs' && currentSong && (
        <div
          className="mt-6 rounded-xl p-4 font-mono flex items-center justify-between"
          style={{ backgroundColor: 'var(--bg2)' }}
        >
          <div>
            <div style={{ color: 'var(--text)', fontSize: 14 }}>
              you just typed {currentResult?.stats.rawWpm && Math.round((currentResult.stats.rawWpm / 100) * stats.timeElapsed * 5 / 6)} words from{' '}
              <span style={{ color: 'var(--main)' }}>{currentSong.title}</span>
            </div>
            <div style={{ color: 'var(--sub)', fontSize: 13, marginTop: 4 }}>
              {currentSong.artist}
            </div>
          </div>
          <button
            onClick={() => {
              const text = `i just typed ${currentSong.title} by ${currentSong.artist} at ${stats.wpm} wpm on NathanType 🎵`;
              navigator.clipboard?.writeText(text).catch(() => {});
            }}
            className="font-mono text-sm px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
            style={{ backgroundColor: 'var(--bg)', color: 'var(--sub)', border: 'none', cursor: 'pointer', fontSize: 12 }}
          >
            share
          </button>
        </div>
      )}

      {/* XP / sign-in prompt */}
      <div className="mt-8">
        {currentUser && xpResult ? (
          <XpSection xpResult={xpResult} />
        ) : currentUser ? (
          null
        ) : (
          <p className="text-center font-mono" style={{ color: 'var(--sub)', fontSize: 13 }}>
            <button
              onClick={onOpenAuth}
              className="transition-colors hover:opacity-80"
              style={{ color: 'var(--main)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
            >
              sign in
            </button>
            {' '}to save your results and track progress
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4 justify-center mt-6">
        <button
          onClick={onRestart}
          className="font-mono transition-opacity hover:opacity-80"
          style={{
            backgroundColor: 'var(--bg2)',
            color: 'var(--main)',
            borderRadius: 8,
            padding: '10px 32px',
            fontSize: 14,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          next test
        </button>
        <button
          onClick={() => {
            const text = `${stats.wpm} WPM | ${stats.accuracy}% accuracy | NathanType`;
            navigator.clipboard?.writeText(text).catch(() => {});
          }}
          className="font-mono transition-opacity hover:opacity-80"
          style={{
            backgroundColor: 'var(--bg2)',
            color: 'var(--sub)',
            borderRadius: 8,
            padding: '10px 32px',
            fontSize: 14,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          copy result
        </button>
      </div>

      <p className="text-center font-mono mt-4" style={{ color: 'var(--sub)', fontSize: 12, opacity: 0.6 }}>
        tab to restart
      </p>
    </div>
  );
}

function StatBlock({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="text-center font-mono">
      <div
        className="tabular-nums mb-1"
        style={{
          fontSize: 52,
          fontWeight: 700,
          color: accent ? 'var(--main)' : 'var(--text)',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div className="uppercase tracking-widest" style={{ color: 'var(--sub)', fontSize: 11 }}>{label}</div>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex justify-between font-mono" style={{ fontSize: 13 }}>
      <span style={{ color: 'var(--sub)' }}>{label}</span>
      <span style={{ color: color || 'var(--text)' }}>{value}</span>
    </div>
  );
}

function XpSection({ xpResult }: { xpResult: XpResult }) {
  const xpPct = Math.min(100, (xpResult.newXp / xpResult.newXpToNextLevel) * 100);
  return (
    <div className="font-mono text-center" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="flex items-center justify-center gap-4 mb-3">
        <span style={{ color: 'var(--main)', fontSize: 15, fontWeight: 500 }}>
          +{xpResult.xpGained} xp
        </span>
        {xpResult.didLevelUp && (
          <span style={{ color: 'var(--text)', fontSize: 14 }}>
            level up! → level {xpResult.newLevel}
          </span>
        )}
      </div>
      <div className="mx-auto" style={{ maxWidth: 320 }}>
        <div
          className="rounded-full overflow-hidden mb-1"
          style={{ height: 6, backgroundColor: 'color-mix(in srgb, var(--sub) 30%, transparent)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${xpPct}%`, backgroundColor: 'var(--main)' }}
          />
        </div>
        <p style={{ color: 'var(--sub)', fontSize: 12 }}>
          {xpResult.newXp} / {xpResult.newXpToNextLevel} xp
        </p>
      </div>
    </div>
  );
}
