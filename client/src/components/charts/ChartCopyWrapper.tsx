import { useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Download } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useChartDirection } from '../../hooks/useChartDirection';
import { copyChartToClipboard, downloadChartAsPng } from '../../lib/imageExport';
import { cn } from '../../lib/utils';
import { ExportButton } from './ExportButton';

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
        <ExportButton icon={Copy} label={t('chartExport.copy')} onClick={handleCopy} />
        <ExportButton icon={Download} label={t('chartExport.download')} onClick={handleDownload} />
      </div>
    </div>
  );
}
