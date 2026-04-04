import { useEffect, useState } from 'react';
import { getNeighborhoods, getRoutes } from '../../lib/api';
import type { Filters, NeighborhoodInfo, RouteInfo } from '../../lib/types';
import { DAYS_OF_WEEK, isExcludedNeighborhood } from '../../lib/utils';
import { useGlobalFilters } from '../../contexts/GlobalFiltersContext';

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const { beerShevaOnly } = useGlobalFilters();
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodInfo[]>([]);
  const [routes, setRoutes] = useState<RouteInfo[]>([]);

  useEffect(() => {
    getNeighborhoods().then(setNeighborhoods);
    getRoutes().then(setRoutes);
  }, []);

  const visibleNeighborhoods = beerShevaOnly
    ? neighborhoods.filter((neighborhood) => !isExcludedNeighborhood(neighborhood.key))
    : neighborhoods;

  const visibleRoutes = beerShevaOnly
    ? routes.filter((route) => !isExcludedNeighborhood(route.neighborhood))
    : routes;

  const filteredRoutes = filters.neighborhoods.length > 0
    ? visibleRoutes.filter((route) => filters.neighborhoods.includes(route.neighborhood))
    : visibleRoutes;

  function update(partial: Partial<Filters>) {
    onChange({ ...filters, ...partial });
  }

  return (
    <div className="flex flex-wrap gap-3 items-end bg-white p-4 rounded-lg border border-slate-200">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">Neighborhoods</label>
        <select
          multiple
          value={filters.neighborhoods}
          onChange={(event) => {
            const selected = Array.from(event.target.selectedOptions, (option) => option.value);
            update({ neighborhoods: selected, route_ids: [] });
          }}
          className="border border-slate-300 rounded-md px-2 py-1.5 text-sm min-w-[140px] h-[72px]"
        >
          {visibleNeighborhoods.map((neighborhood) => (
            <option key={neighborhood.key} value={neighborhood.key}>
              {neighborhood.display_name} ({neighborhood.route_count})
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">Routes</label>
        <select
          multiple
          value={filters.route_ids}
          onChange={(event) => {
            const selected = Array.from(event.target.selectedOptions, (option) => option.value);
            update({ route_ids: selected });
          }}
          className="border border-slate-300 rounded-md px-2 py-1.5 text-sm min-w-[140px] h-[72px]"
        >
          {filteredRoutes.map((route) => (
            <option key={route.route_id} value={route.route_id}>
              {route.route_name} ({route.route_id})
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">Start Date</label>
        <input
          type="date"
          value={filters.start_date}
          onChange={(event) => update({ start_date: event.target.value })}
          className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">End Date</label>
        <input
          type="date"
          value={filters.end_date}
          onChange={(event) => update({ end_date: event.target.value })}
          className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">Day of Week</label>
        <select
          multiple
          value={filters.day_of_week}
          onChange={(event) => {
            const selected = Array.from(event.target.selectedOptions, (option) => option.value);
            update({ day_of_week: selected });
          }}
          className="border border-slate-300 rounded-md px-2 py-1.5 text-sm min-w-[120px] h-[72px]"
        >
          {DAYS_OF_WEEK.map((day) => (
            <option key={day} value={day}>{day}</option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer pb-1">
        <input
          type="checkbox"
          checked={filters.rush_hour_only}
          onChange={(event) => update({ rush_hour_only: event.target.checked })}
          className="rounded border-slate-300"
        />
        Rush hour only
      </label>

      <button
        onClick={() =>
          onChange({ neighborhoods: [], route_ids: [], start_date: '', end_date: '', rush_hour_only: false, day_of_week: [], exclude_neighborhoods: [], exclude_hours: [] })
        }
        className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
      >
        Clear
      </button>
    </div>
  );
}
