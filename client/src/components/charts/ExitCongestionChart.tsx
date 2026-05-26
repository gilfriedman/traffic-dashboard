import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useChartData } from '../../hooks/useChartData';
import { useChartDirection } from '../../hooks/useChartDirection';
import { congestionBaselineLine, congestionAxisDomain } from './CongestionBaselineLine';
import { getExitCongestion, type GlobalOverrides } from '../../lib/api';
import { getNeighborhoodColor, cn } from '../../lib/utils';

const NEIGHBORHOOD_KEYS = ['', 'old_city', 'shchuna_bet', 'shchuna_he', 'ramot_bet', 'neve_zeev', 'rambam'] as const;

interface Props {
  overrides: GlobalOverrides;
}

export function ExitCongestionChart({ overrides }: Props) {
  const [neighborhood, setNeighborhood] = useState('');
  const { data, loading, error } = useChartData(
    () => getExitCongestion(overrides, neighborhood || undefined),
    [neighborhood, JSON.stringify(overrides)]
  );
  const { t } = useTranslation();
  const { xAxisReversed, mirrorMargin } = useChartDirection();

  if (loading) return <div className="h-96 flex items-center justify-center text-slate-400">{t('common.loading')}</div>;
  if (error) return <div className="h-96 flex items-center justify-center text-red-500">{error}</div>;
  if (!data?.length) return <div className="h-96 flex items-center justify-center text-slate-400">{t('common.noData')}</div>;

  const top30 = data.slice(0, 30);
  const chartHeight = Math.max(400, top30.length * 28);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {NEIGHBORHOOD_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => setNeighborhood(key)}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-full transition-colors',
              neighborhood === key
                ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            {key === '' ? t('exitChart.all') : t(`neighborhoods.${key}`)}
          </button>
        ))}
      </div>

      <div dir="ltr">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={top30} layout="vertical" margin={mirrorMargin({ left: 140, right: 20, top: 10, bottom: 10 })}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" domain={congestionAxisDomain} reversed={xAxisReversed} />
          <YAxis
            type="category"
            dataKey="exit_street_name"
            width={140}
            tick={{ fontSize: 11 }}
            orientation={xAxisReversed ? 'right' : 'left'}
          />
          <Tooltip
            content={({ payload }) => {
              if (!payload?.length) return null;
              const exit = payload[0].payload as (typeof top30)[number];
              return (
                <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm" dir="auto">
                  <p className="font-semibold">{exit.exit_street_name}</p>
                  <p className="text-slate-600">{t('exitChart.avgCongestion')}: {exit.avg_congestion.toFixed(3)}x</p>
                  <p className="text-slate-600">{exit.matched_route_name} ({exit.neighborhood_display})</p>
                  <p className="text-slate-400 text-xs">{Math.round(exit.distance_meters)}m</p>
                </div>
              );
            }}
          />
          {congestionBaselineLine('x')}
          <Bar dataKey="avg_congestion" radius={[0, 4, 4, 0]}>
            {top30.map((entry, index) => (
              <Cell key={index} fill={getNeighborhoodColor(entry.neighborhood_key)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
