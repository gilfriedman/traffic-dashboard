import { useState } from 'react';
import { useChartData } from '../../hooks/useChartData';
import { getBottlenecks, type GlobalOverrides } from '../../lib/api';
import { cn } from '../../lib/utils';

const NEIGHBORHOODS = [
  { key: 'old_city', label: 'Old City' },
  { key: 'shchuna_bet', label: "Sh'chuna Bet" },
  { key: 'shchuna_he', label: "Sh'chuna He" },
  { key: 'ramot_bet', label: 'Ramot Bet' },
  { key: 'neve_zeev', label: "Neve Ze'ev" },
  { key: 'rambam', label: 'Rambam' },
];

interface Props {
  overrides: GlobalOverrides;
}

export function BottleneckTable({ overrides }: Props) {
  const [neighborhood, setNeighborhood] = useState('old_city');
  const { data, loading, error } = useChartData(
    () => getBottlenecks(neighborhood, overrides),
    [neighborhood, JSON.stringify(overrides)]
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {NEIGHBORHOODS.map((option) => (
          <button
            key={option.key}
            onClick={() => setNeighborhood(option.key)}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-full transition-colors',
              neighborhood === option.key
                ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading && <div className="h-80 flex items-center justify-center text-slate-400">Loading...</div>}
      {error && <div className="h-80 flex items-center justify-center text-red-500">{error}</div>}
      {!loading && !error && !data?.length && (
        <div className="h-80 flex items-center justify-center text-slate-400">No bottlenecks found</div>
      )}

      {data && data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 px-3 font-medium">#</th>
                <th className="py-2 px-3 font-medium text-right">Bottleneck Score</th>
                <th className="py-2 px-3 font-medium text-right">Betweenness</th>
                <th className="py-2 px-3 font-medium text-right">Closeness</th>
                <th className="py-2 px-3 font-medium text-right">Degree</th>
                <th className="py-2 px-3 font-medium text-right">Nearby Congestion</th>
                <th className="py-2 px-3 font-medium text-right">Nearby Routes</th>
                <th className="py-2 px-3 font-medium text-center">Exit Node</th>
                <th className="py-2 px-3 font-medium text-right">Coords</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 30).map((node, index) => (
                <tr key={node.osm_node_id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-3 text-slate-400">{index + 1}</td>
                  <td className="py-2 px-3 text-right font-semibold text-amber-600">
                    {node.bottleneck_score.toFixed(4)}
                  </td>
                  <td className="py-2 px-3 text-right">{node.betweenness_centrality.toFixed(4)}</td>
                  <td className="py-2 px-3 text-right">{node.closeness_centrality.toFixed(4)}</td>
                  <td className="py-2 px-3 text-right">{node.degree}</td>
                  <td className="py-2 px-3 text-right">{node.nearby_avg_congestion.toFixed(3)}x</td>
                  <td className="py-2 px-3 text-right">{node.nearby_route_count}</td>
                  <td className="py-2 px-3 text-center">{node.is_exit_node ? '✓' : ''}</td>
                  <td className="py-2 px-3 text-right text-xs text-slate-400">
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
