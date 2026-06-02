import { useState } from 'react';
import { ProfileHeader }   from '../components/Account/ProfileHeader';
import { LeaderboardCard } from '../components/Account/LeaderboardCard';
import { PersonalBests }   from '../components/Account/PersonalBests';
import { ActivityHeatmap } from '../components/Account/ActivityHeatmap';
import { ResultFilters }   from '../components/Account/ResultFilters';
import { ResultsTable }    from '../components/Account/ResultsTable';
import type { TimeRange, ModeFilter } from '../components/Account/ResultFilters';

export function Account() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [timeRange,  setTimeRange]  = useState<TimeRange>('all');
  const [modeFilter, setModeFilter] = useState<ModeFilter>('all');

  return (
    <div className="page-scroll">
      <div className="w-full max-w-5xl mx-auto px-5 py-8 flex flex-col gap-4 font-mono" style={{ animation: 'fadeIn 0.2s ease-out' }}>

        <ProfileHeader />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LeaderboardCard />
          <div /> {/* placeholder for future card */}
        </div>

        <PersonalBests />

        <ActivityHeatmap />

        {/* Results section */}
        <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg2)' }}>
          <ResultFilters
            open={filtersOpen}
            onToggle={() => setFiltersOpen(v => !v)}
            timeRange={timeRange}
            onTimeRange={setTimeRange}
            modeFilter={modeFilter}
            onModeFilter={setModeFilter}
          />
          <ResultsTable timeRange={timeRange} modeFilter={modeFilter} />
        </div>

      </div>
    </div>
  );
}
