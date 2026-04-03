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
} from './types';
import { buildQueryParams } from './utils';

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

export function getHealth(): Promise<HealthInfo> {
  return fetchJson('/api/health');
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

export function getExportUrl(filters: Filters, format: 'csv' | 'json'): string {
  return `/api/export/${format}?${buildQueryParams(filters)}`;
}
