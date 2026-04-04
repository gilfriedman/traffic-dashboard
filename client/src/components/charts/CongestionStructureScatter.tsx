import { useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useChartData } from '../../hooks/useChartData';
import { getCongestionVsStructure, type GlobalOverrides } from '../../lib/api';
import { getNeighborhoodColor, cn } from '../../lib/utils';
import type { CongestionVsStructurePoint } from '../../lib/types';

const METRIC_OPTIONS = [
  { key: 'street_density', label: 'Street Density (m/km²)' },
  { key: 'intersection_density', label: 'Intersection Density (/km²)' },
  { key: 'avg_node_degree', label: 'Avg Node Degree' },
  { key: 'circuity', label: 'Circuity' },
  { key: 'connectivity', label: 'Connectivity' },
  { key: 'avg_betweenness', label: 'Avg Betweenness' },
  { key: 'exit_count', label: 'Exit Count' },
] as const;

type MetricKey = (typeof METRIC_OPTIONS)[number]['key'];

interface Props {
  overrides: GlobalOverrides;
}

export function CongestionStructureScatter({ overrides }: Props) {
  const { data, loading, error } = useChartData(
    () => getCongestionVsStructure(overrides),
    [JSON.stringify(overrides)]
  );
  const [metricKey, setMetricKey] = useState<MetricKey>('street_density');

  if (loading) return <div className="h-96 flex items-center justify-center text-slate-400">Loading...</div>;
  if (error) return <div className="h-96 flex items-center justify-center text-red-500">{error}</div>;
  if (!data?.length) return <div className="h-96 flex items-center justify-center text-slate-400">No data</div>;

  const selectedLabel = METRIC_OPTIONS.find((option) => option.key === metricKey)?.label ?? metricKey;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {METRIC_OPTIONS.map((option) => (
          <button
            key={option.key}
            onClick={() => setMetricKey(option.key)}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-full transition-colors',
              metricKey === option.key
                ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 40, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey={metricKey}
            name={selectedLabel}
            label={{ value: selectedLabel, position: 'bottom', offset: 20 }}
          />
          <YAxis
            type="number"
            dataKey="avg_congestion"
            name="Avg Congestion"
            label={{ value: 'Avg Congestion', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            content={({ payload }) => {
              if (!payload?.length) return null;
              const point = payload[0].payload as CongestionVsStructurePoint;
              return (
                <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
                  <p className="font-semibold">{point.neighborhood_display}</p>
                  <p className="text-slate-600">{selectedLabel}: {point[metricKey]?.toLocaleString()}</p>
                  <p className="text-slate-600">Avg Congestion: {point.avg_congestion.toFixed(3)}x</p>
                  <p className="text-slate-600">Max Congestion: {point.max_congestion.toFixed(3)}x</p>
                  <p className="text-slate-400 text-xs">{point.sample_count.toLocaleString()} samples</p>
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
  );
}
