import html2canvas from 'html2canvas-pro';

const SCALE = 2;
const BACKGROUND = '#ffffff';

function renderToCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  return html2canvas(element, { scale: SCALE, backgroundColor: BACKGROUND, useCORS: true });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), 'image/png');
  });
}

export async function copyElementToClipboard(element: HTMLElement): Promise<void> {
  const blob = await canvasToBlob(await renderToCanvas(element));
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}

export async function downloadElementAsPng(element: HTMLElement, fileName: string): Promise<void> {
  const blob = await canvasToBlob(await renderToCanvas(element));
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.png`;
    link.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}
