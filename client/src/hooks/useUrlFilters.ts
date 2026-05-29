import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Filters } from '../lib/types';

function parseList(value: string | null): string[] {
  return value ? value.split(',') : [];
}

function setListParam(params: URLSearchParams, key: string, values: string[]) {
  if (values.length > 0) {
    params.set(key, values.join(','));
  } else {
    params.delete(key);
  }
}

function setStringParam(params: URLSearchParams, key: string, value: string) {
  if (value) {
    params.set(key, value);
  } else {
    params.delete(key);
  }
}

function setFlagParam(params: URLSearchParams, key: string, value: boolean) {
  if (value) {
    params.set(key, '1');
  } else {
    params.delete(key);
  }
}

export function useUrlFilters(): [Filters, (next: Filters) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const neighborhoods = searchParams.get('nbhd');
  const routes = searchParams.get('routes');
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const rush = searchParams.get('rush');
  const days = searchParams.get('days');

  const filters = useMemo<Filters>(
    () => ({
      neighborhoods: parseList(neighborhoods),
      route_ids: parseList(routes),
      start_date: start ?? '',
      end_date: end ?? '',
      rush_hour_only: rush === '1',
      day_of_week: parseList(days),
      exclude_neighborhoods: [],
      exclude_hours: [],
    }),
    [neighborhoods, routes, start, end, rush, days]
  );

  const setFilters = useCallback(
    (next: Filters) => {
      setSearchParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          setListParam(updated, 'nbhd', next.neighborhoods);
          setListParam(updated, 'routes', next.route_ids);
          setStringParam(updated, 'start', next.start_date);
          setStringParam(updated, 'end', next.end_date);
          setFlagParam(updated, 'rush', next.rush_hour_only);
          setListParam(updated, 'days', next.day_of_week);
          return updated;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  return [filters, setFilters];
}
