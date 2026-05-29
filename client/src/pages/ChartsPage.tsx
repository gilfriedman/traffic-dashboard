import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Table } from 'lucide-react';
import { FilterBar } from '../components/filters/FilterBar';
import { CongestionOverTimeChart } from '../components/charts/CongestionOverTimeChart';
import { DayOfWeekChart } from '../components/charts/DayOfWeekChart';
import { RushHourChart } from '../components/charts/RushHourChart';
import { RouteRankingChart } from '../components/charts/RouteRankingChart';
import { DistributionChart } from '../components/charts/DistributionChart';
import { ChartDescription } from '../components/ChartDescription';
import { useGlobalFilterOverrides } from '../hooks/useGlobalFilterOverrides';
import { useUrlState } from '../hooks/useUrlState';
import { useUrlFilters } from '../hooks/useUrlFilters';
import { cn } from '../lib/utils';
import type { Filters } from '../lib/types';

const TAB_KEYS = ['time-series', 'day-of-week', 'rush-hour', 'rush-hour-max', 'rush-hour-min', 'route-ranking', 'distribution'] as const;
type TabKey = (typeof TAB_KEYS)[number];

const TAB_I18N_KEYS: Record<TabKey, string> = {
  'time-series': 'charts.timeSeries',
  'day-of-week': 'charts.dayOfWeek',
  'rush-hour': 'charts.rushHour',
  'rush-hour-max': 'charts.rushHourMax',
  'rush-hour-min': 'charts.rushHourMin',
  'route-ranking': 'charts.routeRanking',
  'distribution': 'charts.distribution',
};

const TAB_DESCRIPTION_KEYS: Record<TabKey, string> = {
  'time-series': 'chartDescriptions.timeSeries',
  'day-of-week': 'chartDescriptions.dayOfWeek',
  'rush-hour': 'chartDescriptions.rushHourCharts',
  'rush-hour-max': 'chartDescriptions.rushHourCharts',
  'rush-hour-min': 'chartDescriptions.rushHourCharts',
  'route-ranking': 'chartDescriptions.routeRanking',
  'distribution': 'chartDescriptions.distribution',
};

const GRANULARITY_OPTIONS = ['15min', 'hour', 'day', 'week'] as const;

export function ChartsPage() {
  const globalOverrides = useGlobalFilterOverrides();
  const [filters, setFilters] = useUrlFilters();
  const { t } = useTranslation();

  const effectiveFilters = useMemo<Filters>(
    () => ({ ...filters, ...globalOverrides }),
    [filters, globalOverrides]
  );
  const [activeTab, setActiveTab] = useUrlState<TabKey>('tab', 'time-series', TAB_KEYS);
  const [granularity, setGranularity] = useUrlState('granularity', 'day', GRANULARITY_OPTIONS);
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{t('charts.title')}</h1>
        <button
          onClick={() => navigate('/data')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
        >
          <Table className="h-4 w-4" />
          {t('nav.data')}
        </button>
      </div>

      <FilterBar filters={filters} onChange={setFilters} />

      <div className="bg-white rounded-lg border border-slate-200">
        <div className="flex gap-1 p-2 border-b border-slate-200 overflow-x-auto">
          {TAB_KEYS.map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setActiveTab(tabKey)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
                activeTab === tabKey
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              {t(TAB_I18N_KEYS[tabKey])}
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
                    {t(`charts.granularity.${option}`)}
                  </button>
                ))}
              </div>
              <CongestionOverTimeChart filters={effectiveFilters} granularity={granularity} />
            </div>
          )}
          {activeTab === 'day-of-week' && <DayOfWeekChart filters={effectiveFilters} />}
          {activeTab === 'rush-hour' && <RushHourChart filters={effectiveFilters} metric="avg" />}
          {activeTab === 'rush-hour-max' && <RushHourChart filters={effectiveFilters} metric="max" />}
          {activeTab === 'rush-hour-min' && <RushHourChart filters={effectiveFilters} metric="min" />}
          {activeTab === 'route-ranking' && <RouteRankingChart filters={effectiveFilters} />}
          {activeTab === 'distribution' && <DistributionChart filters={effectiveFilters} />}

          <ChartDescription text={t(TAB_DESCRIPTION_KEYS[activeTab])} />
        </div>
      </div>
    </div>
  );
}
