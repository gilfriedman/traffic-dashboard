export interface RegressionLine {
  slope: number;
  intercept: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export function computeLinearRegression(points: { x: number; y: number }[]): RegressionLine | null {
  const n = points.length;
  if (n < 2) return null;

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (const point of points) {
    sumX += point.x;
    sumY += point.y;
    sumXY += point.x * point.y;
    sumX2 += point.x * point.x;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));

  return {
    slope,
    intercept,
    startX: minX,
    startY: slope * minX + intercept,
    endX: maxX,
    endY: slope * maxX + intercept,
  };
}
