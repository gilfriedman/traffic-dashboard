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

const ROUTE_COLORS = [
  '#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899',
  '#06b6d4', '#f97316', '#84cc16', '#6366f1', '#14b8a6', '#e11d48',
];

export function getRouteColor(index: number): string {
  return ROUTE_COLORS[index % ROUTE_COLORS.length];
}
