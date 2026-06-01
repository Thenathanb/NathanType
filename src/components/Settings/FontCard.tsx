import { useEffect, useRef, useState } from 'react';
import type { FontOption } from '../../data/fonts/fonts';
import { loadGoogleFont } from '../../utils/applyFont';

interface FontCardProps {
  font: FontOption;
  active: boolean;
  onClick: () => void;
}

export function FontCard({ font, active, onClick }: FontCardProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [loaded, setLoaded] = useState(!font.googleFont);

  // Lazy-load Google Font when card scrolls into view
  useEffect(() => {
    if (!font.googleFont || loaded) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        loadGoogleFont(font);
        setLoaded(true);
        obs.disconnect();
      }
    }, { rootMargin: '200px' });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [font, loaded]);

  return (
    <button
      ref={ref}
      onClick={onClick}
      style={{
        backgroundColor: 'var(--bg2)',
        borderRadius: 8,
        border: `0.5px solid ${active ? 'var(--main)' : 'rgba(255,255,255,0.06)'}`,
        padding: '12px 14px',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        outline: 'none',
        transition: 'border-color 150ms',
      }}
    >
      <div style={{ color: 'var(--sub)', fontSize: 11, fontFamily: "'Roboto Mono', monospace", marginBottom: 6 }}>
        {font.name}
      </div>
      <div style={{
        color: 'var(--text)',
        fontSize: 15,
        fontFamily: font.cssFamily,
        fontVariantLigatures: font.ligatures ? 'normal' : 'none',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        the quick brown fox
      </div>
    </button>
  );
}
