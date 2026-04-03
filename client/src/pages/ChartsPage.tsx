import { useState } from 'react';
import { FilterBar } from '../components/filters/FilterBar';
import { CongestionOverTimeChart } from '../components/charts/CongestionOverTimeChart';
import { DayOfWeekChart } from '../components/charts/DayOfWeekChart';
import { RushHourChart } from '../components/charts/RushHourChart';
import { RouteRankingChart } from '../components/charts/RouteRankingChart';
import { DistributionChart } from '../components/charts/DistributionChart';
import { cn } from '../lib/utils';
import type { Filters } from '../lib/types';

const DEFAULT_FILTERS: Filters = {
  neighborhoods: [],
  route_ids: [],
  start_date: '',
  end_date: '',
  rush_hour_only: false,
  day_of_week: [],
};

const TABS = [
  { key: 'time-series', label: 'Time Series' },
  { key: 'day-of-week', label: 'Day of Week' },
  { key: 'rush-hour', label: 'Rush Hour' },
  { key: 'route-ranking', label: 'Route Ranking' },
  { key: 'distribution', label: 'Distribution' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const GRANULARITY_OPTIONS = ['15min', 'hour', 'day', 'week'] as const;

export function ChartsPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [activeTab, setActiveTab] = useState<TabKey>('time-series');
  const [granularity, setGranularity] = useState('day');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Charts</h1>

      <FilterBar filters={filters} onChange={setFilters} />

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
          {activeTab === 'time-series' && (
            <div>
              <div className="flex gap-2 mb-4">
                {GRANULARITY_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => setGranularity(option)}
                    className={cn(
                      'px-3 py-1 text-xs font-medium rounded-full transition-colors',
                      granularity === option
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <CongestionOverTimeChart filters={filters} granularity={granularity} />
            </div>
          )}
          {activeTab === 'day-of-week' && <DayOfWeekChart filters={filters} />}
          {activeTab === 'rush-hour' && <RushHourChart filters={filters} />}
          {activeTab === 'route-ranking' && <RouteRankingChart filters={filters} />}
          {activeTab === 'distribution' && <DistributionChart filters={filters} />}
        </div>
      </div>
    </div>
  );
}
