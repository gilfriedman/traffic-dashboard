import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Filters } from './types';
import { EXCLUDED_NEIGHBORHOODS } from './consts';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const NEIGHBORHOOD_COLORS: Record<string, string> = {
  rambam: '#3b82f6',
  neve_zeev: '#ef4444',
  old_city: '#f59e0b',
  ramot_bet: '#10b981',
  shchuna_bet: '#8b5cf6',
  shchuna_he: '#ec4899',
};

export function getNeighborhoodColor(neighborhood: string): string {
  return NEIGHBORHOOD_COLORS[neighborhood] ?? '#6b7280';
}

export function buildQueryParams(filters: Filters): URLSearchParams {
  const params = new URLSearchParams();
  filters.neighborhoods.forEach((neighborhood) => params.append('neighborhoods', neighborhood));
  filters.route_ids.forEach((routeId) => params.append('route_ids', routeId));
  if (filters.start_date) params.set('start_date', filters.start_date);
  if (filters.end_date) params.set('end_date', filters.end_date);
  if (filters.rush_hour_only) params.set('rush_hour_only', 'true');
  filters.day_of_week.forEach((day) => params.append('day_of_week', day));
  filters.exclude_neighborhoods.forEach((neighborhood) => params.append('exclude_neighborhoods', neighborhood));
  filters.exclude_hours.forEach((hour) => params.append('exclude_hours', String(hour)));
  return params;
}

export function formatCongestion(value: number): string {
  return value.toFixed(2) + 'x';
}

export const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function isExcludedNeighborhood(neighborhood: string): boolean {
  return EXCLUDED_NEIGHBORHOODS.some((excluded) => neighborhood.startsWith(excluded));
}

// Hues are interleaved around the color wheel so consecutively-assigned routes
// land on contrasting colors rather than neighboring shades.
const ROUTE_COLORS = [
  '#ef4444', '#3b82f6', '#84cc16', '#d946ef', '#14b8a6', '#f97316',
  '#6366f1', '#22c55e', '#ec4899', '#06b6d4', '#eab308', '#8b5cf6',
  '#10b981', '#f43f5e', '#0ea5e9', '#f59e0b', '#a855f7', '#64748b',
];

// Once colors are exhausted, the line style cycles so a repeated color is still
// distinguishable: solid, then dashed, then dotted.
const ROUTE_DASH_PATTERNS: (string | undefined)[] = [undefined, '8 4', '2 4'];

export function getRouteColor(index: number): string {
  return ROUTE_COLORS[index % ROUTE_COLORS.length];
}

export interface RouteLineStyle {
  color: string;
  strokeDasharray?: string;
}

export function getRouteLineStyle(index: number): RouteLineStyle {
  const cycle = Math.floor(index / ROUTE_COLORS.length);
  return {
    color: getRouteColor(index),
    strokeDasharray: ROUTE_DASH_PATTERNS[cycle % ROUTE_DASH_PATTERNS.length],
  };
}

// Ordering series by their displayed name keeps color assignment stable across
// refreshes (colors are assigned by position), regardless of server row order.
export function sortKeysByDisplayName(
  keys: string[],
  getDisplayName: (key: string) => string
): string[] {
  return [...keys].sort((first, second) =>
    getDisplayName(first).localeCompare(getDisplayName(second))
  );
}
