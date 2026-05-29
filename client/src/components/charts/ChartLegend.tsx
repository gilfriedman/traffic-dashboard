interface ChartLegendEntry {
  key: string;
  label: string;
  color: string;
  dash?: string;
}

interface Props {
  entries: ChartLegendEntry[];
}

// Renders the legend as plain HTML below the chart so the plot keeps the full
// ResponsiveContainer height instead of being squished by an in-chart legend.
// Class names and marker attributes mirror Recharts' legend markup so the PNG
// export (imageExport.ts) can read it the same way it reads the native legend.
export function ChartLegend({ entries }: Props) {
  return (
    <ul className="recharts-default-legend flex flex-wrap justify-center gap-x-4 gap-y-1 list-none m-0 px-4 pt-3 pb-1">
      {entries.map((entry) => (
        <li key={entry.key} className="recharts-legend-item inline-flex items-center gap-1.5">
          <svg className="recharts-legend-icon" width="16" height="4" viewBox="0 0 16 4">
            <line
              x1="0"
              y1="2"
              x2="16"
              y2="2"
              stroke={entry.color}
              strokeWidth="2.5"
              strokeDasharray={entry.dash}
            />
          </svg>
          <span className="recharts-legend-item-text text-xs text-slate-700">{entry.label}</span>
        </li>
      ))}
    </ul>
  );
}
