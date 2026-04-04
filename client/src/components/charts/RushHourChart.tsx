import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useChartData } from '../../hooks/useChartData';
import { getRushHourProfile } from '../../lib/api';
import { getNeighborhoodColor, getRouteColor } from '../../lib/utils';
import type { Filters } from '../../lib/types';

interface Props {
  filters: Filters;
}

export function RushHourChart({ filters }: Props) {
  const { data, loading, error } = useChartData(
    () => getRushHourProfile(filters),
    [JSON.stringify(filters)]
  );

  const { chartData, seriesKeys, seriesColors, byRoute } = useMemo(() => {
    if (!data?.length) return { chartData: [], seriesKeys: [], seriesColors: {} as Record<string, string>, byRoute: false };

    const isRouteData = Boolean(data[0].route_id);
    const seriesKeyFn = isRouteData
      ? (point: (typeof data)[0]) => point.route_id!
      : (point: (typeof data)[0]) => point.neighborhood!;

    const uniqueKeys = [...new Set(data.map(seriesKeyFn))];
    const slotMap = new Map<string, Record<string, number>>();

    for (const point of data) {
      const existing = slotMap.get(point.time_slot) ?? {};
      existing[seriesKeyFn(point)] = point.avg_congestion;
      slotMap.set(point.time_slot, existing);
    }

    const rows = Array.from(slotMap.entries())
      .map(([time_slot, values]) => ({ time_slot, ...values }))
      .sort((first, second) => first.time_slot.localeCompare(second.time_slot));

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
      <LineChart data={chartData} margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time_slot" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 'auto']} />
        <Tooltip />
        <Legend formatter={(value) => byRoute ? (routeNameMap[value] ?? value) : value} />
        {seriesKeys.map((key) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            name={key}
            stroke={seriesColors[key]}
            strokeWidth={2}
            dot
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
