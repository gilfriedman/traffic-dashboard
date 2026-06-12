import { createContext, useContext } from 'react';

const MetricTooltipVisibilityContext = createContext(true);

export const MetricTooltipVisibilityProvider = MetricTooltipVisibilityContext.Provider;

export function useMetricTooltipVisible(): boolean {
  return useContext(MetricTooltipVisibilityContext);
}
