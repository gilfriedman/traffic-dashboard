import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useChartData } from '../../hooks/useChartData';
import { getNeighborhoodDemographics, type GlobalOverrides } from '../../lib/api';
import { getNeighborhoodColor } from '../../lib/utils';
import type { NeighborhoodDemographics } from '../../lib/types';

interface Props {
  overrides: GlobalOverrides;
}

interface MetricRow {
  labelKey: string;
  getValue: (neighborhood: NeighborhoodDemographics) => number | string | null;
  format?: (value: number) => string;
}

interface MetricCategory {
  headerKey: string;
  metrics: MetricRow[];
}

const PERCENTAGE_FORMAT = (value: number) => `${value}%`;
const DECIMAL_FORMAT = (value: number) => value.toFixed(1);
const INTEGER_FORMAT = (value: number) => value.toLocaleString();
const CURRENCY_FORMAT = (value: number) => `₪${value.toLocaleString()}`;

const METRIC_CATEGORIES: MetricCategory[] = [
  {
    headerKey: 'demographicsTable.categories.demographics',
    metrics: [
      { labelKey: 'demographicsTable.population', getValue: (neighborhood) => neighborhood.demographics.population, format: INTEGER_FORMAT },
      { labelKey: 'demographicsTable.area', getValue: (neighborhood) => neighborhood.demographics.area_km2, format: DECIMAL_FORMAT },
      { labelKey: 'demographicsTable.populationDensity', getValue: (neighborhood) => neighborhood.demographics.population_density_per_km2, format: INTEGER_FORMAT },
      { labelKey: 'demographicsTable.pctAdults', getValue: (neighborhood) => neighborhood.demographics.pct_adults_18_plus, format: PERCENTAGE_FORMAT },
      { labelKey: 'demographicsTable.avgHouseholdSize', getValue: (neighborhood) => neighborhood.demographics.avg_household_size, format: DECIMAL_FORMAT },
    ],
  },
  {
    headerKey: 'demographicsTable.categories.socioeconomic',
    metrics: [
      { labelKey: 'demographicsTable.socioeconomicCluster', getValue: (neighborhood) => neighborhood.socioeconomic.socioeconomic_cluster },
      { labelKey: 'demographicsTable.avgIncome', getValue: (neighborhood) => neighborhood.socioeconomic.avg_income_per_capita, format: CURRENCY_FORMAT },
      { labelKey: 'demographicsTable.pctAcademic', getValue: (neighborhood) => neighborhood.socioeconomic.pct_academic_degree, format: PERCENTAGE_FORMAT },
    ],
  },
  {
    headerKey: 'demographicsTable.categories.transportation',
    metrics: [
      { labelKey: 'demographicsTable.carsPer100Residents', getValue: (neighborhood) => neighborhood.transportation.cars_per_100_residents, format: DECIMAL_FORMAT },
      { labelKey: 'demographicsTable.pctNoCars', getValue: (neighborhood) => neighborhood.transportation.pct_households_0_cars, format: PERCENTAGE_FORMAT },
      { labelKey: 'demographicsTable.pct2PlusCars', getValue: (neighborhood) => neighborhood.transportation.pct_households_2_plus_cars, format: PERCENTAGE_FORMAT },
    ],
  },
  {
    headerKey: 'demographicsTable.categories.publicTransit',
    metrics: [
      { labelKey: 'demographicsTable.busStops', getValue: (neighborhood) => neighborhood.public_transit.bus_stops_per_km2, format: DECIMAL_FORMAT },
      { labelKey: 'demographicsTable.busLines', getValue: (neighborhood) => neighborhood.public_transit.bus_lines_count },
      { labelKey: 'demographicsTable.pctPublicTransit', getValue: (neighborhood) => neighborhood.public_transit.pct_using_public_transit, format: PERCENTAGE_FORMAT },
    ],
  },
  {
    headerKey: 'demographicsTable.categories.employment',
    metrics: [
      { labelKey: 'demographicsTable.employmentRate', getValue: (neighborhood) => neighborhood.employment.employment_rate, format: PERCENTAGE_FORMAT },
      { labelKey: 'demographicsTable.pctWorkingOutside', getValue: (neighborhood) => neighborhood.employment.pct_working_outside_neighborhood, format: PERCENTAGE_FORMAT },
    ],
  },
  {
    headerKey: 'demographicsTable.categories.urbanPlanning',
    metrics: [
      { labelKey: 'demographicsTable.housingDensity', getValue: (neighborhood) => neighborhood.urban_planning.housing_density_per_km2, format: INTEGER_FORMAT },
      { labelKey: 'demographicsTable.pctApartments', getValue: (neighborhood) => neighborhood.urban_planning.pct_apartments, format: PERCENTAGE_FORMAT },
      { labelKey: 'demographicsTable.avgFloors', getValue: (neighborhood) => neighborhood.urban_planning.avg_building_floors, format: DECIMAL_FORMAT },
    ],
  },
  {
    headerKey: 'demographicsTable.categories.historical',
    metrics: [
      { labelKey: 'demographicsTable.yearEstablished', getValue: (neighborhood) => neighborhood.historical.year_established },
      { labelKey: 'demographicsTable.yearPopulated', getValue: (neighborhood) => neighborhood.historical.year_populated },
    ],
  },
];

function formatValue(value: number | string | null, format?: (value: number) => string): string {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'string') return value;
  if (format) return format(value);
  return String(value);
}

function hasAnyNA(metric: MetricRow, neighborhoods: NeighborhoodDemographics[]): boolean {
  return neighborhoods.some((neighborhood) => {
    const value = metric.getValue(neighborhood);
    return value === null || value === undefined;
  });
}

function isCategoryFullyHidden(category: MetricCategory, neighborhoods: NeighborhoodDemographics[]): boolean {
  return category.metrics.every((metric) => hasAnyNA(metric, neighborhoods));
}

export function DemographicsTable({ overrides }: Props) {
  const { data, loading, error } = useChartData(
    () => getNeighborhoodDemographics(overrides),
    [JSON.stringify(overrides)]
  );
  const { t } = useTranslation();
  const [showIncomplete, setShowIncomplete] = useState(false);

  if (loading) return <div className="h-80 flex items-center justify-center text-slate-400">{t('common.loading')}</div>;
  if (error) return <div className="h-80 flex items-center justify-center text-red-500">{error}</div>;
  if (!data?.length) return <div className="h-80 flex items-center justify-center text-slate-400">{t('common.noData')}</div>;

  return (
    <div>
      <div className="flex justify-end mb-2">
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showIncomplete}
            onChange={(event) => setShowIncomplete(event.target.checked)}
            className="accent-blue-600"
          />
          {t('demographicsTable.showIncomplete')}
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-start text-slate-500">
              <th className="py-2 px-3 font-medium text-start">{t('demographicsTable.metric')}</th>
              {data.map((neighborhood) => (
                <th key={neighborhood.neighborhood_key} className="py-2 px-3 font-medium text-end">
                  <span
                    className="inline-block w-2 h-2 rounded-full me-2"
                    style={{ backgroundColor: getNeighborhoodColor(neighborhood.neighborhood_key) }}
                  />
                  {t(`neighborhoods.${neighborhood.neighborhood_key}`, { defaultValue: neighborhood.neighborhood_display })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRIC_CATEGORIES.map((category) => {
              if (!showIncomplete && isCategoryFullyHidden(category, data)) return null;

              return (
                <Fragment key={category.headerKey}>
                  <tr className="bg-slate-50">
                    <td
                      colSpan={data.length + 1}
                      className="py-2 px-3 font-semibold text-slate-700 text-start"
                    >
                      {t(category.headerKey)}
                    </td>
                  </tr>
                  {category.metrics.map((metric) => {
                    if (!showIncomplete && hasAnyNA(metric, data)) return null;

                    return (
                      <tr key={metric.labelKey} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-600 text-start">{t(metric.labelKey)}</td>
                        {data.map((neighborhood) => {
                          const value = metric.getValue(neighborhood);
                          const isNA = value === null || value === undefined;
                          return (
                            <td
                              key={neighborhood.neighborhood_key}
                              className={`py-2 px-3 text-end ${isNA ? 'text-slate-300' : ''}`}
                            >
                              {formatValue(value, metric.format)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
