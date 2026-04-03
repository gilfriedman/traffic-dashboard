import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useChartData } from '../../hooks/useChartData';
import { getRushHourProfile } from '../../lib/api';
import { getNeighborhoodColor } from '../../lib/utils';
import type { Filters } from '../../lib/types';

interface Props {
  filters: Filters;
}

export function RushHourChart({ filters }: Props) {
  const { data, loading, error } = useChartData(
    () => getRushHourProfile(filters),
    [JSON.stringify(filters)]
  );

  const { chartData, neighborhoods } = useMemo(() => {
    if (!data?.length) return { chartData: [], neighborhoods: [] };

    const uniqueNeighborhoods = [...new Set(data.map((point) => point.neighborhood))];
    const slotMap = new Map<string, Record<string, number>>();

    for (const point of data) {
      const existing = slotMap.get(point.time_slot) ?? {};
      existing[point.neighborhood] = point.avg_congestion;
      slotMap.set(point.time_slot, existing);
    }

    const rows = Array.from(slotMap.entries())
      .map(([time_slot, values]) => ({ time_slot, ...values }))
      .sort((first, second) => first.time_slot.localeCompare(second.time_slot));

    return { chartData: rows, neighborhoods: uniqueNeighborhoods };
  }, [data]);

  if (loading) return <div className="h-80 flex items-center justify-center text-slate-400">Loading...</div>;
  if (error) return <div className="h-80 flex items-center justify-center text-red-500">{error}</div>;
  if (!chartData.length) return <div className="h-80 flex items-center justify-center text-slate-400">No data</div>;

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData} margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time_slot" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 'auto']} />
        <Tooltip />
        <Legend />
        {neighborhoods.map((neighborhood) => (
          <Line
            key={neighborhood}
            type="monotone"
            dataKey={neighborhood}
            stroke={getNeighborhoodColor(neighborhood)}
            strokeWidth={2}
            dot
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
