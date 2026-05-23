import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { NetworkGraph } from './NetworkGraph';
import { useChartData } from '../../hooks/useChartData';
import { getNetworkGraph } from '../../lib/api';
import type { GlobalOverrides } from '../../lib/api';
import type { NetworkGraphData } from '../../lib/types';

const NEIGHBORHOOD_KEYS = ['old_city', 'shchuna_bet', 'shchuna_he', 'ramot_bet', 'neve_zeev', 'rambam'];

function NetworkGraphCard({
  neighborhoodKey,
  representation,
  onSelect,
}: {
  neighborhoodKey: string;
  representation: 'geometric' | 'topologic';
  onSelect: (data: NetworkGraphData) => void;
}) {
  const { t, i18n } = useTranslation();
  const { data, loading, error } = useChartData(
    () => getNetworkGraph(neighborhoodKey, representation),
    [neighborhoodKey, representation]
  );

  if (loading) {
    return (
      <div className="bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center aspect-square">
        <span className="text-slate-400 text-sm">{t('common.loading')}</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center aspect-square">
        <span className="text-red-400 text-sm">{error ?? t('common.noData')}</span>
      </div>
    );
  }

  return (
    <button
      onClick={() => onSelect(data)}
      className="bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer overflow-hidden"
    >
      <NetworkGraph data={data} width={400} height={400} compact />
      <div className="px-3 py-2 border-t border-slate-100 text-center">
        <span className="text-sm font-medium text-slate-700">
          {i18n.language === 'he' ? data.name_he : data.name_en} — {data.exit_count} {t('network.exits')}
        </span>
      </div>
    </button>
  );
}

export function NetworkGraphTab({ overrides }: { overrides: GlobalOverrides }) {
  const [selectedGraph, setSelectedGraph] = useState<NetworkGraphData | null>(null);
  const [showAerial, setShowAerial] = useState(false);
  const [showStreetNames, setShowStreetNames] = useState(false);
  const [colorByPreference, setColorByPreference] = useState<'default' | 'integration'>('default');
  const { t } = useTranslation();
  const representation = overrides.representation ?? 'topologic';
  const colorBy = representation === 'geometric' ? 'default' : colorByPreference;

  const visibleKeys = useMemo(() => {
    const excluded = overrides.exclude_neighborhoods ?? [];
    return NEIGHBORHOOD_KEYS.filter((key) => !excluded.some((ex) => key.startsWith(ex)));
  }, [overrides.exclude_neighborhoods]);

  useEffect(() => {
    setSelectedGraph(null);
  }, [representation]);

  useEffect(() => {
    if (selectedGraph && !visibleKeys.includes(selectedGraph.neighborhood_key)) {
      setSelectedGraph(null);
    }
  }, [selectedGraph, visibleKeys]);

  useEffect(() => {
    if (!selectedGraph) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedGraph(null);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedGraph]);

  if (selectedGraph) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setSelectedGraph(null)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft size={16} />
            {t('network.backToGrid')}
          </button>
          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-2 text-sm text-slate-600"
              title={representation === 'geometric' ? t('network.graphColorBy.tooltipGeometric') : undefined}
            >
              <span>{t('network.graphColorBy.label')}:</span>
              <div className="flex gap-1 bg-slate-100 rounded-md p-0.5">
                {(['default', 'integration'] as const).map((option) => {
                  const isDisabled = option === 'integration' && representation === 'geometric';
                  return (
                    <button
                      key={option}
                      onClick={() => setColorByPreference(option)}
                      disabled={isDisabled}
                      className={`px-2 py-0.5 text-xs rounded transition-colors ${
                        colorBy === option ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      {t(`network.graphColorBy.${option}`)}
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showAerial}
                onChange={(event) => setShowAerial(event.target.checked)}
                className="rounded border-slate-300"
              />
              {t('network.aerialView')}
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showStreetNames}
                onChange={(event) => setShowStreetNames(event.target.checked)}
                className="rounded border-slate-300"
              />
              {t('network.streetNames')}
            </label>
          </div>
        </div>
        <div className="flex justify-center">
          <NetworkGraph data={selectedGraph} width={700} height={700} showAerial={showAerial} showStreetNames={showStreetNames} colorBy={colorBy} />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {visibleKeys.map((key) => (
        <NetworkGraphCard
          key={`${key}-${representation}`}
          neighborhoodKey={key}
          representation={representation}
          onSelect={setSelectedGraph}
        />
      ))}
    </div>
  );
}
