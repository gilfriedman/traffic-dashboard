import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { NetworkGraphData } from '../../lib/types';

const NODE_COLORS = {
  interior: '#00BFFF',
  perimeter: '#FF8C00',
  exterior: '#999999',
} as const;

const EXIT_COLOR = '#32CD32';
const BOUNDARY_COLOR = '#EF4444';
const EDGE_COLOR = '#AAAAAA';

const ESRI_IMAGERY_BASE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export';
const ESRI_LABELS_BASE = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/export';

interface Props {
  data: NetworkGraphData;
  width?: number;
  height?: number;
  compact?: boolean;
  showAerial?: boolean;
  showStreetNames?: boolean;
}

function toMercator(lng: number, lat: number): [number, number] {
  const x = lng * 20037508.34 / 180;
  const y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
  return [x, y * 20037508.34 / 180];
}

interface ProjectionResult {
  project: (lng: number, lat: number) => [number, number];
  mercatorBbox: { minX: number; maxX: number; minY: number; maxY: number };
}

function createProjection(
  allLngs: number[],
  allLats: number[],
  width: number,
  height: number,
  padding: number
): ProjectionResult {
  const mercPoints = allLngs.map((lng, index) => toMercator(lng, allLats[index]));
  const xs = mercPoints.map((point) => point[0]);
  const ys = mercPoints.map((point) => point[1]);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const scaleX = (width - 2 * padding) / rangeX;
  const scaleY = (height - 2 * padding) / rangeY;
  const scale = Math.min(scaleX, scaleY);

  const offsetX = padding + ((width - 2 * padding) - rangeX * scale) / 2;
  const offsetY = padding + ((height - 2 * padding) - rangeY * scale) / 2;

  const project = (lng: number, lat: number): [number, number] => {
    const [mx, my] = toMercator(lng, lat);
    return [
      offsetX + (mx - minX) * scale,
      height - offsetY - (my - minY) * scale,
    ];
  };

  return { project, mercatorBbox: { minX, maxX, minY, maxY } };
}

interface LabelPosition {
  x: number;
  y: number;
  text: string;
}

function spreadLabels(labels: LabelPosition[], charWidth: number, lineHeight: number): LabelPosition[] {
  const result = labels.map((label) => ({ ...label }));
  for (let pass = 0; pass < 10; pass++) {
    let moved = false;
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const dy = Math.abs(result[i].y - result[j].y);
        const overlapW = (result[i].text.length + result[j].text.length) * charWidth * 0.5;
        const dx = Math.abs(result[i].x - result[j].x);
        if (dy < lineHeight && dx < overlapW) {
          result[i].y -= lineHeight * 0.6;
          result[j].y += lineHeight * 0.6;
          moved = true;
        }
      }
    }
    if (!moved) break;
  }
  return result;
}

function ExitLabels({
  exits,
  project,
  isHebrew,
}: {
  exits: NetworkGraphData['exits'];
  project: (lng: number, lat: number) => [number, number];
  isHebrew: boolean;
}) {
  const labels = useMemo(() => {
    const raw: LabelPosition[] = [];
    let unnamedCount = 0;
    for (const exit of exits) {
      let name = exit.street_name;
      if (!name || name === 'unnamed') {
        unnamedCount++;
        name = `unnamed #${unnamedCount}`;
      }
      const [x, y] = project(exit.to_coords[1], exit.to_coords[0]);
      raw.push({ x, y: y - 10, text: name });
    }
    return spreadLabels(raw, 4.5, 10);
  }, [exits, project]);

  return (
    <>
      {labels.map((label, index) => (
        <text
          key={`lbl-${index}`}
          x={label.x}
          y={label.y}
          textAnchor="middle"
          fontSize={7}
          fontWeight="600"
          fill="#1e293b"
          stroke="white"
          strokeWidth={2}
          paintOrder="stroke"
          direction={isHebrew ? 'rtl' : 'ltr'}
        >
          {label.text}
        </text>
      ))}
    </>
  );
}

interface CachedImage {
  status: 'loading' | 'loaded' | 'error';
  blobUrl?: string;
}

const imageCache = new Map<string, CachedImage>();

function useImageWithCache(url: string | null): { status: 'loading' | 'loaded' | 'error'; href: string | null } {
  const cached = url ? imageCache.get(url) : undefined;
  const [entry, setEntry] = useState<CachedImage>(cached ?? { status: 'loading' });

  useEffect(() => {
    if (!url) { setEntry({ status: 'loading' }); return; }
    const existing = imageCache.get(url);
    if (existing && existing.status !== 'loading') {
      setEntry(existing);
      return;
    }
    setEntry({ status: 'loading' });
    imageCache.set(url, { status: 'loading' });
    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const result: CachedImage = { status: 'loaded', blobUrl };
        imageCache.set(url, result);
        setEntry(result);
      })
      .catch(() => {
        const result: CachedImage = { status: 'error' };
        imageCache.set(url, result);
        setEntry(result);
      });
  }, [url]);

  return url ? { status: entry.status, href: entry.blobUrl ?? null } : { status: 'loading', href: null };
}

export function NetworkGraph({ data, width = 500, height = 500, compact = false, showAerial = false, showStreetNames = false }: Props) {
  const { t, i18n } = useTranslation();
  const isHebrew = i18n.language === 'he';
  const displayName = isHebrew ? data.name_he : data.name_en;

  const { project, mercatorBbox } = useMemo(() => {
    const lngs: number[] = [];
    const lats: number[] = [];

    for (const node of data.nodes) {
      lngs.push(node.lng);
      lats.push(node.lat);
    }
    for (const coord of data.boundary) {
      lngs.push(coord[0]);
      lats.push(coord[1]);
    }

    return createProjection(lngs, lats, width, height, compact ? 20 : 30);
  }, [data.nodes, data.boundary, width, height, compact]);

  const aerialPad = 500;
  const aerialUrl = useMemo(() => {
    if (!showAerial) return null;
    const params = new URLSearchParams({
      bbox: `${mercatorBbox.minX - aerialPad},${mercatorBbox.minY - aerialPad},${mercatorBbox.maxX + aerialPad},${mercatorBbox.maxY + aerialPad}`,
      bboxSR: '3857',
      imageSR: '3857',
      size: `${width * 2},${height * 2}`,
      format: 'png',
      f: 'image',
    });
    return `${ESRI_IMAGERY_BASE}?${params}`;
  }, [showAerial, mercatorBbox, width, height]);

  const labelsUrl = useMemo(() => {
    if (!showStreetNames) return null;
    const params = new URLSearchParams({
      bbox: `${mercatorBbox.minX - aerialPad},${mercatorBbox.minY - aerialPad},${mercatorBbox.maxX + aerialPad},${mercatorBbox.maxY + aerialPad}`,
      bboxSR: '3857',
      imageSR: '3857',
      size: `${width * 2},${height * 2}`,
      format: 'png32',
      transparent: 'true',
      f: 'image',
    });
    return `${ESRI_LABELS_BASE}?${params}`;
  }, [showStreetNames, mercatorBbox, width, height]);

  const aerial = useImageWithCache(aerialUrl);
  const labels = useImageWithCache(labelsUrl);

  const overlayCoords = useMemo(() => {
    if (!showAerial && !showStreetNames) return null;
    const fakeMinLng = (mercatorBbox.minX - aerialPad) * 180 / 20037508.34;
    const fakeMaxLng = (mercatorBbox.maxX + aerialPad) * 180 / 20037508.34;
    const fakeMinLat = (Math.atan(Math.exp((mercatorBbox.minY - aerialPad) / 20037508.34 * Math.PI)) * 360 / Math.PI) - 90;
    const fakeMaxLat = (Math.atan(Math.exp((mercatorBbox.maxY + aerialPad) / 20037508.34 * Math.PI)) * 360 / Math.PI) - 90;
    const [x1, y1] = project(fakeMinLng, fakeMaxLat);
    const [x2, y2] = project(fakeMaxLng, fakeMinLat);
    return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
  }, [showAerial, showStreetNames, mercatorBbox, project]);

  const boundaryPoints = useMemo(
    () => data.boundary.map((coord) => project(coord[0], coord[1]).join(',')).join(' '),
    [data.boundary, project]
  );

  const nodeSize = compact ? { interior: 1.8, perimeter: 3, exterior: 1.2 } : { interior: 2.5, perimeter: 4, exterior: 1.5 };
  const edgeWidth = compact ? 0.3 : 0.5;
  const edgeColor = showAerial ? '#DDDDDD' : EDGE_COLOR;
  const exitArrowWidth = compact ? 1 : 1.5;
  const titleSize = compact ? 10 : 12;
  const arrowId = `arrow-${data.neighborhood_key}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="bg-white w-full h-auto">
      <defs>
        <marker
          id={arrowId}
          markerWidth="5"
          markerHeight="4"
          refX="5"
          refY="2"
          orient="auto"
        >
          <polygon points="0,0 5,2 0,4" fill={EXIT_COLOR} />
        </marker>
      </defs>

      {showAerial && overlayCoords && (
        <>
          {aerial.status === 'loading' && (
            <text x={width / 2} y={height / 2} textAnchor="middle" fontSize={10} fill="#94a3b8">
              {t('common.loading')}
            </text>
          )}
          {aerial.status === 'loaded' && aerial.href && (
            <image
              href={aerial.href}
              x={overlayCoords.x}
              y={overlayCoords.y}
              width={overlayCoords.width}
              height={overlayCoords.height}
              preserveAspectRatio="none"
            />
          )}
        </>
      )}

      {showStreetNames && overlayCoords && labels.status === 'loaded' && labels.href && (
        <image
          href={labels.href}
          x={overlayCoords.x}
          y={overlayCoords.y}
          width={overlayCoords.width}
          height={overlayCoords.height}
          preserveAspectRatio="none"
        />
      )}

      {data.edges.filter((edge) => !edge.is_exit_edge).map((edge, index) => {
        const [x1, y1] = project(edge.from_lng, edge.from_lat);
        const [x2, y2] = project(edge.to_lng, edge.to_lat);
        return (
          <line
            key={`e-${index}`}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={edgeColor}
            strokeWidth={edgeWidth}
          />
        );
      })}

      <polygon
        points={boundaryPoints}
        fill="none"
        stroke={BOUNDARY_COLOR}
        strokeWidth={compact ? 1.5 : 2}
      />

      {data.exits.map((exit, index) => {
        const [x1, y1] = project(exit.from_coords[1], exit.from_coords[0]);
        const [x2, y2] = project(exit.to_coords[1], exit.to_coords[0]);
        return (
          <line
            key={`ex-${index}`}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={EXIT_COLOR}
            strokeWidth={exitArrowWidth}
            markerEnd={`url(#${arrowId})`}
          />
        );
      })}

      {data.nodes.map((node, index) => {
        const [cx, cy] = project(node.lng, node.lat);
        return (
          <circle
            key={`n-${index}`}
            cx={cx} cy={cy}
            r={nodeSize[node.classification]}
            fill={NODE_COLORS[node.classification]}
          />
        );
      })}

      {!compact && <ExitLabels exits={data.exits} project={project} isHebrew={isHebrew} />}

      {!compact && (
        <>
          <text x={width / 2} y={20} textAnchor="middle" fontSize={titleSize} fontWeight="bold" fill="#1e293b"
            stroke="white" strokeWidth={showAerial ? 3 : 0} paintOrder="stroke"
          >
            {displayName} — {data.exit_count} {t('network.exits')}
          </text>

          <g transform={`translate(${width - 55}, ${height - 42})`}>
            <rect x={-5} y={-5} width={58} height={40} rx={2} fill="white" fillOpacity={0.92} stroke="#e2e8f0" strokeWidth={0.4} />
            {([
              ['interior', t('nodeClassification.interior.label'), NODE_COLORS.interior],
              ['perimeter', t('nodeClassification.perimeter.label'), NODE_COLORS.perimeter],
              ['exterior', t('nodeClassification.exterior.label'), NODE_COLORS.exterior],
              ['exits', t('network.exits'), EXIT_COLOR],
            ] as const).map(([key, label, color], index) => (
              <g key={key} transform={`translate(0, ${index * 8.5})`}>
                <circle cx={3} cy={3} r={1.8} fill={color} />
                <text x={8} y={4.5} textAnchor="start" direction="ltr" fontSize={5} fill="#475569">{label}</text>
              </g>
            ))}
          </g>
        </>
      )}
    </svg>
  );
}
