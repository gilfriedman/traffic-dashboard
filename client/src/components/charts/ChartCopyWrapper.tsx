import { useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Download } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useChartDirection } from '../../hooks/useChartDirection';
import { copyChartToClipboard, downloadChartAsPng } from '../../lib/imageExport';
import { cn } from '../../lib/utils';

interface Props {
  children: ReactNode;
  fileName: string;
  className?: string;
}

export function ChartCopyWrapper({ children, fileName, className }: Props) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { isRtl } = useChartDirection();
  const chartRef = useRef<HTMLDivElement>(null);

  async function handleCopy() {
    const container = chartRef.current;
    if (!container) {
      showToast(t('chartExport.errorNotReady'), 'error');
      return;
    }
    try {
      await copyChartToClipboard(container);
      showToast(t('chartExport.copied'), 'success');
    } catch {
      showToast(t('chartExport.copyFailed'), 'error');
    }
  }

  async function handleDownload() {
    const container = chartRef.current;
    if (!container) {
      showToast(t('chartExport.errorNotReady'), 'error');
      return;
    }
    try {
      await downloadChartAsPng(container, fileName);
      showToast(t('chartExport.downloaded'), 'success');
    } catch {
      showToast(t('chartExport.downloadFailed'), 'error');
    }
  }

  return (
    <div dir="ltr" className={cn('relative group', className)}>
      <div ref={chartRef}>{children}</div>
      <div
        className={cn(
          'absolute top-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
          isRtl ? 'right-2' : 'left-2'
        )}
      >
        <button
          type="button"
          onClick={handleCopy}
          title={t('chartExport.copy')}
          aria-label={t('chartExport.copy')}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-white/90 border border-slate-200 rounded-md shadow-sm hover:bg-white text-slate-700"
        >
          <Copy className="h-3.5 w-3.5" />
          {t('chartExport.copy')}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          title={t('chartExport.download')}
          aria-label={t('chartExport.download')}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-white/90 border border-slate-200 rounded-md shadow-sm hover:bg-white text-slate-700"
        >
          <Download className="h-3.5 w-3.5" />
          {t('chartExport.download')}
        </button>
      </div>
    </div>
  );
}
