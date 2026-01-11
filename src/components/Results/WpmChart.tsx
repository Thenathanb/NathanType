import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { WpmDataPoint } from '../../types/index.js';

interface WpmChartProps {
  data: WpmDataPoint[];
}

export function WpmChart({ data }: WpmChartProps) {
  if (data.length === 0) return null;

  return (
    <div className="w-full h-64 mt-6">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--text-secondary)" opacity={0.2} />
          <XAxis
            dataKey="time"
            stroke="var(--text-secondary)"
            label={{ value: 'Time (s)', position: 'insideBottom', offset: -5, fill: 'var(--text-secondary)' }}
          />
          <YAxis
            stroke="var(--text-secondary)"
            label={{ value: 'WPM', angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--text-secondary)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
            }}
            labelStyle={{ color: 'var(--text-secondary)' }}
          />
          <Legend
            wrapperStyle={{ color: 'var(--text-primary)' }}
          />
          <Line
            type="monotone"
            dataKey="wpm"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={false}
            name="WPM"
          />
          <Line
            type="monotone"
            dataKey="rawWpm"
            stroke="var(--text-secondary)"
            strokeWidth={2}
            dot={false}
            name="Raw WPM"
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
