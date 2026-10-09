import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { HistoricalPoint } from '@/services/historicalService';
import { ProvenanceBadge } from '@/components/common/ProvenanceBadge';

interface HistoricalTrendProps {
  series: HistoricalPoint[];
  stationName: string;
}

/**
 * HistoricalTrendChart
 *
 * Renders a clean 24-hour PM2.5 time-series trend line.
 * Provenance is explicitly badge-tagged (REANALYSIS or SIMULATED).
 * Uses dark slate styling from AERIS design system.
 */
export function HistoricalTrendChart({ series, stationName }: HistoricalTrendProps) {
  if (series.length === 0) {
    return (
      <div
        className="panel"
        style={{ padding: 'var(--space-4)', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}
      >
        No historical trend data available.
      </div>
    );
  }

  const provenance = series[0]?.provenance ?? 'SIMULATED';

  // Format data for Recharts
  const chartData = series.map((pt) => {
    const d = new Date(pt.timestamp);
    const timeLabel = d.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    return {
      time: timeLabel,
      pm25: pt.pm25,
      timestamp: pt.timestamp,
    };
  });

  return (
    <div className="panel" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="panel-title" style={{ fontSize: 'var(--text-xs)' }}>
            24-Hour PM2.5 Trend — {stationName}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            Concentration in µg/m³ (Hourly resolution)
          </div>
        </div>
        <ProvenanceBadge provenance={provenance} />
      </div>

      <div style={{ width: '100%', height: '180px', marginTop: 'var(--space-2)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="pm25Gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 120, 165, 0.12)" />
            <XAxis
              dataKey="time"
              stroke="var(--color-text-muted)"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: 'rgba(99, 120, 165, 0.2)' }}
            />
            <YAxis
              stroke="var(--color-text-muted)"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: 'rgba(99, 120, 165, 0.2)' }}
              domain={[0, 'auto']}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as { time: string; pm25: number };
                  return (
                    <div
                      style={{
                        background: 'var(--color-bg-elevated)',
                        border: '1px solid var(--color-border)',
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-xs)',
                        boxShadow: 'var(--shadow-md)',
                      }}
                    >
                      <div style={{ color: 'var(--color-text-muted)' }}>Time: {data.time} IST</div>
                      <div style={{ color: '#3b82f6', fontWeight: 600 }}>
                        PM2.5: {data.pm25} µg/m³
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="pm25"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#pm25Gradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
