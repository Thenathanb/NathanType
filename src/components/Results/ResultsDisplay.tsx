import { useEffect, useRef, useState } from 'react';
import { useTestStore } from '../../stores/testStore';
import { useUserStore, getPbKey } from '../../stores/userStore';
import { useAuth } from '../../context/AuthContext';
import { useSettingsStore } from '../../stores/settingsStore';
import { LevelUpModal } from '../LevelUp/LevelUpModal';
import { WpmChart } from './WpmChart';
import { HeadlineStats } from './HeadlineStats';
import { XpPanel } from './XpPanel';
import { SecondaryStats } from './SecondaryStats';
import { ActionIcons } from './ActionIcons';
import { WordsHistory } from './WordsHistory';
import { MemeReaction } from '../MemeMode/MemeReaction';

interface ResultsDisplayProps {
  onRestart: () => void;
  onOpenAuth?: () => void;
}

export function ResultsDisplay({ onRestart, onOpenAuth }: ResultsDisplayProps) {
  const { currentResult, isNewPersonalBest, mode, xpResult, currentSong } = useTestStore();
  const { personalBests } = useUserStore();
  const { currentUser } = useAuth();
  const { activeFunbox } = useSettingsStore();
  const [levelUpDismissed, setLevelUpDismissed] = useState(false);
  const [wordsOpen, setWordsOpen] = useState(false);
  const mountedAt = useRef(Date.now());

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 'W') setWordsOpen(v => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!currentResult) return null;

  const { stats, wpmHistory, config, typedHistory } = currentResult;
  const pbKey = getPbKey({ ...config, mode });
  const pb = personalBests[pbKey];

  const showLevelUp = !!(xpResult?.didLevelUp && !levelUpDismissed);

  return (
    <div
      className="w-full font-mono"
      style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: '32px 24px',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      {/* Sign-in nudge */}
      {!currentUser && (
        <div style={{
          backgroundColor: 'var(--bg2)',
          padding: '10px 16px',
          borderRadius: 8,
          marginBottom: 20,
          fontSize: 13,
          color: 'var(--sub)',
        }}>
          <button
            onClick={onOpenAuth}
            style={{ color: 'var(--main)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: 0 }}
          >
            sign in
          </button>
          {' '}to save your results and track progress
        </div>
      )}

      {/* 3-column top section */}
      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 180px', gap: 24, alignItems: 'start' }}>

        {/* Left: headline stats */}
        <HeadlineStats
          stats={stats}
          config={config}
          funboxName={activeFunbox}
          isNewPb={isNewPersonalBest}
        />

        {/* Middle: chart */}
        <div style={{ minWidth: 0 }}>
          <WpmChart data={wpmHistory} />
        </div>

        {/* Right: XP panel (logged-in only) */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {currentUser && xpResult ? (
            <XpPanel xpResult={xpResult} />
          ) : currentUser ? (
            <div style={{ color: 'var(--sub)', fontSize: 12, textAlign: 'right', paddingTop: 4 }}>
              calculating xp…
            </div>
          ) : null}
        </div>
      </div>

      {/* Secondary stats row */}
      <SecondaryStats stats={stats} timestamp={mountedAt.current} />

      {/* Meme reaction */}
      {mode === 'meme' && (
        <div style={{ marginTop: 20 }}>
          <MemeReaction wpm={stats.wpm} />
        </div>
      )}

      {/* Song credit */}
      {mode === 'songs' && currentSong && (
        <div
          style={{
            marginTop: 16,
            padding: '14px 16px',
            backgroundColor: 'var(--bg2)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ color: 'var(--text)', fontSize: 14 }}>
              typed{' '}
              <span style={{ color: 'var(--main)' }}>{currentSong.title}</span>
              {' '}by {currentSong.artist}
            </div>
          </div>
          <button
            onClick={() => {
              const text = `${stats.wpm} WPM · ${currentSong.title} by ${currentSong.artist} on NathanType`;
              navigator.clipboard?.writeText(text).catch(() => {});
            }}
            style={{
              backgroundColor: 'var(--bg)',
              color: 'var(--sub)',
              border: 'none',
              borderRadius: 6,
              padding: '6px 14px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 12,
            }}
          >
            share
          </button>
        </div>
      )}

      {/* PB detail row */}
      {pb && (
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--sub)' }}>
          {isNewPersonalBest
            ? `previous pb: ${pb.wpm} wpm`
            : `pb: ${pb.wpm} wpm · ${pb.accuracy}% acc`
          }
        </div>
      )}

      {/* Action icons */}
      <ActionIcons
        onNext={onRestart}
        onRestart={onRestart}
        onToggleWords={() => setWordsOpen(v => !v)}
        isLoggedIn={!!currentUser}
      />

      {/* Keyboard hint update */}
      <div style={{
        marginTop: 16,
        display: 'flex',
        justifyContent: 'center',
        gap: 20,
        fontSize: 12,
        color: 'var(--sub)',
        opacity: 0.5,
      }}>
        <span><kbd style={kbdStyle}>tab</kbd> restart</span>
        <span><kbd style={kbdStyle}>tab</kbd>+<kbd style={kbdStyle}>enter</kbd> next</span>
        <span><kbd style={kbdStyle}>w</kbd> words</span>
      </div>

      {/* Words history */}
      <WordsHistory typedHistory={typedHistory ?? []} open={wordsOpen} />

      {/* Level-up modal */}
      {showLevelUp && xpResult && (
        <LevelUpModal xpResult={xpResult} onClose={() => setLevelUpDismissed(true)} />
      )}
    </div>
  );
}

const kbdStyle: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: 'var(--bg2)',
  border: '0.5px solid rgba(255,255,255,0.15)',
  borderRadius: 3,
  padding: '1px 5px',
  fontSize: 11,
  fontFamily: 'inherit',
};
