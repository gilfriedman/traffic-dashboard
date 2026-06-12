import type { NetworkNeighborhoodMetrics, NetworkRepresentationSummary } from '../../lib/types';

type MetricValue = number | null | undefined;

interface MetricRow {
  key: string;
  getValue: (summary: NetworkRepresentationSummary, neighborhood: NetworkNeighborhoodMetrics) => MetricValue;
  format: (value: number) => string;
}

interface MetricGroup {
  groupLabelKey: string;
  metrics: MetricRow[];
}

const count = (value: number) => value.toLocaleString();
const localized = (value: number) => value.toLocaleString();
const decimal2 = (value: number) => value.toFixed(2);
const decimal3 = (value: number) => value.toFixed(3);
const decimal4 = (value: number) => value.toFixed(4);

export const NETWORK_METRIC_GROUPS: MetricGroup[] = [
  {
    groupLabelKey: 'networkTable.groups.basicStats',
    metrics: [
      { key: 'node_count', getValue: (summary) => summary.basic_stats.node_count, format: count },
      { key: 'edge_count', getValue: (summary) => summary.basic_stats.edge_count, format: count },
      { key: 'intersection_count', getValue: (summary) => summary.basic_stats.intersection_count, format: count },
      { key: 'total_street_length_m', getValue: (summary) => summary.basic_stats.total_street_length_m, format: localized },
      { key: 'avg_street_length_m', getValue: (summary) => summary.basic_stats.avg_street_length_m, format: decimal2 },
      { key: 'street_density_m_per_km2', getValue: (summary) => summary.basic_stats.street_density_m_per_km2, format: localized },
      { key: 'intersection_density_per_km2', getValue: (summary) => summary.basic_stats.intersection_density_per_km2, format: decimal2 },
      { key: 'avg_node_degree', getValue: (summary) => summary.basic_stats.avg_node_degree, format: decimal2 },
      { key: 'circuity', getValue: (summary) => summary.basic_stats.circuity, format: decimal3 },
      { key: 'area_km2', getValue: (_summary, neighborhood) => neighborhood.area_km2, format: decimal2 },
      { key: 'exit_count', getValue: (summary) => summary.exit_count, format: count },
    ],
  },
  {
    groupLabelKey: 'networkTable.groups.centrality',
    metrics: [
      { key: 'avg_betweenness', getValue: (summary) => summary.centrality_summary.avg_betweenness, format: decimal4 },
      { key: 'max_betweenness', getValue: (summary) => summary.centrality_summary.max_betweenness, format: decimal4 },
      { key: 'avg_closeness', getValue: (summary) => summary.centrality_summary.avg_closeness, format: decimal4 },
      { key: 'max_closeness', getValue: (summary) => summary.centrality_summary.max_closeness, format: decimal4 },
    ],
  },
  {
    groupLabelKey: 'networkTable.groups.connectivity',
    metrics: [
      { key: 'avg_node_connectivity', getValue: (summary) => summary.connectivity.avg_node_connectivity, format: decimal3 },
      { key: 'bridge_count', getValue: (summary) => summary.connectivity.bridge_count, format: count },
      { key: 'bridge_ratio', getValue: (summary) => summary.connectivity.bridge_ratio, format: decimal3 },
    ],
  },
  {
    groupLabelKey: 'networkTable.groups.spaceSyntax',
    metrics: [
      { key: 'mean_depth', getValue: (summary) => summary.space_syntax?.mean_depth, format: decimal2 },
      { key: 'integration', getValue: (summary) => summary.space_syntax?.integration, format: decimal3 },
      { key: 'intelligibility', getValue: (summary) => summary.space_syntax?.intelligibility, format: decimal3 },
    ],
  },
];

export function formatMetricValue(value: MetricValue, format: (value: number) => string): string {
  if (value == null) return 'N/A';
  return format(value);
}
