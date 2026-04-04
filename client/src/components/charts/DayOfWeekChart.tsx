import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useChartData } from '../../hooks/useChartData';
import { getDayOfWeek } from '../../lib/api';
import { getNeighborhoodColor, getRouteColor, DAYS_OF_WEEK } from '../../lib/utils';
import type { Filters } from '../../lib/types';

interface Props {
  filters: Filters;
}

export function DayOfWeekChart({ filters }: Props) {
  const { data, loading, error } = useChartData(
    () => getDayOfWeek(filters),
    [JSON.stringify(filters)]
  );

  const { chartData, seriesKeys, seriesColors, byRoute } = useMemo(() => {
    if (!data?.length) return { chartData: [], seriesKeys: [], seriesColors: {} as Record<string, string>, byRoute: false };

    const isRouteData = Boolean(data[0].route_id);
    const seriesKeyFn = isRouteData
      ? (point: (typeof data)[0]) => point.route_id!
      : (point: (typeof data)[0]) => point.neighborhood!;

    const uniqueKeys = [...new Set(data.map(seriesKeyFn))];
    const dayMap = new Map<string, Record<string, number>>();

    for (const point of data) {
      const existing = dayMap.get(point.day) ?? {};
      existing[seriesKeyFn(point)] = point.avg_congestion;
      dayMap.set(point.day, existing);
    }

    const rows = DAYS_OF_WEEK
      .filter((day) => dayMap.has(day))
      .map((day) => ({ day, ...dayMap.get(day)! }));

    const colors: Record<string, string> = {};
    uniqueKeys.forEach((key, index) => {
      colors[key] = isRouteData ? getRouteColor(index) : getNeighborhoodColor(key);
    });

    return { chartData: rows, seriesKeys: uniqueKeys, seriesColors: colors, byRoute: isRouteData };
  }, [data]);

  const routeNameMap = useMemo(() => {
    if (!byRoute || !data?.length) return {};
    const map: Record<string, string> = {};
    for (const point of data) {
      if (point.route_id && point.route_name) map[point.route_id] = point.route_name;
    }
    return map;
  }, [data, byRoute]);

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
        <Legend formatter={(value) => byRoute ? (routeNameMap[value] ?? value) : value} />
        {seriesKeys.map((key) => (
          <Bar
            key={key}
            dataKey={key}
            name={key}
            fill={seriesColors[key]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
