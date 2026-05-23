import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useChartData } from '../../hooks/useChartData';
import { useChartDirection } from '../../hooks/useChartDirection';
import { getRouteRanking } from '../../lib/api';
import { getNeighborhoodColor } from '../../lib/utils';
import type { Filters } from '../../lib/types';

interface Props {
  filters: Filters;
}

export function RouteRankingChart({ filters }: Props) {
  const { data, loading, error } = useChartData(
    () => getRouteRanking(filters),
    [JSON.stringify(filters)]
  );
  const { t } = useTranslation();
  const { xAxisReversed, mirrorMargin } = useChartDirection();

  if (loading) return <div className="h-80 flex items-center justify-center text-slate-400">{t('common.loading')}</div>;
  if (error) return <div className="h-80 flex items-center justify-center text-red-500">{error}</div>;
  if (!data?.length) return <div className="h-80 flex items-center justify-center text-slate-400">{t('common.noData')}</div>;

  const top20 = data.slice(0, 20);
  const height = Math.max(400, top20.length * 28);

  return (
    <div dir="ltr">
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={top20} layout="vertical" margin={mirrorMargin({ left: 120, right: 20, top: 10, bottom: 10 })}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" domain={[0, 'auto']} reversed={xAxisReversed} />
        <YAxis
          type="category"
          dataKey="route_name"
          width={120}
          tick={{ fontSize: 11 }}
          orientation={xAxisReversed ? 'right' : 'left'}
        />
        <Tooltip
          formatter={(value) => [Number(value).toFixed(3) + 'x', t('common.avgCongestion')]}
          labelFormatter={(label) => {
            const route = top20.find((route) => route.route_name === String(label));
            const neighborhoodName = route
              ? t(`neighborhoods.${route.neighborhood}`, { defaultValue: route.neighborhood_display })
              : '';
            return `${label} (${neighborhoodName})`;
          }}
        />
        <Bar dataKey="avg_congestion" radius={[0, 4, 4, 0]}>
          {top20.map((entry) => (
            <Cell key={entry.route_id} fill={getNeighborhoodColor(entry.neighborhood)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
    </div>
  );
}
