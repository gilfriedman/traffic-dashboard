import { useState, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useChartData } from '../../hooks/useChartData';
import { useChartDirection } from '../../hooks/useChartDirection';
import { congestionBaselineLine, congestionAxisDomain } from './CongestionBaselineLine';
import { getCongestionVsDemographics, type GlobalOverrides } from '../../lib/api';
import { getNeighborhoodColor, cn } from '../../lib/utils';
import { computeLinearRegression } from '../../lib/regression';
import { RegressionStatsBadge } from './RegressionStatsBadge';
import type { CongestionVsDemographicsPoint } from '../../lib/types';

const METRIC_KEYS = [
  'cars_per_100_residents',
  'population_density_per_km2',
  'socioeconomic_cluster',
  'avg_income_per_capita',
  'pct_academic_degree',
  'employment_rate',
  'pct_households_2_plus_cars',
] as const;

type MetricKey = (typeof METRIC_KEYS)[number];

const METRIC_I18N_KEYS: Record<MetricKey, string> = {
  cars_per_100_residents: 'demographicsScatter.carsPer100Residents',
  population_density_per_km2: 'demographicsScatter.populationDensity',
  socioeconomic_cluster: 'demographicsScatter.socioeconomicCluster',
  avg_income_per_capita: 'demographicsScatter.avgIncome',
  pct_academic_degree: 'demographicsScatter.pctAcademic',
  employment_rate: 'demographicsScatter.employmentRate',
  pct_households_2_plus_cars: 'demographicsScatter.pct2PlusCars',
};

interface Props {
  overrides: GlobalOverrides;
}

export function CongestionDemographicsScatter({ overrides }: Props) {
  const { data, loading, error } = useChartData(
    () => getCongestionVsDemographics(overrides),
    [JSON.stringify(overrides)]
  );
  const [selectedKey, setSelectedKey] = useState<MetricKey | null>(null);
  const { t } = useTranslation();
  const { yAxisOrientation, xAxisReversed, mirrorMargin } = useChartDirection();

  const orderedKeys = useMemo(() => {
    if (!data?.length) return [...METRIC_KEYS];
    const r2ByKey = new Map<MetricKey, number>();
    for (const key of METRIC_KEYS) {
      const points = data
        .filter((point) => point[key] != null)
        .map((point) => ({ x: point[key] as number, y: point.avg_congestion }));
      const fit = computeLinearRegression(points);
      r2ByKey.set(key, fit?.r2 ?? -Infinity);
    }
    return [...METRIC_KEYS].sort((a, b) => (r2ByKey.get(b) ?? -Infinity) - (r2ByKey.get(a) ?? -Infinity));
  }, [data]);

  const metricKey = selectedKey ?? orderedKeys[0];

  const filteredData = useMemo(
    () => data?.filter((point) => point[metricKey] != null) ?? [],
    [data, metricKey]
  );

  const regression = useMemo(() => {
    if (!filteredData.length) return null;
    const points = filteredData.map((point) => ({ x: point[metricKey] as number, y: point.avg_congestion }));
    return computeLinearRegression(points);
  }, [filteredData, metricKey]);

  if (loading) return <div className="h-96 flex items-center justify-center text-slate-400">{t('common.loading')}</div>;
  if (error) return <div className="h-96 flex items-center justify-center text-red-500">{error}</div>;
  if (!data?.length) return <div className="h-96 flex items-center justify-center text-slate-400">{t('common.noData')}</div>;

  const selectedLabel = t(METRIC_I18N_KEYS[metricKey]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {orderedKeys.map((key) => (
          <button
            key={key}
            onClick={() => setSelectedKey(key)}
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

      <div dir="ltr" className="relative">
      {regression && <RegressionStatsBadge r2={regression.r2} sampleCount={data.length} />}
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
            domain={congestionAxisDomain}
            orientation={yAxisOrientation}
            label={{ value: t('scatter.avgCongestion'), angle: yAxisOrientation === 'right' ? 90 : -90, position: yAxisOrientation === 'right' ? 'insideRight' : 'insideLeft' }}
          />
          <Tooltip
            content={({ payload }) => {
              if (!payload?.length) return null;
              const point = payload[0].payload as CongestionVsDemographicsPoint;
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
          {congestionBaselineLine('y')}
          <Scatter data={filteredData}>
            {filteredData.map((entry) => (
              <Cell key={entry.neighborhood_key} fill={getNeighborhoodColor(entry.neighborhood_key)} r={8} />
            ))}
          </Scatter>
          {regression && (
            <Scatter
              data={[
                { [metricKey]: regression.startX, avg_congestion: regression.startY },
                { [metricKey]: regression.endX, avg_congestion: regression.endY },
              ]}
              line={{ stroke: '#94a3b8', strokeWidth: 2, strokeDasharray: '6 4' }}
              fill="none"
              legendType="none"
              isAnimationActive={false}
            />
          )}
        </ScatterChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
