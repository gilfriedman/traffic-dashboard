import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useChartData } from '../../hooks/useChartData';
import { useChartDirection } from '../../hooks/useChartDirection';
import { congestionBaselineLine, congestionAxisDomain } from './CongestionBaselineLine';
import { getRushHourProfile } from '../../lib/api';
import { getNeighborhoodColor, getRouteColor } from '../../lib/utils';
import type { CongestionMetric, Filters, RushHourPoint } from '../../lib/types';

interface Props {
  filters: Filters;
  metric?: CongestionMetric;
}

const METRIC_TO_FIELD: Record<CongestionMetric, keyof Pick<RushHourPoint, 'avg_congestion' | 'max_congestion' | 'min_congestion'>> = {
  avg: 'avg_congestion',
  max: 'max_congestion',
  min: 'min_congestion',
};

export function RushHourChart({ filters, metric = 'avg' }: Props) {
  const { data, loading, error } = useChartData(
    () => getRushHourProfile(filters),
    [JSON.stringify(filters)]
  );
  const { t } = useTranslation();
  const { yAxisOrientation, xAxisReversed, mirrorMargin } = useChartDirection();

  const slots = data?.slots ?? [];
  const baselines = data?.baselines ?? {};
  const valueField = METRIC_TO_FIELD[metric];

  const { chartData, seriesKeys, seriesColors, byRoute } = useMemo(() => {
    if (!slots.length) return { chartData: [], seriesKeys: [], seriesColors: {} as Record<string, string>, byRoute: false };

    const isRouteData = Boolean(slots[0].route_id);
    const seriesKeyFn = isRouteData
      ? (point: RushHourPoint) => point.route_id!
      : (point: RushHourPoint) => point.neighborhood!;

    const uniqueKeys = [...new Set(slots.map(seriesKeyFn))];
    const slotMap = new Map<string, Record<string, number>>();

    for (const point of slots) {
      const existing = slotMap.get(point.time_slot) ?? {};
      existing[seriesKeyFn(point)] = point[valueField];
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
  }, [slots, valueField]);

  const routeNameMap = useMemo(() => {
    if (!byRoute || !slots.length) return {};
    const map: Record<string, string> = {};
    for (const point of slots) {
      if (point.route_id && point.route_name) map[point.route_id] = point.route_name;
    }
    return map;
  }, [slots, byRoute]);

  const resolveLabel = (key: string) =>
    byRoute ? (routeNameMap[key] ?? key) : t(`neighborhoods.${key}`, { defaultValue: key });

  if (loading) return <div className="h-80 flex items-center justify-center text-slate-400">{t('common.loading')}</div>;
  if (error) return <div className="h-80 flex items-center justify-center text-red-500">{error}</div>;
  if (!chartData.length) return <div className="h-80 flex items-center justify-center text-slate-400">{t('common.noData')}</div>;

  return (
    <div dir="ltr">
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData} margin={mirrorMargin({ left: 10, right: 20, top: 10, bottom: 10 })}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time_slot" tick={{ fontSize: 12 }} reversed={xAxisReversed} />
        <YAxis domain={congestionAxisDomain} orientation={yAxisOrientation} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const rows = payload
              .filter((entry) => typeof entry.value === 'number')
              .map((entry) => {
                const key = String(entry.dataKey);
                return {
                  key,
                  name: resolveLabel(key),
                  value: entry.value as number,
                  baseline: baselines[key]?.[metric],
                  color: (entry.color ?? '#000') as string,
                };
              })
              .sort((first, second) => second.value - first.value);
            if (!rows.length) return null;
            return (
              <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
                <div className="mb-1 font-medium text-slate-700">{label}</div>
                {rows.map((row) => (
                  <div key={row.key} className="flex items-center gap-2 leading-tight">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} />
                    <span className="text-slate-700">{row.name}:</span>
                    <span className="font-mono text-slate-900">{row.value.toFixed(3)}</span>
                    {Number.isFinite(row.baseline) && (
                      <span className="font-mono text-slate-400">({row.baseline!.toFixed(3)})</span>
                    )}
                  </div>
                ))}
              </div>
            );
          }}
        />
        <Legend formatter={(value) => resolveLabel(String(value))} />
        {congestionBaselineLine('y')}
        {seriesKeys.map((key) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            name={resolveLabel(key)}
            stroke={seriesColors[key]}
            strokeWidth={2}
            dot
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
    </div>
  );
}
