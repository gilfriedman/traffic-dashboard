import { Fragment } from 'react';

interface ChartDescriptionProps {
  text: string;
}

const BOLD_PATTERN = /\*\*(.+?)\*\*/g;

function renderWithBold(text: string) {
  const segments = text.split(BOLD_PATTERN);
  return segments.map((segment, index) =>
    index % 2 === 1 ? (
      <strong key={index} className="font-semibold text-slate-600">{segment}</strong>
    ) : (
      <Fragment key={index}>{segment}</Fragment>
    )
  );
}

export function ChartDescription({ text }: ChartDescriptionProps) {
  const lines = text.split('\n');
  const intro = lines[0];
  const bullets = lines.slice(1).filter((line) => line.trim());

  if (!bullets.length) {
    return <p className="text-xs text-slate-400 mt-2">{renderWithBold(intro)}</p>;
  }

  return (
    <div className="text-xs text-slate-400 mt-2">
      <p>{renderWithBold(intro)}</p>
      <ul className="list-disc ps-5 mt-1 space-y-0.5">
        {bullets.map((bullet) => (
          <li key={bullet}>{renderWithBold(bullet)}</li>
        ))}
      </ul>
    </div>
  );
}
