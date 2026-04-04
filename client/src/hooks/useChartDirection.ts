import { useTranslation } from 'react-i18next';

interface ChartMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export function useChartDirection() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'he';

  return {
    isRtl,
    yAxisOrientation: (isRtl ? 'right' : 'left') as 'left' | 'right',
    xAxisReversed: isRtl,
    mirrorMargin: (margin: ChartMargin): ChartMargin =>
      isRtl ? { ...margin, left: margin.right, right: margin.left } : margin,
  };
}
