import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useChartData } from '../../hooks/useChartData';
import { useChartDirection } from '../../hooks/useChartDirection';
import { getCongestionOverTime } from '../../lib/api';
import { getNeighborhoodColor, getRouteColor } from '../../lib/utils';
import type { Filters } from '../../lib/types';

interface Props {
  filters: Filters;
  granularity?: string;
}

type ChartRow = Record<string, string | number | undefined>;

function getHour(timeStr: string): number {
  const hourMatch = timeStr.match(/ (\d{2}):/);
  return hourMatch ? parseInt(hourMatch[1], 10) : -1;
}

function insertNightGaps(rows: ChartRow[], granularity: string): ChartRow[] {
  if (granularity === 'day' || granularity === 'week' || rows.length < 2) return rows;

  const result: ChartRow[] = [rows[0]];
  for (let i = 1; i < rows.length; i++) {
    const prevHour = getHour(rows[i - 1].time as string);
    const currHour = getHour(rows[i].time as string);
    const prevDate = (rows[i - 1].time as string).split(' ')[0];
    const currDate = (rows[i].time as string).split(' ')[0];

    const crossesNight = (prevHour >= 21 && currHour <= 6) ||
      (prevDate !== currDate && currHour <= 6);

    if (crossesNight) {
      result.push({ time: `_gap_${i}` });
    }
    result.push(rows[i]);
  }
  return result;
}

function isGapRow(time: string): boolean {
  return time.startsWith('_gap_');
}

export function CongestionOverTimeChart({ filters, granularity = 'day' }: Props) {
  const { data, loading, error } = useChartData(
    () => getCongestionOverTime(filters, granularity),
    [JSON.stringify(filters), granularity]
  );
  const { t } = useTranslation();
  const { yAxisOrientation, xAxisReversed, mirrorMargin } = useChartDirection();

  const { chartData, seriesKeys, seriesColors, byRoute } = useMemo(() => {
    if (!data?.length) return { chartData: [] as ChartRow[], seriesKeys: [], seriesColors: {} as Record<string, string>, byRoute: false };

    const isRouteData = Boolean(data[0].route_id);
    const seriesKeyFn = isRouteData
      ? (point: (typeof data)[0]) => point.route_id!
      : (point: (typeof data)[0]) => point.neighborhood!;

    const uniqueKeys = [...new Set(data.map(seriesKeyFn))];
    const timeMap = new Map<string, Record<string, number>>();

    for (const point of data) {
      const existing = timeMap.get(point.time) ?? {};
      existing[seriesKeyFn(point)] = point.avg_congestion;
      timeMap.set(point.time, existing);
    }

    const sorted = Array.from(timeMap.entries())
      .map(([time, values]) => ({ time, ...values } as ChartRow))
      .sort((first, second) => (first.time as string).localeCompare(second.time as string));

    const rows = insertNightGaps(sorted, granularity);

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

  const dayBoundaries = useMemo(() => {
    if (granularity === 'day' || granularity === 'week') return [];
    const boundaries: { time: string; label: string }[] = [];
    for (let i = 1; i < chartData.length; i++) {
      const time = chartData[i].time as string;
      if (isGapRow(time)) continue;
      const prevEntry = chartData[i - 1];
      const prevTime = prevEntry.time as string;
      if (isGapRow(prevTime)) continue;
      const prevDate = prevTime.split(' ')[0];
      const currDate = time.split(' ')[0];
      if (currDate !== prevDate) {
        boundaries.push({ time, label: currDate });
      }
    }
    return boundaries;
  }, [chartData, granularity]);

  if (loading) return <div className="h-80 flex items-center justify-center text-slate-400">{t('common.loading')}</div>;
  if (error) return <div className="h-80 flex items-center justify-center text-red-500">{error}</div>;
  if (!chartData.length) return <div className="h-80 flex items-center justify-center text-slate-400">{t('common.noData')}</div>;

  return (
    <div dir="ltr">
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData} margin={mirrorMargin({ left: 10, right: 20, top: 10, bottom: 10 })}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 11 }}
          angle={-30}
          textAnchor="end"
          height={60}
          reversed={xAxisReversed}
          tickFormatter={(value) => isGapRow(value) ? '' : value}
        />
        <YAxis domain={[0, 'auto']} orientation={yAxisOrientation} />
        <Tooltip filterNull />
        <Legend formatter={(value) => byRoute ? (routeNameMap[value] ?? value) : value} />
        {dayBoundaries.map((boundary) => (
          <ReferenceLine
            key={boundary.time}
            x={boundary.time}
            stroke="#334155"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{ value: boundary.label, position: 'top', fontSize: 10, fill: '#475569' }}
          />
        ))}
        {seriesKeys.map((key) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            name={byRoute ? key : t(`neighborhoods.${key}`, { defaultValue: key })}
            stroke={seriesColors[key]}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
    </div>
  );
}
