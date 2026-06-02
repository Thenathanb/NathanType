export interface LevelTier {
  minLevel: number;
  title: string;
  subtitle: string;
  color: string; // CSS color for flair — overridden by var(--main) in most places
}

const TIERS: LevelTier[] = [
  { minLevel: 1,  title: 'Beginner',    subtitle: 'just getting started',    color: '#9e9e9e' },
  { minLevel: 5,  title: 'Novice',      subtitle: 'building the habit',      color: '#80cbc4' },
  { minLevel: 10, title: 'Apprentice',  subtitle: 'getting comfortable',     color: '#4fc3f7' },
  { minLevel: 15, title: 'Skilled',     subtitle: 'above average',           color: '#7986cb' },
  { minLevel: 20, title: 'Advanced',    subtitle: 'seriously fast',          color: '#a5d6a7' },
  { minLevel: 25, title: 'Expert',      subtitle: 'top tier typist',         color: '#ffb74d' },
  { minLevel: 30, title: 'Master',      subtitle: 'elite',                   color: '#ff8a65' },
  { minLevel: 40, title: 'Grand Master',subtitle: 'almost no one gets here', color: '#f06292' },
  { minLevel: 50, title: 'Virtuoso',    subtitle: 'transcendent speed',      color: '#ce93d8' },
  { minLevel: 75, title: 'Legend',      subtitle: 'absolute unit',           color: '#ffe082' },
];

export function getLevelTier(level: number): LevelTier {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (level >= TIERS[i].minLevel) return TIERS[i];
  }
  return TIERS[0];
}

export function getNextTier(level: number): LevelTier | null {
  for (let i = 0; i < TIERS.length; i++) {
    if (TIERS[i].minLevel > level) return TIERS[i];
  }
  return null;
}

export function getLevelTitle(level: number): string {
  return getLevelTier(level).title;
}
