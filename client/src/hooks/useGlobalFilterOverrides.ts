import { useMemo } from 'react';
import { useGlobalFilters } from '../contexts/GlobalFiltersContext';
import { EXCLUDED_NEIGHBORHOODS } from '../lib/consts';

export function useGlobalFilterOverrides() {
  const { beerShevaOnly, hideMidnight } = useGlobalFilters();

  return useMemo(() => ({
    exclude_neighborhoods: beerShevaOnly ? EXCLUDED_NEIGHBORHOODS : [],
    exclude_hours: hideMidnight ? [0] : [],
  }), [beerShevaOnly, hideMidnight]);
}
