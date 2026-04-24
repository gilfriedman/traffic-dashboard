import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NetworkMetricsTable } from '../components/charts/NetworkMetricsTable';
import { CongestionStructureScatter } from '../components/charts/CongestionStructureScatter';
import { CongestionDemographicsScatter } from '../components/charts/CongestionDemographicsScatter';
import { ExitCongestionChart } from '../components/charts/ExitCongestionChart';
import { BottleneckTable } from '../components/charts/BottleneckTable';
import { NetworkGraphTab } from '../components/charts/NetworkGraphTab';
import { DemographicsTable } from '../components/charts/DemographicsTable';
import { ChartDescription } from '../components/ChartDescription';
import { useGlobalFilterOverrides } from '../hooks/useGlobalFilterOverrides';
import { cn } from '../lib/utils';
import type { GlobalOverrides, NetworkRepresentation } from '../lib/api';

const TAB_KEYS = ['overview', 'graph', 'congestion-structure', 'congestion-demographics', 'exit-analysis', 'bottlenecks', 'demographics'] as const;
type TabKey = (typeof TAB_KEYS)[number];

const TAB_I18N_KEYS: Record<TabKey, string> = {
  'demographics': 'network.demographics',
  'overview': 'network.overview',
  'congestion-structure': 'network.congestionStructure',
  'congestion-demographics': 'network.congestionDemographics',
  'exit-analysis': 'network.exitAnalysis',
  'bottlenecks': 'network.bottlenecks',
  'graph': 'network.graph',
};

const TAB_DESCRIPTION_KEYS: Record<TabKey, string> = {
  'demographics': 'chartDescriptions.demographics',
  'overview': 'chartDescriptions.networkOverview',
  'congestion-structure': 'chartDescriptions.congestionStructure',
  'congestion-demographics': 'chartDescriptions.congestionDemographics',
  'exit-analysis': 'chartDescriptions.exitAnalysis',
  'bottlenecks': 'chartDescriptions.bottlenecks',
  'graph': 'chartDescriptions.networkGraph',
};

const REPRESENTATIONS: NetworkRepresentation[] = ['topologic', 'geometric'];

export function NetworkPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [representation, setRepresentation] = useState<NetworkRepresentation>('topologic');
  const globalOverrides = useGlobalFilterOverrides();
  const { t } = useTranslation();

  const overrides: GlobalOverrides = {
    exclude_neighborhoods: globalOverrides.exclude_neighborhoods,
    exclude_hours: globalOverrides.exclude_hours,
    representation,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{t('network.title')}</h1>
        <div className="flex gap-1 bg-slate-100 rounded-md p-1">
          {REPRESENTATIONS.map((key) => (
            <button
              key={key}
              onClick={() => setRepresentation(key)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded transition-colors',
                representation === key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {t(`network.representation.${key}`)}
            </button>
          ))}
        </div>
      </div>

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
          {activeTab === 'demographics' && <DemographicsTable overrides={overrides} />}
          {activeTab === 'overview' && <NetworkMetricsTable overrides={overrides} />}
          {activeTab === 'congestion-structure' && <CongestionStructureScatter overrides={overrides} />}
          {activeTab === 'congestion-demographics' && <CongestionDemographicsScatter overrides={overrides} />}
          {activeTab === 'exit-analysis' && <ExitCongestionChart overrides={overrides} />}
          {activeTab === 'bottlenecks' && <BottleneckTable overrides={overrides} />}
          {activeTab === 'graph' && <NetworkGraphTab overrides={overrides} />}

          <ChartDescription text={t(TAB_DESCRIPTION_KEYS[activeTab])} />
        </div>
      </div>
    </div>
  );
}
