import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useChartData } from '../../hooks/useChartData';
import { getDayOfWeek } from '../../lib/api';
import { getNeighborhoodColor, DAYS_OF_WEEK } from '../../lib/utils';
import type { Filters } from '../../lib/types';

interface Props {
  filters: Filters;
}

export function DayOfWeekChart({ filters }: Props) {
  const { data, loading, error } = useChartData(
    () => getDayOfWeek(filters),
    [JSON.stringify(filters)]
  );

  const { chartData, neighborhoods } = useMemo(() => {
    if (!data?.length) return { chartData: [], neighborhoods: [] };

    const uniqueNeighborhoods = [...new Set(data.map((point) => point.neighborhood))];
    const dayMap = new Map<string, Record<string, number>>();

    for (const point of data) {
      const existing = dayMap.get(point.day) ?? {};
      existing[point.neighborhood] = point.avg_congestion;
      dayMap.set(point.day, existing);
    }

    const rows = DAYS_OF_WEEK
      .filter((day) => dayMap.has(day))
      .map((day) => ({ day, ...dayMap.get(day)! }));

    return { chartData: rows, neighborhoods: uniqueNeighborhoods };
  }, [data]);

  if (loading) return <div className="h-80 flex items-center justify-center text-slate-400">Loading...</div>;
  if (error) return <div className="h-80 flex items-center justify-center text-red-500">{error}</div>;
  if (!chartData.length) return <div className="h-80 flex items-center justify-center text-slate-400">No data</div>;

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData} margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 'auto']} />
        <Tooltip />
        <Legend />
        {neighborhoods.map((neighborhood) => (
          <Bar
            key={neighborhood}
            dataKey={neighborhood}
            fill={getNeighborhoodColor(neighborhood)}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
