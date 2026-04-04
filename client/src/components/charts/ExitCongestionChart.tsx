import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useChartData } from '../../hooks/useChartData';
import { getExitCongestion, type GlobalOverrides } from '../../lib/api';
import { getNeighborhoodColor, cn } from '../../lib/utils';

const NEIGHBORHOODS = [
  { key: '', label: 'All' },
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

export function ExitCongestionChart({ overrides }: Props) {
  const [neighborhood, setNeighborhood] = useState('');
  const { data, loading, error } = useChartData(
    () => getExitCongestion(overrides, neighborhood || undefined),
    [neighborhood, JSON.stringify(overrides)]
  );

  if (loading) return <div className="h-96 flex items-center justify-center text-slate-400">Loading...</div>;
  if (error) return <div className="h-96 flex items-center justify-center text-red-500">{error}</div>;
  if (!data?.length) return <div className="h-96 flex items-center justify-center text-slate-400">No data</div>;

  const top30 = data.slice(0, 30);
  const chartHeight = Math.max(400, top30.length * 28);

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

      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={top30} layout="vertical" margin={{ left: 140, right: 20, top: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, 'auto']} />
          <YAxis
            type="category"
            dataKey="exit_street_name"
            width={140}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(value) => [Number(value).toFixed(3) + 'x', 'Avg Congestion']}
            labelFormatter={(label) => {
              const exit = top30.find((exit) => exit.exit_street_name === String(label));
              return `${label} → ${exit?.matched_route_name ?? ''} (${exit?.neighborhood_display ?? ''})`;
            }}
          />
          <Bar dataKey="avg_congestion" radius={[0, 4, 4, 0]}>
            {top30.map((entry, index) => (
              <Cell key={index} fill={getNeighborhoodColor(entry.neighborhood_key)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
