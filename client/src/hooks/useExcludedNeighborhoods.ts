import { useBeerShevaFilter } from '../contexts/BeerShevaFilterContext';
import { EXCLUDED_NEIGHBORHOODS } from '../lib/consts';

export function useExcludedNeighborhoods(): string[] {
  const { beerShevaOnly } = useBeerShevaFilter();
  return beerShevaOnly ? EXCLUDED_NEIGHBORHOODS : [];
}
