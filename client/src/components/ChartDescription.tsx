interface ChartDescriptionProps {
  text: string;
}

export function ChartDescription({ text }: ChartDescriptionProps) {
  return <p className="text-xs text-slate-400 mt-2">{text}</p>;
}
