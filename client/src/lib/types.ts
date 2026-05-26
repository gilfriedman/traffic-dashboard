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
  neighborhood?: string;
  neighborhood_display?: string;
  route_id?: string;
  route_name?: string;
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
  neighborhood?: string;
  neighborhood_display?: string;
  route_id?: string;
  route_name?: string;
  avg_congestion: number;
  count: number;
}

export type CongestionMetric = 'avg' | 'max' | 'min';

export interface RushHourPoint {
  time_slot: string;
  neighborhood?: string;
  neighborhood_display?: string;
  route_id?: string;
  route_name?: string;
  avg_congestion: number;
  max_congestion: number;
  min_congestion: number;
  count: number;
}

export interface CongestionStats {
  avg: number;
  max: number;
  min: number;
}

export interface RushHourProfile {
  slots: RushHourPoint[];
  baselines: Record<string, CongestionStats>;
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

export interface NetworkBasicStats {
  node_count: number;
  edge_count: number;
  total_street_length_m: number;
  avg_street_length_m: number;
  intersection_count: number;
  intersection_density_per_km2: number;
  street_density_m_per_km2: number;
  avg_node_degree: number;
  circuity: number | null;
}

export interface NetworkConnectivity {
  avg_node_connectivity: number;
  bridge_count: number;
  bridge_ratio: number;
}

export interface NetworkCentralitySummary {
  avg_betweenness: number;
  max_betweenness: number;
  avg_closeness: number;
  max_closeness: number;
}

export interface NetworkExitSummary {
  street_name: string;
  from_coords: [number, number];
  to_coords: [number, number];
}

export interface SpaceSyntaxMetrics {
  mean_depth: number;
  integration: number | null;
  intelligibility: number | null;
  computed_on_node_count: number;
}

export interface NetworkRepresentationSummary {
  basic_stats: NetworkBasicStats;
  connectivity: NetworkConnectivity;
  centrality_summary: NetworkCentralitySummary;
  exit_count: number;
  exits: NetworkExitSummary[];
  space_syntax?: SpaceSyntaxMetrics | null;
}

export interface NetworkNeighborhoodMetrics {
  neighborhood_key: string;
  neighborhood_display: string;
  name_en: string;
  name_he: string;
  area_km2: number;
  geometric: NetworkRepresentationSummary;
  topologic: NetworkRepresentationSummary;
}

export interface CongestionVsStructurePoint {
  neighborhood_key: string;
  neighborhood_display: string;
  representation: 'geometric' | 'topologic';
  avg_congestion: number;
  max_congestion: number;
  sample_count: number;
  node_count: number;
  edge_count: number;
  intersection_count: number;
  total_street_length_m: number;
  avg_street_length_m: number;
  street_density_m_per_km2: number;
  intersection_density_per_km2: number;
  avg_node_degree: number;
  circuity: number | null;
  avg_node_connectivity: number;
  bridge_count: number;
  bridge_ratio: number;
  exit_count: number;
  area_km2: number;
  avg_betweenness: number;
  max_betweenness: number;
  avg_closeness: number;
  max_closeness: number;
  mean_depth: number | null;
  integration: number | null;
  intelligibility: number | null;
  predictor_space_syntax: number | null;
  predictor_capacity: number | null;
  predictor_geometry: number | null;
}

export interface CongestionVsDemographicsPoint {
  neighborhood_key: string;
  neighborhood_display: string;
  avg_congestion: number;
  max_congestion: number;
  sample_count: number;
  cars_per_100_residents: number | null;
  population_density_per_km2: number | null;
  socioeconomic_cluster: number | null;
  avg_income_per_capita: number | null;
  pct_academic_degree: number | null;
  employment_rate: number | null;
  pct_households_2_plus_cars: number | null;
}

export interface ExitCongestionPoint {
  neighborhood_key: string;
  neighborhood_display: string;
  exit_street_name: string;
  matched_route_id: string;
  matched_route_name: string;
  distance_meters: number;
  avg_congestion: number;
  max_congestion: number;
  sample_count: number;
}

export interface BottleneckPoint {
  osm_node_id: number;
  neighborhood_key: string;
  neighborhood_display: string;
  lat: number;
  lng: number;
  betweenness_centrality: number;
  closeness_centrality: number;
  degree: number;
  is_exit_node: boolean;
  nearby_avg_congestion: number;
  nearby_route_count: number;
  bottleneck_score: number;
}

export interface NetworkGraphNode {
  lat: number;
  lng: number;
  classification: 'interior' | 'perimeter' | 'exterior';
  is_exit_node: boolean;
  integration?: number | null;
}

export interface NetworkGraphEdge {
  from_lat: number;
  from_lng: number;
  to_lat: number;
  to_lng: number;
  is_exit_edge: boolean;
}

export interface NetworkGraphExit {
  street_name: string;
  from_coords: [number, number];
  to_coords: [number, number];
}

export interface NetworkGraphData {
  neighborhood_key: string;
  name_en: string;
  name_he: string;
  representation: 'geometric' | 'topologic';
  exit_count: number;
  boundary: [number, number][];
  nodes: NetworkGraphNode[];
  edges: NetworkGraphEdge[];
  exits: NetworkGraphExit[];
}

export interface DemographicsData {
  population: number | null;
  area_km2: number | null;
  population_density_per_km2: number | null;
  pct_adults_18_plus: number | null;
  avg_household_size: number | null;
}

export interface SocioeconomicData {
  socioeconomic_cluster: number | null;
  avg_income_per_capita: number | null;
  pct_academic_degree: number | null;
}

export interface TransportationData {
  cars_per_100_residents: number | null;
  pct_households_0_cars: number | null;
  pct_households_2_plus_cars: number | null;
}

export interface PublicTransitData {
  bus_stops_per_km2: number | null;
  bus_lines_count: number | null;
  pct_using_public_transit: number | null;
}

export interface EmploymentData {
  employment_rate: number | null;
  pct_working_outside_neighborhood: number | null;
}

export interface UrbanPlanningData {
  housing_density_per_km2: number | null;
  pct_apartments: number | null;
  avg_building_floors: number | null;
}

export interface HistoricalData {
  year_established: number | null;
  year_populated: number | null;
}

export interface NeighborhoodDemographics {
  neighborhood_key: string;
  neighborhood_display: string;
  city_key: string;
  name_en: string;
  name_he: string;
  stat_areas: number[];
  demographics: DemographicsData;
  socioeconomic: SocioeconomicData;
  transportation: TransportationData;
  public_transit: PublicTransitData;
  employment: EmploymentData;
  urban_planning: UrbanPlanningData;
  historical: HistoricalData;
}

export interface Filters {
  neighborhoods: string[];
  route_ids: string[];
  start_date: string;
  end_date: string;
  rush_hour_only: boolean;
  day_of_week: string[];
  exclude_neighborhoods: string[];
  exclude_hours: number[];
}
