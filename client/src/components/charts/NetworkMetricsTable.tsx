import { useTranslation } from 'react-i18next';
import { useChartData } from '../../hooks/useChartData';
import { getNetworkNeighborhoods, type GlobalOverrides } from '../../lib/api';
import { getNeighborhoodColor } from '../../lib/utils';
import { MetricTooltip } from '../MetricTooltip';

interface Props {
  overrides: GlobalOverrides;
}

export function NetworkMetricsTable({ overrides }: Props) {
  const representation = overrides.representation ?? 'topologic';
  const { data, loading, error } = useChartData(
    () => getNetworkNeighborhoods(overrides),
    [JSON.stringify(overrides)]
  );
  const { t } = useTranslation();

  if (loading) return <div className="h-80 flex items-center justify-center text-slate-400">{t('common.loading')}</div>;
  if (error) return <div className="h-80 flex items-center justify-center text-red-500">{error}</div>;
  if (!data?.length) return <div className="h-80 flex items-center justify-center text-slate-400">{t('common.noData')}</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-start text-slate-500">
            <th className="py-2 px-3 font-medium">{t('networkTable.neighborhood')}</th>
            <th className="py-2 px-3 font-medium text-end">
              {t('networkTable.nodes')}
              <MetricTooltip description={t('metrics.node_count.description')} />
            </th>
            <th className="py-2 px-3 font-medium text-end">
              {t('networkTable.edges')}
              <MetricTooltip description={t('metrics.edge_count.description')} />
            </th>
            <th className="py-2 px-3 font-medium text-end">
              {t('networkTable.streetDensity')}
              <MetricTooltip description={t('metrics.street_density_m_per_km2.description')} />
            </th>
            <th className="py-2 px-3 font-medium text-end">
              {t('networkTable.avgDegree')}
              <MetricTooltip description={t('metrics.avg_node_degree.description')} />
            </th>
            <th className="py-2 px-3 font-medium text-end">
              {t('networkTable.circuity')}
              <MetricTooltip description={t('metrics.circuity.description')} />
            </th>
            <th className="py-2 px-3 font-medium text-end">
              {t('networkTable.connectivity')}
              <MetricTooltip description={t('metrics.avg_node_connectivity.description')} />
            </th>
            <th className="py-2 px-3 font-medium text-end">
              {t('networkTable.avgBetweenness')}
              <MetricTooltip description={t('metrics.avg_betweenness.description')} />
            </th>
            <th className="py-2 px-3 font-medium text-end">
              {t('networkTable.exits')}
              <MetricTooltip description={t('metrics.exit_count.description')} />
            </th>
            <th className="py-2 px-3 font-medium text-end">
              {t('networkTable.area')}
              <MetricTooltip description={t('metrics.area_km2.description')} />
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((neighborhood) => {
            const representationSummary = neighborhood[representation];
            if (!representationSummary) {
              return (
                <tr key={neighborhood.neighborhood_key} className="border-b border-slate-100 text-slate-400 italic">
                  <td className="py-2 px-3 font-medium">
                    <span className="inline-block w-2 h-2 rounded-full me-2" style={{ backgroundColor: getNeighborhoodColor(neighborhood.neighborhood_key) }} />
                    {neighborhood.neighborhood_display}
                  </td>
                  <td className="py-2 px-3 text-end" colSpan={9}>{t('common.noData')}</td>
                </tr>
              );
            }
            return (
              <tr key={neighborhood.neighborhood_key} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-2 px-3 font-medium">
                  <span className="inline-block w-2 h-2 rounded-full me-2" style={{ backgroundColor: getNeighborhoodColor(neighborhood.neighborhood_key) }} />
                  {neighborhood.neighborhood_display}
                </td>
                <td className="py-2 px-3 text-end">{representationSummary.basic_stats.node_count}</td>
                <td className="py-2 px-3 text-end">{representationSummary.basic_stats.edge_count}</td>
                <td className="py-2 px-3 text-end">{representationSummary.basic_stats.street_density_m_per_km2.toLocaleString()}</td>
                <td className="py-2 px-3 text-end">{representationSummary.basic_stats.avg_node_degree}</td>
                <td className="py-2 px-3 text-end">{representationSummary.basic_stats.circuity?.toFixed(3) ?? 'N/A'}</td>
                <td className="py-2 px-3 text-end">{representationSummary.connectivity.avg_node_connectivity.toFixed(3)}</td>
                <td className="py-2 px-3 text-end">{representationSummary.centrality_summary.avg_betweenness.toFixed(4)}</td>
                <td className="py-2 px-3 text-end">{representationSummary.exit_count}</td>
                <td className="py-2 px-3 text-end">{neighborhood.area_km2.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
