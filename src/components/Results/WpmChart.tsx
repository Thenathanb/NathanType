import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import type { WpmDataPoint } from '../../types/index.js';

interface WpmChartProps {
  data: WpmDataPoint[];
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number }[];
  label?: number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      backgroundColor: 'var(--bg2)',
      border: '0.5px solid rgba(255,255,255,0.15)',
      borderRadius: 6,
      padding: '8px 12px',
      fontFamily: 'var(--font-mono, monospace)',
      fontSize: 12,
      color: 'var(--text)',
    }}>
      <div style={{ color: 'var(--sub)', marginBottom: 4 }}>{Math.round(label ?? 0)}s</div>
      {payload.map(p => (
        <div key={p.name} style={{
          color: p.name === 'errors' ? 'var(--error)' : 'var(--main)',
          marginBottom: 2,
        }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
}

export function WpmChart({ data }: WpmChartProps) {
  if (data.length === 0) return null;

  const maxWpm = Math.max(...data.map(d => Math.max(d.wpm, d.rawWpm)), 1);
  const yMax   = Math.ceil(maxWpm / 10) * 10 + 10;

  return (
    <div style={{ width: '100%', height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="2 4"
            stroke="rgba(255,255,255,0.06)"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            tickFormatter={v => `${Math.round(v as number)}s`}
            tick={{ fill: 'var(--sub)', fontSize: 10, fontFamily: 'inherit' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="wpm"
            domain={[0, yMax]}
            tick={{ fill: 'var(--sub)', fontSize: 10, fontFamily: 'inherit' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="errors"
            orientation="right"
            tick={{ fill: 'var(--sub)', fontSize: 10, fontFamily: 'inherit' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)' }} />

          <Bar
            yAxisId="errors"
            dataKey="errors"
            name="errors"
            fill="var(--error)"
            opacity={0.5}
            radius={[2, 2, 0, 0]}
            maxBarSize={12}
          />
          <Line
            yAxisId="wpm"
            type="monotone"
            dataKey="rawWpm"
            name="raw"
            stroke="var(--main)"
            strokeOpacity={0.35}
            strokeWidth={1}
            dot={false}
            activeDot={{ r: 3 }}
          />
          <Line
            yAxisId="wpm"
            type="monotone"
            dataKey="wpm"
            name="wpm"
            stroke="var(--main)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
