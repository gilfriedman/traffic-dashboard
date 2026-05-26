import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useChartData } from '../../hooks/useChartData';
import { useChartDirection } from '../../hooks/useChartDirection';
import { congestionBaselineLine, congestionAxisDomain } from './CongestionBaselineLine';
import { ChartCopyWrapper } from './ChartCopyWrapper';
import { getNeighborhoodComparison } from '../../lib/api';
import { getNeighborhoodColor } from '../../lib/utils';
import type { Filters } from '../../lib/types';

interface Props {
  filters: Filters;
}

export function NeighborhoodComparisonChart({ filters }: Props) {
  const { data, loading, error } = useChartData(
    () => getNeighborhoodComparison(filters),
    [JSON.stringify(filters)]
  );
  const { t } = useTranslation();
  const { xAxisReversed, mirrorMargin } = useChartDirection();

  if (loading) return <div className="h-64 flex items-center justify-center text-slate-400">{t('common.loading')}</div>;
  if (error) return <div className="h-64 flex items-center justify-center text-red-500">{error}</div>;
  if (!data?.length) return <div className="h-64 flex items-center justify-center text-slate-400">{t('common.noData')}</div>;

  return (
    <ChartCopyWrapper fileName="neighborhood-comparison">
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={mirrorMargin({ left: 80, right: 20, top: 10, bottom: 10 })}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" domain={congestionAxisDomain} reversed={xAxisReversed} />
        <YAxis
          type="category"
          dataKey="neighborhood"
          width={80}
          tick={{ fontSize: 12 }}
          orientation={xAxisReversed ? 'right' : 'left'}
          tickFormatter={(key) => t(`neighborhoods.${key}`, { defaultValue: key })}
        />
        <Tooltip
          formatter={(value) => [Number(value).toFixed(3) + 'x', t('common.avgCongestion')]}
          labelFormatter={(key) => t(`neighborhoods.${key}`, { defaultValue: String(key) })}
        />
        {congestionBaselineLine('x')}
        <Bar dataKey="avg_congestion" radius={[0, 4, 4, 0]}>
          {data.map((entry) => (
            <Cell key={entry.neighborhood} fill={getNeighborhoodColor(entry.neighborhood)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
    </ChartCopyWrapper>
  );
}
