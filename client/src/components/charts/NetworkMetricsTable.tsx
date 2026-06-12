import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { useChartData } from '../../hooks/useChartData';
import { getNetworkNeighborhoods, type GlobalOverrides } from '../../lib/api';
import { getNeighborhoodColor } from '../../lib/utils';
import { MetricTooltip } from '../MetricTooltip';
import { TableCopyWrapper } from './TableCopyWrapper';
import { NETWORK_METRIC_GROUPS, formatMetricValue } from './networkMetricsTableConfig';

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

  const columnCount = data.length + 1;

  return (
    <TableCopyWrapper fileName="network-metrics">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th className="py-2 px-3 font-medium text-start">{t('networkTable.metric')}</th>
            {data.map((neighborhood) => (
              <th key={neighborhood.neighborhood_key} className="py-2 px-3 font-medium text-end">
                <span className="inline-block w-2 h-2 rounded-full me-2" style={{ backgroundColor: getNeighborhoodColor(neighborhood.neighborhood_key) }} />
                {t(`neighborhoods.${neighborhood.neighborhood_key}`, { defaultValue: neighborhood.neighborhood_display })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {NETWORK_METRIC_GROUPS.map((group) => (
            <Fragment key={group.groupLabelKey}>
              <tr className="bg-slate-50 text-slate-500">
                <td className="py-1.5 px-3 font-semibold text-xs uppercase tracking-wide text-start" colSpan={columnCount}>
                  {t(group.groupLabelKey)}
                </td>
              </tr>
              {group.metrics.map((metric) => (
                <tr key={metric.key} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-3 font-medium text-start">
                    {t(`metrics.${metric.key}.label`)}
                    <MetricTooltip description={t(`metrics.${metric.key}.description`)} />
                  </td>
                  {data.map((neighborhood) => {
                    const summary = neighborhood[representation];
                    const value = summary ? metric.getValue(summary, neighborhood) : null;
                    return (
                      <td key={neighborhood.neighborhood_key} className="py-2 px-3 text-end">
                        {formatMetricValue(value, metric.format)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
    </TableCopyWrapper>
  );
}
