import type {
  HealthInfo,
  RouteInfo,
  NeighborhoodInfo,
  PaginatedResponse,
  CongestionOverTimePoint,
  NeighborhoodComparisonPoint,
  DayOfWeekPoint,
  RushHourPoint,
  RouteRankingPoint,
  DistributionPoint,
  Filters,
  NetworkNeighborhoodMetrics,
  CongestionVsStructurePoint,
  ExitCongestionPoint,
  BottleneckPoint,
  NetworkGraphData,
  NeighborhoodDemographics,
} from './types';
import { buildQueryParams } from './utils';

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

export function getHealth(overrides: GlobalOverrides = {}): Promise<HealthInfo> {
  return fetchJson(`/api/health?${buildGlobalParams(overrides)}`);
}

export function getRoutes(): Promise<RouteInfo[]> {
  return fetchJson('/api/routes');
}

export function getNeighborhoods(): Promise<NeighborhoodInfo[]> {
  return fetchJson('/api/neighborhoods');
}

export function getTrafficData(
  filters: Filters,
  limit: number,
  offset: number,
  sortBy = 'local_time',
  sortOrder = 'desc'
): Promise<PaginatedResponse> {
  const params = buildQueryParams(filters);
  params.set('limit', String(limit));
  params.set('offset', String(offset));
  params.set('sort_by', sortBy);
  params.set('sort_order', sortOrder);
  return fetchJson(`/api/traffic/data?${params}`);
}

export function getCongestionOverTime(filters: Filters, granularity = 'hour'): Promise<CongestionOverTimePoint[]> {
  const params = buildQueryParams(filters);
  params.set('granularity', granularity);
  return fetchJson(`/api/charts/congestion-over-time?${params}`);
}

export function getNeighborhoodComparison(filters: Filters): Promise<NeighborhoodComparisonPoint[]> {
  return fetchJson(`/api/charts/neighborhood-comparison?${buildQueryParams(filters)}`);
}

export function getDayOfWeek(filters: Filters): Promise<DayOfWeekPoint[]> {
  return fetchJson(`/api/charts/day-of-week?${buildQueryParams(filters)}`);
}

export function getRushHourProfile(filters: Filters): Promise<RushHourPoint[]> {
  return fetchJson(`/api/charts/rush-hour-profile?${buildQueryParams(filters)}`);
}

export function getRouteRanking(filters: Filters): Promise<RouteRankingPoint[]> {
  return fetchJson(`/api/charts/route-ranking?${buildQueryParams(filters)}`);
}

export function getCongestionDistribution(filters: Filters): Promise<DistributionPoint[]> {
  return fetchJson(`/api/charts/congestion-distribution?${buildQueryParams(filters)}`);
}

export interface GlobalOverrides {
  exclude_neighborhoods?: string[];
  exclude_hours?: number[];
}

function buildGlobalParams(overrides: GlobalOverrides): URLSearchParams {
  const params = new URLSearchParams();
  overrides.exclude_neighborhoods?.forEach((neighborhood) => params.append('exclude_neighborhoods', neighborhood));
  overrides.exclude_hours?.forEach((hour) => params.append('exclude_hours', String(hour)));
  return params;
}

export function getNetworkNeighborhoods(overrides: GlobalOverrides = {}): Promise<NetworkNeighborhoodMetrics[]> {
  return fetchJson(`/api/network/neighborhoods?${buildGlobalParams(overrides)}`);
}

export function getCongestionVsStructure(overrides: GlobalOverrides = {}): Promise<CongestionVsStructurePoint[]> {
  return fetchJson(`/api/network/congestion-vs-structure?${buildGlobalParams(overrides)}`);
}

export function getExitCongestion(overrides: GlobalOverrides = {}, neighborhood?: string): Promise<ExitCongestionPoint[]> {
  const params = buildGlobalParams(overrides);
  if (neighborhood) params.set('neighborhood', neighborhood);
  return fetchJson(`/api/network/exit-congestion?${params}`);
}

export function getBottlenecks(neighborhood: string, overrides: GlobalOverrides = {}): Promise<BottleneckPoint[]> {
  const params = buildGlobalParams(overrides);
  params.set('neighborhood', neighborhood);
  return fetchJson(`/api/network/bottlenecks?${params}`);
}

export function getNeighborhoodDemographics(overrides: GlobalOverrides = {}): Promise<NeighborhoodDemographics[]> {
  return fetchJson(`/api/network/demographics?${buildGlobalParams(overrides)}`);
}

export function getNetworkGraph(neighborhood: string): Promise<NetworkGraphData> {
  return fetchJson(`/api/network/graph?neighborhood=${encodeURIComponent(neighborhood)}`);
}

export function getExportUrl(filters: Filters, format: 'csv' | 'json'): string {
  return `/api/export/${format}?${buildQueryParams(filters)}`;
}
