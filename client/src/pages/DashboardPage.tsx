import { useState } from 'react';
import { StatsCards } from '../components/dashboard/StatsCards';
import { NeighborhoodComparisonChart } from '../components/charts/NeighborhoodComparisonChart';
import { CongestionOverTimeChart } from '../components/charts/CongestionOverTimeChart';
import { RushHourChart } from '../components/charts/RushHourChart';
import type { Filters } from '../lib/types';

const DEFAULT_FILTERS: Filters = {
  neighborhoods: [],
  route_ids: [],
  start_date: '',
  end_date: '',
  rush_hour_only: false,
  day_of_week: [],
};

export function DashboardPage() {
  const [filters] = useState<Filters>(DEFAULT_FILTERS);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>

      <StatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Neighborhood Comparison</h2>
          <NeighborhoodComparisonChart filters={filters} />
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Rush Hour Profile (6:00-9:00)</h2>
          <RushHourChart filters={filters} />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Congestion Over Time (Daily)</h2>
        <CongestionOverTimeChart filters={filters} granularity="day" />
      </div>
    </div>
  );
}
