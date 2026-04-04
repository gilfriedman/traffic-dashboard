import { useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useChartData } from '../../hooks/useChartData';
import { useChartDirection } from '../../hooks/useChartDirection';
import { getCongestionVsStructure, type GlobalOverrides } from '../../lib/api';
import { getNeighborhoodColor, cn } from '../../lib/utils';
import type { CongestionVsStructurePoint } from '../../lib/types';

const METRIC_KEYS = ['street_density', 'intersection_density', 'avg_node_degree', 'circuity', 'connectivity', 'avg_betweenness', 'exit_count'] as const;

type MetricKey = (typeof METRIC_KEYS)[number];

const METRIC_I18N_KEYS: Record<MetricKey, string> = {
  street_density: 'scatter.streetDensity',
  intersection_density: 'scatter.intersectionDensity',
  avg_node_degree: 'scatter.avgNodeDegree',
  circuity: 'scatter.circuity',
  connectivity: 'scatter.connectivity',
  avg_betweenness: 'scatter.avgBetweenness',
  exit_count: 'scatter.exitCount',
};

interface Props {
  overrides: GlobalOverrides;
}

export function CongestionStructureScatter({ overrides }: Props) {
  const { data, loading, error } = useChartData(
    () => getCongestionVsStructure(overrides),
    [JSON.stringify(overrides)]
  );
  const [metricKey, setMetricKey] = useState<MetricKey>('street_density');
  const { t } = useTranslation();
  const { yAxisOrientation, xAxisReversed, mirrorMargin } = useChartDirection();

  if (loading) return <div className="h-96 flex items-center justify-center text-slate-400">{t('common.loading')}</div>;
  if (error) return <div className="h-96 flex items-center justify-center text-red-500">{error}</div>;
  if (!data?.length) return <div className="h-96 flex items-center justify-center text-slate-400">{t('common.noData')}</div>;

  const selectedLabel = t(METRIC_I18N_KEYS[metricKey]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {METRIC_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => setMetricKey(key)}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-full transition-colors',
              metricKey === key
                ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            {t(METRIC_I18N_KEYS[key])}
          </button>
        ))}
      </div>

      <div dir="ltr">
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={mirrorMargin({ top: 10, right: 20, bottom: 40, left: 20 })}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey={metricKey}
            name={selectedLabel}
            reversed={xAxisReversed}
            label={{ value: selectedLabel, position: 'bottom', offset: 20 }}
          />
          <YAxis
            type="number"
            dataKey="avg_congestion"
            name={t('scatter.avgCongestion')}
            orientation={yAxisOrientation}
            label={{ value: t('scatter.avgCongestion'), angle: yAxisOrientation === 'right' ? 90 : -90, position: yAxisOrientation === 'right' ? 'insideRight' : 'insideLeft' }}
          />
          <Tooltip
            content={({ payload }) => {
              if (!payload?.length) return null;
              const point = payload[0].payload as CongestionVsStructurePoint;
              return (
                <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
                  <p className="font-semibold">{point.neighborhood_display}</p>
                  <p className="text-slate-600">{selectedLabel}: {point[metricKey]?.toLocaleString()}</p>
                  <p className="text-slate-600">{t('scatter.avgCongestion')}: {point.avg_congestion.toFixed(3)}x</p>
                  <p className="text-slate-600">{t('scatter.maxCongestion')}: {point.max_congestion.toFixed(3)}x</p>
                  <p className="text-slate-400 text-xs">{point.sample_count.toLocaleString()} {t('scatter.samples')}</p>
                </div>
              );
            }}
          />
          <Scatter data={data}>
            {data.map((entry) => (
              <Cell key={entry.neighborhood_key} fill={getNeighborhoodColor(entry.neighborhood_key)} r={8} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
