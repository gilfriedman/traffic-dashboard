import { useTranslation } from 'react-i18next';
import { useChartDirection } from '../../hooks/useChartDirection';
import { cn } from '../../lib/utils';

interface Props {
  r2: number;
  sampleCount: number;
  featureCount?: number;
}

function computeAdjustedR2(r2: number, n: number, k: number): number | null {
  if (n - k - 1 <= 0) return null;
  return 1 - (1 - r2) * (n - 1) / (n - k - 1);
}

export function RegressionStatsBadge({ r2, sampleCount, featureCount = 1 }: Props) {
  const { t } = useTranslation();
  const { isRtl } = useChartDirection();
  const isPair = featureCount > 1;
  const adjustedR2 = isPair ? computeAdjustedR2(r2, sampleCount, featureCount) : null;

  return (
    <div className={cn('group/stat absolute top-2 z-10', isRtl ? 'left-2' : 'right-2')}>
      <div className="flex items-center gap-1 bg-white/90 border border-slate-200 rounded-md px-2 py-1 text-xs font-medium text-slate-700 shadow-sm cursor-help">
        <span data-chart-export-stat>
          {t('scatter.r2')} = {r2.toFixed(3)}
          {adjustedR2 !== null && (
            <span className="text-slate-500"> · {t('scatter.r2Adj')} = {adjustedR2.toFixed(3)}</span>
          )}
        </span>
        <span className="text-slate-400 text-[10px]">ⓘ</span>
      </div>
      <div
        className={cn(
          'invisible group-hover/stat:visible absolute top-full mt-1 w-72 bg-slate-800 text-white text-xs leading-relaxed p-2 rounded-md shadow-lg whitespace-pre-line',
          isRtl ? 'left-0 text-right' : 'right-0 text-left'
        )}
        style={{ direction: isRtl ? 'rtl' : 'ltr' }}
      >
        {t('scatter.r2Tooltip')}
        {adjustedR2 !== null && (
          <>
            {'\n\n'}
            {t('scatter.r2AdjTooltip', { n: sampleCount, k: featureCount })}
          </>
        )}
      </div>
    </div>
  );
}
