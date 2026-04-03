import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useChartData } from '../../hooks/useChartData';
import { getCongestionOverTime } from '../../lib/api';
import { getNeighborhoodColor } from '../../lib/utils';
import type { Filters } from '../../lib/types';

interface Props {
  filters: Filters;
  granularity?: string;
}

export function CongestionOverTimeChart({ filters, granularity = 'day' }: Props) {
  const { data, loading, error } = useChartData(
    () => getCongestionOverTime(filters, granularity),
    [JSON.stringify(filters), granularity]
  );

  const { chartData, neighborhoods } = useMemo(() => {
    if (!data?.length) return { chartData: [], neighborhoods: [] };

    const uniqueNeighborhoods = [...new Set(data.map((point) => point.neighborhood))];
    const timeMap = new Map<string, Record<string, number>>();

    for (const point of data) {
      const existing = timeMap.get(point.time) ?? {};
      existing[point.neighborhood] = point.avg_congestion;
      timeMap.set(point.time, existing);
    }

    const rows = Array.from(timeMap.entries())
      .map(([time, values]) => ({ time, ...values }))
      .sort((first, second) => first.time.localeCompare(second.time));

    return { chartData: rows, neighborhoods: uniqueNeighborhoods };
  }, [data]);

  if (loading) return <div className="h-80 flex items-center justify-center text-slate-400">Loading...</div>;
  if (error) return <div className="h-80 flex items-center justify-center text-red-500">{error}</div>;
  if (!chartData.length) return <div className="h-80 flex items-center justify-center text-slate-400">No data</div>;

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData} margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
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
            dot={false}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
