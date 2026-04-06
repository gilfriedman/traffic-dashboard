interface ChartDescriptionProps {
  text: string;
}

export function ChartDescription({ text }: ChartDescriptionProps) {
  const lines = text.split('\n');
  const intro = lines[0];
  const bullets = lines.slice(1).filter((line) => line.trim());

  if (!bullets.length) {
    return <p className="text-xs text-slate-400 mt-2">{intro}</p>;
  }

  return (
    <div className="text-xs text-slate-400 mt-2">
      <p>{intro}</p>
      <ul className="list-disc ps-5 mt-1 space-y-0.5">
        {bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
    </div>
  );
}
