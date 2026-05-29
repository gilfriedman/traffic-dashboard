const COPY_SCALE = 2;
const DOWNLOAD_SCALE = 3;
const EXPORT_BACKGROUND = '#ffffff';
const EXPORT_FONT_FAMILY = 'system-ui, -apple-system, "Segoe UI", sans-serif';
const XLINK_NS = 'http://www.w3.org/1999/xlink';
const SVG_NS = 'http://www.w3.org/2000/svg';
const LEGEND_FONT_SIZE = 13;
const LEGEND_GAP = 8;
const LEGEND_MARKER_LENGTH = 16;
const LEGEND_MARKER_STROKE_WIDTH = 2.5;
const LEGEND_MARKER_TEXT_SPACING = 6;
const LEGEND_ITEM_SPACING = 18;
const LEGEND_ROW_HEIGHT = LEGEND_FONT_SIZE + 6;

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}

async function inlineImageHrefs(svg: SVGSVGElement): Promise<void> {
  const images = Array.from(svg.querySelectorAll('image'));
  await Promise.all(
    images.map(async (image) => {
      const href = image.getAttribute('href') ?? image.getAttributeNS(XLINK_NS, 'href');
      if (!href || href.startsWith('data:')) return;
      try {
        const response = await fetch(href);
        const blob = await response.blob();
        const dataUrl = await blobToDataUrl(blob);
        image.setAttribute('href', dataUrl);
        if (image.hasAttributeNS(XLINK_NS, 'href')) {
          image.setAttributeNS(XLINK_NS, 'href', dataUrl);
        }
      } catch {
        image.remove();
      }
    })
  );
}

interface LegendItem {
  color: string;
  text: string;
  textColor: string;
  dash?: string;
}

function readMarkerColor(marker: Element | null): string {
  const stroke = marker?.getAttribute('stroke');
  if (stroke && stroke !== 'none') return stroke;
  return marker?.getAttribute('fill') ?? '#64748b';
}

function readMarkerDash(marker: Element | null): string | undefined {
  const dash = marker?.getAttribute('stroke-dasharray');
  return dash && /\d/.test(dash) ? dash : undefined;
}

function extractLegendItems(container: HTMLElement): LegendItem[] {
  const items = Array.from(container.querySelectorAll('.recharts-legend-item'));
  return items
    .map((item): LegendItem | null => {
      const marker = item.querySelector('.recharts-legend-icon');
      const color = readMarkerColor(marker);
      const dash = readMarkerDash(marker);
      const textSpan = item.querySelector('.recharts-legend-item-text') as HTMLElement | null;
      const text = textSpan?.textContent?.trim() ?? '';
      const textColor = textSpan?.style.color || '#1e293b';
      if (!text) return null;
      return { color, text, textColor, dash };
    })
    .filter((item): item is LegendItem => item !== null);
}

function measureLegendText(text: string): number {
  return text.length * (LEGEND_FONT_SIZE * 0.6);
}

interface MeasuredLegendItem {
  item: LegendItem;
  width: number;
}

function groupLegendItemsIntoRows(items: MeasuredLegendItem[], maxRowWidth: number): MeasuredLegendItem[][] {
  const rows: MeasuredLegendItem[][] = [];
  let currentRow: MeasuredLegendItem[] = [];
  let currentRowWidth = 0;

  for (const entry of items) {
    const addedWidth = currentRow.length === 0 ? entry.width : LEGEND_ITEM_SPACING + entry.width;
    const overflows = currentRow.length > 0 && currentRowWidth + addedWidth > maxRowWidth;
    if (overflows) {
      rows.push(currentRow);
      currentRow = [entry];
      currentRowWidth = entry.width;
    } else {
      currentRow.push(entry);
      currentRowWidth += addedWidth;
    }
  }
  if (currentRow.length > 0) rows.push(currentRow);

  return rows;
}

function drawLegendItem(group: SVGGElement, entry: MeasuredLegendItem, x: number, y: number): void {
  const marker = document.createElementNS(SVG_NS, 'line');
  marker.setAttribute('x1', String(x));
  marker.setAttribute('y1', String(y));
  marker.setAttribute('x2', String(x + LEGEND_MARKER_LENGTH));
  marker.setAttribute('y2', String(y));
  marker.setAttribute('stroke', entry.item.color);
  marker.setAttribute('stroke-width', String(LEGEND_MARKER_STROKE_WIDTH));
  if (entry.item.dash) marker.setAttribute('stroke-dasharray', entry.item.dash);
  group.appendChild(marker);

  const text = document.createElementNS(SVG_NS, 'text');
  text.setAttribute('x', String(x + LEGEND_MARKER_LENGTH + LEGEND_MARKER_TEXT_SPACING));
  text.setAttribute('y', String(y));
  text.setAttribute('dominant-baseline', 'middle');
  text.setAttribute('text-anchor', 'start');
  text.setAttribute('fill', entry.item.textColor);
  text.textContent = entry.item.text;
  group.appendChild(text);
}

function measureRowWidth(row: MeasuredLegendItem[]): number {
  return row.reduce((sum, entry) => sum + entry.width, 0) +
    LEGEND_ITEM_SPACING * Math.max(0, row.length - 1);
}

function appendSvgLegend(svg: SVGSVGElement, items: LegendItem[], chartWidth: number, chartHeight: number): number {
  if (items.length === 0) return chartHeight;

  const itemsWithWidth: MeasuredLegendItem[] = items.map((item) => ({
    item,
    width: LEGEND_MARKER_LENGTH + LEGEND_MARKER_TEXT_SPACING + measureLegendText(item.text),
  }));

  const rows = groupLegendItemsIntoRows(itemsWithWidth, chartWidth);

  const group = document.createElementNS(SVG_NS, 'g');
  group.setAttribute('font-family', EXPORT_FONT_FAMILY);
  group.setAttribute('font-size', String(LEGEND_FONT_SIZE));

  rows.forEach((row, rowIndex) => {
    const rowY = chartHeight + LEGEND_GAP + LEGEND_ROW_HEIGHT * rowIndex + LEGEND_ROW_HEIGHT / 2;
    let cursorX = Math.max(0, (chartWidth - measureRowWidth(row)) / 2);
    for (const entry of row) {
      drawLegendItem(group, entry, cursorX, rowY);
      cursorX += entry.width + LEGEND_ITEM_SPACING;
    }
  });

  svg.appendChild(group);
  return chartHeight + LEGEND_GAP + LEGEND_ROW_HEIGHT * rows.length;
}

async function prepareSvgForExport(source: SVGSVGElement, container: HTMLElement | null): Promise<{ svgString: string; width: number; height: number }> {
  const rect = source.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const chartHeight = Math.max(1, Math.round(rect.height));

  const clone = source.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', SVG_NS);
  clone.setAttribute('xmlns:xlink', XLINK_NS);
  clone.style.fontFamily = EXPORT_FONT_FAMILY;

  await inlineImageHrefs(clone);

  const legendItems = container ? extractLegendItems(container) : [];
  const totalHeight = appendSvgLegend(clone, legendItems, width, chartHeight);

  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(totalHeight));
  clone.setAttribute('viewBox', `0 0 ${width} ${totalHeight}`);

  const svgString = new XMLSerializer().serializeToString(clone);
  return { svgString, width, height: totalHeight };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load SVG image'));
    image.src = src;
  });
}

function findLargestSvg(container: HTMLElement): SVGSVGElement | null {
  let largest: SVGSVGElement | null = null;
  let largestArea = 0;
  container.querySelectorAll('svg').forEach((svg) => {
    const rect = svg.getBoundingClientRect();
    const area = rect.width * rect.height;
    if (area > largestArea) {
      largestArea = area;
      largest = svg as SVGSVGElement;
    }
  });
  return largest;
}

async function rasterizeChart(container: HTMLElement, scale: number): Promise<Blob> {
  const svg = findLargestSvg(container);
  if (!svg) throw new Error('No chart SVG found');

  const { svgString, width, height } = await prepareSvgForExport(svg, container);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await loadImage(svgUrl);

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');

    ctx.fillStyle = EXPORT_BACKGROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
    ctx.drawImage(image, 0, 0, width, height);

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      }, 'image/png');
    });
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

export async function copyChartToClipboard(container: HTMLElement): Promise<void> {
  if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
    throw new Error('Clipboard API not supported');
  }
  const blob = await rasterizeChart(container, COPY_SCALE);
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}

export async function downloadChartAsPng(container: HTMLElement, fileName: string): Promise<void> {
  const blob = await rasterizeChart(container, DOWNLOAD_SCALE);
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    URL.revokeObjectURL(url);
  }
}
