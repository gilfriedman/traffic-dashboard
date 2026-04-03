export interface TrafficRecord {
  _id: string;
  route_id: string;
  route_name: string;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  local_time: string;
  day_of_week: string;
  is_rush_hour: boolean;
  distance: { meters: number; text: string };
  duration: { seconds: number; text: string };
  duration_in_traffic?: { seconds: number; text: string };
  congestion_ratio: number;
  status: string;
}

export interface PaginatedResponse {
  data: TrafficRecord[];
  total: number;
  limit: number;
  offset: number;
}

export interface RouteInfo {
  route_id: string;
  route_name: string;
  neighborhood: string;
  neighborhood_display: string;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
}

export interface NeighborhoodInfo {
  key: string;
  display_name: string;
  route_count: number;
  route_ids: string[];
}

export interface HealthInfo {
  status: string;
  total_records: number;
  first_record: string | null;
  last_record: string | null;
}

export interface CongestionOverTimePoint {
  time: string;
  neighborhood: string;
  neighborhood_display: string;
  avg_congestion: number;
  max_congestion: number;
  count: number;
}

export interface NeighborhoodComparisonPoint {
  neighborhood: string;
  neighborhood_display: string;
  avg_congestion: number;
  max_congestion: number;
  min_congestion: number;
  count: number;
}

export interface DayOfWeekPoint {
  day: string;
  neighborhood: string;
  neighborhood_display: string;
  avg_congestion: number;
  count: number;
}

export interface RushHourPoint {
  time_slot: string;
  neighborhood: string;
  neighborhood_display: string;
  avg_congestion: number;
  count: number;
}

export interface RouteRankingPoint {
  route_id: string;
  route_name: string;
  neighborhood: string;
  neighborhood_display: string;
  avg_congestion: number;
  max_congestion: number;
  count: number;
}

export interface DistributionPoint {
  bucket: string;
  min: number;
  count: number;
}

export interface Filters {
  neighborhoods: string[];
  route_ids: string[];
  start_date: string;
  end_date: string;
  rush_hour_only: boolean;
  day_of_week: string[];
  exclude_neighborhoods: string[];
}
