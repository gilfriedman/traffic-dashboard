import { useTranslation } from 'react-i18next';
import { useChartData } from '../../hooks/useChartData';
import { getNetworkNeighborhoods, type GlobalOverrides } from '../../lib/api';
import { getNeighborhoodColor } from '../../lib/utils';
import { MetricTooltip } from '../MetricTooltip';

interface Props {
  overrides: GlobalOverrides;
}

export function SpaceSyntaxTable({ overrides }: Props) {
  const { data, loading, error } = useChartData(
    () => getNetworkNeighborhoods({ ...overrides, representation: 'topologic' }),
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
            <th className="py-2 px-3 font-medium">{t('spaceSyntaxTable.neighborhood')}</th>
            <th className="py-2 px-3 font-medium text-end">
              {t('spaceSyntaxTable.meanDepth')}
              <MetricTooltip description={t('metrics.mean_depth.description')} />
            </th>
            <th className="py-2 px-3 font-medium text-end">
              {t('spaceSyntaxTable.integration')}
              <MetricTooltip description={t('metrics.integration.description')} />
            </th>
            <th className="py-2 px-3 font-medium text-end">
              {t('spaceSyntaxTable.intelligibility')}
              <MetricTooltip description={t('metrics.intelligibility.description')} />
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((neighborhood) => {
            const spaceSyntax = neighborhood.topologic?.space_syntax;
            if (!spaceSyntax) {
              return (
                <tr key={neighborhood.neighborhood_key} className="border-b border-slate-100 text-slate-400 italic">
                  <td className="py-2 px-3 font-medium">
                    <span className="inline-block w-2 h-2 rounded-full me-2" style={{ backgroundColor: getNeighborhoodColor(neighborhood.neighborhood_key) }} />
                    {neighborhood.neighborhood_display}
                  </td>
                  <td className="py-2 px-3 text-end" colSpan={3}>{t('common.noData')}</td>
                </tr>
              );
            }
            return (
              <tr key={neighborhood.neighborhood_key} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-2 px-3 font-medium">
                  <span className="inline-block w-2 h-2 rounded-full me-2" style={{ backgroundColor: getNeighborhoodColor(neighborhood.neighborhood_key) }} />
                  {neighborhood.neighborhood_display}
                </td>
                <td className="py-2 px-3 text-end">{spaceSyntax.mean_depth.toFixed(2)}</td>
                <td className="py-2 px-3 text-end">{spaceSyntax.integration?.toFixed(2) ?? 'N/A'}</td>
                <td className="py-2 px-3 text-end">{spaceSyntax.intelligibility?.toFixed(3) ?? 'N/A'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
