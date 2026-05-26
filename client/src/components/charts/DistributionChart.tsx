import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useChartData } from '../../hooks/useChartData';
import { useChartDirection } from '../../hooks/useChartDirection';
import { ChartCopyWrapper } from './ChartCopyWrapper';
import { getCongestionDistribution } from '../../lib/api';
import type { Filters } from '../../lib/types';

interface Props {
  filters: Filters;
}

export function DistributionChart({ filters }: Props) {
  const { data, loading, error } = useChartData(
    () => getCongestionDistribution(filters),
    [JSON.stringify(filters)]
  );
  const { t } = useTranslation();
  const { yAxisOrientation, xAxisReversed, mirrorMargin } = useChartDirection();

  if (loading) return <div className="h-80 flex items-center justify-center text-slate-400">{t('common.loading')}</div>;
  if (error) return <div className="h-80 flex items-center justify-center text-red-500">{error}</div>;
  if (!data?.length) return <div className="h-80 flex items-center justify-center text-slate-400">{t('common.noData')}</div>;

  return (
    <ChartCopyWrapper fileName="congestion-distribution">
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={mirrorMargin({ left: 10, right: 20, top: 10, bottom: 10 })}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="bucket" tick={{ fontSize: 12 }} reversed={xAxisReversed} />
        <YAxis orientation={yAxisOrientation} />
        <Tooltip formatter={(value) => [Number(value).toLocaleString(), t('dataPage.records')]} />
        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
    </ChartCopyWrapper>
  );
}
