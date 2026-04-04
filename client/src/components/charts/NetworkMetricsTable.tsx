import { useChartData } from '../../hooks/useChartData';
import { getNetworkNeighborhoods, type GlobalOverrides } from '../../lib/api';
import { getNeighborhoodColor } from '../../lib/utils';

interface Props {
  overrides: GlobalOverrides;
}

export function NetworkMetricsTable({ overrides }: Props) {
  const { data, loading, error } = useChartData(
    () => getNetworkNeighborhoods(overrides),
    [JSON.stringify(overrides)]
  );

  if (loading) return <div className="h-80 flex items-center justify-center text-slate-400">Loading...</div>;
  if (error) return <div className="h-80 flex items-center justify-center text-red-500">{error}</div>;
  if (!data?.length) return <div className="h-80 flex items-center justify-center text-slate-400">No data</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            <th className="py-2 px-3 font-medium">Neighborhood</th>
            <th className="py-2 px-3 font-medium text-right">Nodes</th>
            <th className="py-2 px-3 font-medium text-right">Edges</th>
            <th className="py-2 px-3 font-medium text-right">Street Density</th>
            <th className="py-2 px-3 font-medium text-right">Avg Degree</th>
            <th className="py-2 px-3 font-medium text-right">Circuity</th>
            <th className="py-2 px-3 font-medium text-right">Connectivity</th>
            <th className="py-2 px-3 font-medium text-right">Avg Betweenness</th>
            <th className="py-2 px-3 font-medium text-right">Exits</th>
            <th className="py-2 px-3 font-medium text-right">Area (km²)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((neighborhood) => (
            <tr key={neighborhood.neighborhood_key} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="py-2 px-3 font-medium">
                <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: getNeighborhoodColor(neighborhood.neighborhood_key) }} />
                {neighborhood.neighborhood_display}
              </td>
              <td className="py-2 px-3 text-right">{neighborhood.basic_stats.node_count}</td>
              <td className="py-2 px-3 text-right">{neighborhood.basic_stats.edge_count}</td>
              <td className="py-2 px-3 text-right">{neighborhood.basic_stats.street_density_m_per_km2.toLocaleString()}</td>
              <td className="py-2 px-3 text-right">{neighborhood.basic_stats.avg_node_degree}</td>
              <td className="py-2 px-3 text-right">{neighborhood.basic_stats.circuity?.toFixed(3) ?? 'N/A'}</td>
              <td className="py-2 px-3 text-right">{neighborhood.connectivity.avg_node_connectivity.toFixed(3)}</td>
              <td className="py-2 px-3 text-right">{neighborhood.centrality_summary.avg_betweenness.toFixed(4)}</td>
              <td className="py-2 px-3 text-right">{neighborhood.exit_count}</td>
              <td className="py-2 px-3 text-right">{neighborhood.area_km2.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
