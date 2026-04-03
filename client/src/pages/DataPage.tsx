import { useState, useEffect, useCallback, useMemo } from 'react';
import { FilterBar } from '../components/filters/FilterBar';
import { getTrafficData, getExportUrl } from '../lib/api';
import { formatCongestion } from '../lib/utils';
import { useExcludedNeighborhoods } from '../hooks/useExcludedNeighborhoods';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Filters, TrafficRecord } from '../lib/types';

const DEFAULT_FILTERS: Filters = {
  neighborhoods: [],
  route_ids: [],
  start_date: '',
  end_date: '',
  rush_hour_only: false,
  day_of_week: [],
  exclude_neighborhoods: [],
};

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const COLUMNS = [
  { key: 'local_time', label: 'Time' },
  { key: 'route_id', label: 'Route ID' },
  { key: 'route_name', label: 'Route Name' },
  { key: 'day_of_week', label: 'Day' },
  { key: 'is_rush_hour', label: 'Rush Hour' },
  { key: 'duration_seconds', label: 'Duration (s)' },
  { key: 'traffic_seconds', label: 'Traffic (s)' },
  { key: 'congestion_ratio', label: 'Congestion' },
] as const;

export function DataPage() {
  const excludeNeighborhoods = useExcludedNeighborhoods();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const effectiveFilters = useMemo<Filters>(
    () => ({ ...filters, exclude_neighborhoods: excludeNeighborhoods }),
    [filters, excludeNeighborhoods]
  );
  const [data, setData] = useState<TrafficRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState('local_time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    setLoading(true);
    getTrafficData(effectiveFilters, pageSize, offset, sortBy, sortOrder)
      .then((response) => {
        setData(response.data);
        setTotal(response.total);
      })
      .finally(() => setLoading(false));
  }, [effectiveFilters, pageSize, offset, sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setOffset(0);
  }, [filters, pageSize]);

  function handleSort(column: string) {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  }

  function getCellValue(record: TrafficRecord, column: string): string {
    switch (column) {
      case 'duration_seconds': return String(record.duration?.seconds ?? '');
      case 'traffic_seconds': return String(record.duration_in_traffic?.seconds ?? '');
      case 'congestion_ratio': return formatCongestion(record.congestion_ratio);
      case 'is_rush_hour': return record.is_rush_hour ? 'Yes' : 'No';
      default: return String((record as unknown as Record<string, unknown>)[column] ?? '');
    }
  }

  const totalPages = Math.ceil(total / pageSize);
  const currentPage = Math.floor(offset / pageSize) + 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Raw Data</h1>
        <div className="flex gap-2">
          <a
            href={getExportUrl(effectiveFilters, 'csv')}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            CSV
          </a>
          <a
            href={getExportUrl(effectiveFilters, 'json')}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            JSON
          </a>
        </div>
      </div>

      <FilterBar filters={filters} onChange={setFilters} />

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {COLUMNS.map((column) => (
                  <th
                    key={column.key}
                    onClick={() => handleSort(column.key)}
                    className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700"
                  >
                    {column.label}
                    {sortBy === column.key && (
                      <span className="ml-1">{sortOrder === 'asc' ? '\u2191' : '\u2193'}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-8 text-center text-slate-400">
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && data.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-8 text-center text-slate-400">
                    No data found
                  </td>
                </tr>
              )}
              {!loading &&
                data.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-50">
                    {COLUMNS.map((column) => (
                      <td key={column.key} className="px-4 py-2.5 text-slate-700 whitespace-nowrap">
                        {getCellValue(record, column.key)}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span>{total.toLocaleString()} records</span>
            <select
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              className="border border-slate-300 rounded px-2 py-1 text-sm"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>{size} per page</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - pageSize))}
              disabled={offset === 0}
              className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm text-slate-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setOffset(offset + pageSize)}
              disabled={offset + pageSize >= total}
              className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
