import { useState } from 'react';
import { NetworkMetricsTable } from '../components/charts/NetworkMetricsTable';
import { CongestionStructureScatter } from '../components/charts/CongestionStructureScatter';
import { ExitCongestionChart } from '../components/charts/ExitCongestionChart';
import { BottleneckTable } from '../components/charts/BottleneckTable';
import { useGlobalFilterOverrides } from '../hooks/useGlobalFilterOverrides';
import { cn } from '../lib/utils';
import type { GlobalOverrides } from '../lib/api';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'congestion-structure', label: 'Congestion vs Structure' },
  { key: 'exit-analysis', label: 'Exit Analysis' },
  { key: 'bottlenecks', label: 'Bottlenecks' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export function NetworkPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const globalOverrides = useGlobalFilterOverrides();

  const overrides: GlobalOverrides = {
    exclude_neighborhoods: globalOverrides.exclude_neighborhoods,
    exclude_hours: globalOverrides.exclude_hours,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Network Analysis</h1>

      <div className="bg-white rounded-lg border border-slate-200">
        <div className="flex gap-1 p-2 border-b border-slate-200 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
                activeTab === tab.key
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {activeTab === 'overview' && (
            <div>
              <p className="text-sm text-slate-500 mb-4">
                Road network metrics for each neighborhood, computed from OpenStreetMap data via OSMnx.
              </p>
              <NetworkMetricsTable overrides={overrides} />
            </div>
          )}
          {activeTab === 'congestion-structure' && (
            <div>
              <p className="text-sm text-slate-500 mb-4">
                How does road network structure relate to traffic congestion? Each dot is a neighborhood.
              </p>
              <CongestionStructureScatter overrides={overrides} />
            </div>
          )}
          {activeTab === 'exit-analysis' && (
            <div>
              <p className="text-sm text-slate-500 mb-4">
                Neighborhood exits matched to nearby traffic routes, ranked by average congestion.
              </p>
              <ExitCongestionChart overrides={overrides} />
            </div>
          )}
          {activeTab === 'bottlenecks' && (
            <div>
              <p className="text-sm text-slate-500 mb-4">
                High-centrality intersections near congested routes. Score = betweenness × nearby congestion.
              </p>
              <BottleneckTable overrides={overrides} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
