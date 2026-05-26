import { ReferenceLine } from 'recharts';

type Axis = 'x' | 'y';

export const congestionAxisDomain: [(dataMin: number) => number, 'auto'] = [
  (dataMin) => Math.max(0, dataMin - 0.1),
  'auto',
];

const STYLE = {
  stroke: '#94a3b8',
  strokeDasharray: '4 4',
  strokeWidth: 1,
  ifOverflow: 'extendDomain' as const,
  label: {
    value: 'baseline',
    position: 'insideTopRight' as const,
    fontSize: 10,
    fill: '#64748b',
  },
};

export const congestionBaselineLine = (axis: Axis = 'y') => (
  <ReferenceLine {...(axis === 'y' ? { y: 1 } : { x: 1 })} {...STYLE} />
);
