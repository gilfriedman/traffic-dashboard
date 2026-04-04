import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

interface MetricTooltipProps {
  description: string;
}

export function MetricTooltip({ description }: MetricTooltipProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 4,
      left: rect.left + rect.width / 2,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    function handleClickOutside(event: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, updatePosition]);

  return (
    <span className="inline-flex items-center">
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex items-center text-slate-400 hover:text-slate-600 transition-colors ms-1"
        aria-label="More info"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && createPortal(
        <div
          ref={tooltipRef}
          dir="auto"
          style={{ top: position.top, left: position.left, transform: 'translateX(-50%)' }}
          className="fixed z-[9999] w-64 p-2 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg shadow-lg"
        >
          {description}
        </div>,
        document.body
      )}
    </span>
  );
}
