import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

export function ExportButton({ icon: Icon, label, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex items-center gap-1 px-2 py-1 text-xs bg-white/90 border border-slate-200 rounded-md shadow-sm hover:bg-white text-slate-700"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
