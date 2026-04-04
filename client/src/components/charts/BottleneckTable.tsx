import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useChartData } from '../../hooks/useChartData';
import { getBottlenecks, type GlobalOverrides } from '../../lib/api';
import { cn } from '../../lib/utils';
import { MetricTooltip } from '../MetricTooltip';

const NEIGHBORHOOD_KEYS = ['old_city', 'shchuna_bet', 'shchuna_he', 'ramot_bet', 'neve_zeev', 'rambam'] as const;

interface Props {
  overrides: GlobalOverrides;
}

export function BottleneckTable({ overrides }: Props) {
  const [neighborhood, setNeighborhood] = useState('old_city');
  const { data, loading, error } = useChartData(
    () => getBottlenecks(neighborhood, overrides),
    [neighborhood, JSON.stringify(overrides)]
  );
  const { t } = useTranslation();

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
            {t(`neighborhoods.${key}`)}
          </button>
        ))}
      </div>

      {loading && <div className="h-80 flex items-center justify-center text-slate-400">{t('common.loading')}</div>}
      {error && <div className="h-80 flex items-center justify-center text-red-500">{error}</div>}
      {!loading && !error && !data?.length && (
        <div className="h-80 flex items-center justify-center text-slate-400">{t('bottleneckTable.noBottlenecks')}</div>
      )}

      {data && data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-start text-slate-500">
                <th className="py-2 px-3 font-medium">#</th>
                <th className="py-2 px-3 font-medium text-end">{t('bottleneckTable.bottleneckScore')}</th>
                <th className="py-2 px-3 font-medium text-end">
                  {t('bottleneckTable.betweenness')}
                  <MetricTooltip description={t('metrics.betweenness_centrality.description')} />
                </th>
                <th className="py-2 px-3 font-medium text-end">
                  {t('bottleneckTable.closeness')}
                  <MetricTooltip description={t('metrics.closeness_centrality.description')} />
                </th>
                <th className="py-2 px-3 font-medium text-end">{t('bottleneckTable.degree')}</th>
                <th className="py-2 px-3 font-medium text-end">{t('bottleneckTable.nearbyCongestion')}</th>
                <th className="py-2 px-3 font-medium text-end">{t('bottleneckTable.nearbyRoutes')}</th>
                <th className="py-2 px-3 font-medium text-center">{t('bottleneckTable.exitNode')}</th>
                <th className="py-2 px-3 font-medium text-end">{t('bottleneckTable.coords')}</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 30).map((node, index) => (
                <tr key={node.osm_node_id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-3 text-slate-400">{index + 1}</td>
                  <td className="py-2 px-3 text-end font-semibold text-amber-600">
                    {node.bottleneck_score.toFixed(4)}
                  </td>
                  <td className="py-2 px-3 text-end">{node.betweenness_centrality.toFixed(4)}</td>
                  <td className="py-2 px-3 text-end">{node.closeness_centrality.toFixed(4)}</td>
                  <td className="py-2 px-3 text-end">{node.degree}</td>
                  <td className="py-2 px-3 text-end">{node.nearby_avg_congestion.toFixed(3)}x</td>
                  <td className="py-2 px-3 text-end">{node.nearby_route_count}</td>
                  <td className="py-2 px-3 text-center">{node.is_exit_node ? '✓' : ''}</td>
                  <td className="py-2 px-3 text-end text-xs text-slate-400">
                    {node.lat.toFixed(4)}, {node.lng.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
