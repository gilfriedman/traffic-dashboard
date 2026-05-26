import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { NetworkGraph } from './NetworkGraph';
import { ChartCopyWrapper } from './ChartCopyWrapper';
import { useChartData } from '../../hooks/useChartData';
import { useUrlBoolean, useUrlNullableState, useUrlState } from '../../hooks/useUrlState';
import { getNetworkGraph } from '../../lib/api';
import type { GlobalOverrides, NetworkRepresentation } from '../../lib/api';
import type { NetworkGraphData } from '../../lib/types';

const NEIGHBORHOOD_KEYS = ['old_city', 'shchuna_bet', 'shchuna_he', 'ramot_bet', 'neve_zeev', 'rambam'] as const;
type NeighborhoodKey = (typeof NEIGHBORHOOD_KEYS)[number];

const COLOR_BY_OPTIONS = ['default', 'integration'] as const;
type ColorByOption = (typeof COLOR_BY_OPTIONS)[number];

function buildNetworkFileName(options: {
  neighborhoodKey: NeighborhoodKey;
  representation: NetworkRepresentation;
  colorBy: ColorByOption;
  showAerial: boolean;
  showStreetNames: boolean;
}): string {
  const parts = [
    'network',
    options.neighborhoodKey,
    options.representation,
    `color-${options.colorBy}`,
  ];
  if (options.showAerial) parts.push('aerial');
  if (options.showStreetNames) parts.push('streets');
  return parts.join('-');
}

function NetworkGraphCard({
  neighborhoodKey,
  representation,
  onSelect,
}: {
  neighborhoodKey: NeighborhoodKey;
  representation: NetworkRepresentation;
  onSelect: (key: NeighborhoodKey) => void;
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
      onClick={() => onSelect(neighborhoodKey)}
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

function NetworkGraphDetail({
  neighborhoodKey,
  representation,
  colorByPreference,
  setColorByPreference,
  showAerial,
  setShowAerial,
  showStreetNames,
  setShowStreetNames,
  onBack,
}: {
  neighborhoodKey: NeighborhoodKey;
  representation: NetworkRepresentation;
  colorByPreference: ColorByOption;
  setColorByPreference: (next: ColorByOption) => void;
  showAerial: boolean;
  setShowAerial: (next: boolean) => void;
  showStreetNames: boolean;
  setShowStreetNames: (next: boolean) => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const { data, loading, error } = useChartData<NetworkGraphData>(
    () => getNetworkGraph(neighborhoodKey, representation),
    [neighborhoodKey, representation]
  );
  const colorBy = representation === 'geometric' ? 'default' : colorByPreference;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
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
              {COLOR_BY_OPTIONS.map((option) => {
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
        {loading && <span className="text-slate-400 text-sm py-12">{t('common.loading')}</span>}
        {!loading && (error || !data) && (
          <span className="text-red-400 text-sm py-12">{error ?? t('common.noData')}</span>
        )}
        {!loading && data && (
          <ChartCopyWrapper
            fileName={buildNetworkFileName({
              neighborhoodKey,
              representation,
              colorBy,
              showAerial,
              showStreetNames,
            })}
            className="w-full max-w-[700px]"
          >
            <NetworkGraph
              data={data}
              width={700}
              height={700}
              showAerial={showAerial}
              showStreetNames={showStreetNames}
              colorBy={colorBy}
            />
          </ChartCopyWrapper>
        )}
      </div>
    </div>
  );
}

export function NetworkGraphTab({ overrides }: { overrides: GlobalOverrides }) {
  const [selectedNeighborhood, setSelectedNeighborhood] = useUrlNullableState<NeighborhoodKey>(
    'neighborhood',
    NEIGHBORHOOD_KEYS
  );
  const [showAerial, setShowAerial] = useUrlBoolean('aerial');
  const [showStreetNames, setShowStreetNames] = useUrlBoolean('streets');
  const [colorByPreference, setColorByPreference] = useUrlState<ColorByOption>(
    'colorBy',
    'default',
    COLOR_BY_OPTIONS
  );
  const representation = overrides.representation ?? 'topologic';

  const visibleKeys = useMemo<NeighborhoodKey[]>(() => {
    const excluded = overrides.exclude_neighborhoods ?? [];
    return NEIGHBORHOOD_KEYS.filter((key) => !excluded.some((ex) => key.startsWith(ex)));
  }, [overrides.exclude_neighborhoods]);

  useEffect(() => {
    if (selectedNeighborhood && !visibleKeys.includes(selectedNeighborhood)) {
      setSelectedNeighborhood(null);
    }
  }, [selectedNeighborhood, visibleKeys, setSelectedNeighborhood]);

  useEffect(() => {
    if (!selectedNeighborhood) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedNeighborhood(null);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedNeighborhood, setSelectedNeighborhood]);

  if (selectedNeighborhood) {
    return (
      <NetworkGraphDetail
        neighborhoodKey={selectedNeighborhood}
        representation={representation}
        colorByPreference={colorByPreference}
        setColorByPreference={setColorByPreference}
        showAerial={showAerial}
        setShowAerial={setShowAerial}
        showStreetNames={showStreetNames}
        setShowStreetNames={setShowStreetNames}
        onBack={() => setSelectedNeighborhood(null)}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {visibleKeys.map((key) => (
        <NetworkGraphCard
          key={`${key}-${representation}`}
          neighborhoodKey={key}
          representation={representation}
          onSelect={setSelectedNeighborhood}
        />
      ))}
    </div>
  );
}
