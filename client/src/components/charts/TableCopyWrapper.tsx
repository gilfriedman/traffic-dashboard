import { useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Image as ImageIcon, Download } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useChartDirection } from '../../hooks/useChartDirection';
import { copyElementToClipboard, downloadElementAsPng } from '../../lib/htmlImageExport';
import { copyTableAsTsv } from '../../lib/tableExport';
import { cn } from '../../lib/utils';
import { ExportButton } from './ExportButton';

interface Props {
  children: ReactNode;
  fileName: string;
  className?: string;
}

export function TableCopyWrapper({ children, fileName, className }: Props) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { isRtl } = useChartDirection();
  const containerRef = useRef<HTMLDivElement>(null);

  async function handleCopyText() {
    const container = containerRef.current;
    if (!container) {
      showToast(t('chartExport.errorNotReady'), 'error');
      return;
    }
    try {
      await copyTableAsTsv(container);
      showToast(t('chartExport.textCopied'), 'success');
    } catch {
      showToast(t('chartExport.copyFailed'), 'error');
    }
  }

  async function handleCopyImage() {
    const container = containerRef.current;
    if (!container) {
      showToast(t('chartExport.errorNotReady'), 'error');
      return;
    }
    try {
      await copyElementToClipboard(container.querySelector('table') ?? container);
      showToast(t('chartExport.copied'), 'success');
    } catch {
      showToast(t('chartExport.copyFailed'), 'error');
    }
  }

  async function handleDownload() {
    const container = containerRef.current;
    if (!container) {
      showToast(t('chartExport.errorNotReady'), 'error');
      return;
    }
    try {
      await downloadElementAsPng(container.querySelector('table') ?? container, fileName);
      showToast(t('chartExport.downloaded'), 'success');
    } catch {
      showToast(t('chartExport.downloadFailed'), 'error');
    }
  }

  return (
    <div className={cn('relative group', className)}>
      <div ref={containerRef}>{children}</div>
      <div
        className={cn(
          'absolute top-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
          isRtl ? 'left-2' : 'right-2'
        )}
      >
        <ExportButton icon={Copy} label={t('chartExport.copyText')} onClick={handleCopyText} />
        <ExportButton icon={ImageIcon} label={t('chartExport.copyImage')} onClick={handleCopyImage} />
        <ExportButton icon={Download} label={t('chartExport.download')} onClick={handleDownload} />
      </div>
    </div>
  );
}
