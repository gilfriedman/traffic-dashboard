import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FilterBar } from '../components/filters/FilterBar';
import { getTrafficData, getExportUrl } from '../lib/api';
import { formatCongestion } from '../lib/utils';
import { useGlobalFilterOverrides } from '../hooks/useGlobalFilterOverrides';
import { useUrlFilters } from '../hooks/useUrlFilters';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Filters, TrafficRecord } from '../lib/types';

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const COLUMN_I18N_KEYS: Record<string, string> = {
  local_time: 'dataPage.time',
  route_id: 'dataPage.routeId',
  route_name: 'dataPage.routeName',
  day_of_week: 'dataPage.day',
  is_rush_hour: 'dataPage.rushHour',
  duration_seconds: 'dataPage.duration',
  traffic_seconds: 'dataPage.traffic',
  congestion_ratio: 'dataPage.congestion',
};

const COLUMN_KEYS = ['local_time', 'route_id', 'route_name', 'day_of_week', 'is_rush_hour', 'duration_seconds', 'traffic_seconds', 'congestion_ratio'] as const;

export function DataPage() {
  const globalOverrides = useGlobalFilterOverrides();
  const [filters, setFilters] = useUrlFilters();
  const { t } = useTranslation();

  const effectiveFilters = useMemo<Filters>(
    () => ({ ...filters, ...globalOverrides }),
    [filters, globalOverrides]
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
      case 'is_rush_hour': return record.is_rush_hour ? t('dataPage.yes') : t('dataPage.no');
      default: return String((record as unknown as Record<string, unknown>)[column] ?? '');
    }
  }

  const totalPages = Math.ceil(total / pageSize);
  const currentPage = Math.floor(offset / pageSize) + 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{t('dataPage.title')}</h1>
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
                {COLUMN_KEYS.map((columnKey) => (
                  <th
                    key={columnKey}
                    onClick={() => handleSort(columnKey)}
                    className="px-4 py-3 text-start text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700"
                  >
                    {t(COLUMN_I18N_KEYS[columnKey])}
                    {sortBy === columnKey && (
                      <span className="ms-1">{sortOrder === 'asc' ? '\u2191' : '\u2193'}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={COLUMN_KEYS.length} className="px-4 py-8 text-center text-slate-400">
                    {t('dataPage.loading')}
                  </td>
                </tr>
              )}
              {!loading && data.length === 0 && (
                <tr>
                  <td colSpan={COLUMN_KEYS.length} className="px-4 py-8 text-center text-slate-400">
                    {t('dataPage.noData')}
                  </td>
                </tr>
              )}
              {!loading &&
                data.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-50">
                    {COLUMN_KEYS.map((columnKey) => (
                      <td key={columnKey} className="px-4 py-2.5 text-slate-700 whitespace-nowrap">
                        {getCellValue(record, columnKey)}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span>{total.toLocaleString()} {t('dataPage.records')}</span>
            <select
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              className="border border-slate-300 rounded px-2 py-1 text-sm"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>{size} {t('dataPage.perPage')}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - pageSize))}
              disabled={offset === 0}
              className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
            </button>
            <span className="text-sm text-slate-600">
              {t('dataPage.page')} {currentPage} {t('dataPage.of')} {totalPages}
            </span>
            <button
              onClick={() => setOffset(offset + pageSize)}
              disabled={offset + pageSize >= total}
              className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
