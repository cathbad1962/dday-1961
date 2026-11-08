import {
  formatHex,
  parseHexside,
  type Hex,
  type HexsideFeature,
  type HexsideMap,
  type TerrainMap,
  type TerrainType,
} from '@dday/engine';
import { useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import {
  fitView,
  hexCentre,
  hexOutline,
  hexsidePath,
  panView,
  screenToMap,
  zoomView,
  type Point,
  type View,
} from './geometry';
import { ArrowheadMarker } from './MapMarkings';

const LABEL_MIN_SCALE = 1;
const ZOOM_PER_WHEEL_PIXEL = 0.002;

/** Label colour for each terrain fill. Unpainted and unprinted hexes keep the faint default. */
const LABEL_TONES: Record<TerrainType, 'on-light' | 'on-dark' | undefined> = {
  clear: 'on-light',
  sea: 'on-light',
  city: 'on-light',
  fortified: 'on-light',
  neutral: 'on-light',
  fortress: 'on-dark',
  mountain: 'on-dark',
  impassable: 'on-dark',
  none: undefined,
};

interface HexMapProps {
  hexes: readonly Hex[];
  terrain: TerrainMap;
  hexsides: HexsideMap;
  /**
   * Given, the left button paints and the other buttons pan. Otherwise any button pans.
   * Called for each step of a paint drag with the pointer's last position (null at the start)
   * and its new one, in map units.
   */
  onPaint?: (from: Point | null, to: Point) => void;
  /** Called when a paint drag ends, with the pointer's last position. */
  onPaintEnd?: (at: Point) => void;
  /** Drawn over the terrain and under everything else, such as a board photo. */
  underlay?: ReactNode;
  /** Drawn over the hexsides and under the labels, such as the board's markings. */
  overlay?: ReactNode;
  /** When this changes, the view moves to centre the hex, zooming in if needed. */
  focus?: Hex | null;
}

type Drag = { kind: 'pan'; last: Point } | { kind: 'paint'; last: Point };

const FOCUS_MIN_SCALE = 2;

export function HexMap({
  hexes,
  terrain,
  hexsides,
  onPaint,
  onPaintEnd,
  underlay,
  overlay,
  focus,
}: HexMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const [view, setView] = useState<View | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!focus || !svg) return;
    const { width, height } = svg.getBoundingClientRect();
    const { x, y } = hexCentre(focus);
    setView((current) => {
      const scale = Math.max(current?.scale ?? 0, FOCUS_MIN_SCALE);
      return { scale, x: width / 2 - x * scale, y: height / 2 - y * scale };
    });
  }, [focus]);

  const outlines = useMemo(() => {
    const byTerrain = new Map<TerrainType | 'unpainted', string[]>();
    for (const hex of hexes) {
      const type = terrain[formatHex(hex)] ?? 'unpainted';
      const group = byTerrain.get(type);
      if (group) group.push(hexOutline(hex));
      else byTerrain.set(type, [hexOutline(hex)]);
    }
    return [...byTerrain].map(([type, paths]) => ({ type, path: paths.join('') }));
  }, [hexes, terrain]);

  const hexsideLines = useMemo(() => {
    const byFeature = new Map<HexsideFeature, string[]>();
    for (const [label, feature] of Object.entries(hexsides)) {
      const path = hexsidePath(parseHexside(label));
      const group = byFeature.get(feature);
      if (group) group.push(path);
      else byFeature.set(feature, [path]);
    }
    return [...byFeature].map(([feature, paths]) => ({ feature, path: paths.join('') }));
  }, [hexsides]);

  const labels = useMemo(
    () =>
      hexes.map((hex) => {
        const { x, y } = hexCentre(hex);
        const label = formatHex(hex);
        const type = terrain[label];
        return (
          <text key={label} x={x} y={y} className={type && LABEL_TONES[type]}>
            {label}
          </text>
        );
      }),
    [hexes, terrain],
  );

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const { width, height } = svg.getBoundingClientRect();
    setView(fitView(hexes, { width, height }));

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const { left, top } = svg.getBoundingClientRect();
      const anchor = { x: event.clientX - left, y: event.clientY - top };
      const factor = Math.exp(-event.deltaY * ZOOM_PER_WHEEL_PIXEL);
      setView((current) => current && zoomView(current, factor, anchor));
    };
    // React's own wheel listener is passive, so it can't stop the page scrolling.
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [hexes]);

  const pointerOnMap = (event: PointerEvent<SVGSVGElement>, currentView: View) => {
    const { left, top } = event.currentTarget.getBoundingClientRect();
    return screenToMap(currentView, { x: event.clientX - left, y: event.clientY - top });
  };

  const startDrag = (event: PointerEvent<SVGSVGElement>) => {
    if (!view) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    if (onPaint && event.button === 0) {
      const point = pointerOnMap(event, view);
      dragRef.current = { kind: 'paint', last: point };
      onPaint(null, point);
    } else {
      dragRef.current = { kind: 'pan', last: { x: event.clientX, y: event.clientY } };
    }
  };

  const drag = (event: PointerEvent<SVGSVGElement>) => {
    const current = dragRef.current;
    if (!current || !view) return;
    if (current.kind === 'paint') {
      const point = pointerOnMap(event, view);
      onPaint?.(current.last, point);
      dragRef.current = { kind: 'paint', last: point };
    } else {
      const dx = event.clientX - current.last.x;
      const dy = event.clientY - current.last.y;
      dragRef.current = { kind: 'pan', last: { x: event.clientX, y: event.clientY } };
      setView(panView(view, dx, dy));
    }
  };

  const endDrag = (event: PointerEvent<SVGSVGElement>) => {
    const current = dragRef.current;
    dragRef.current = null;
    if (current?.kind === 'paint' && view) onPaintEnd?.(pointerOnMap(event, view));
  };

  const cancelDrag = () => {
    dragRef.current = null;
  };

  return (
    <svg
      ref={svgRef}
      className="hex-map"
      onPointerDown={startDrag}
      onPointerMove={drag}
      onPointerUp={endDrag}
      onPointerCancel={cancelDrag}
      onContextMenu={(event) => event.preventDefault()}
    >
      <defs>
        <ArrowheadMarker />
      </defs>
      {view && (
        <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
          {outlines.map(({ type, path }) => (
            <path key={type} className={`hex-map-grid terrain-${type}`} d={path} />
          ))}
          {underlay}
          {hexsideLines.map(({ feature, path }) => (
            <path key={feature} className={`hex-map-hexside hexside-${feature}`} d={path} />
          ))}
          {overlay}
          {view.scale >= LABEL_MIN_SCALE && <g className="hex-map-labels">{labels}</g>}
        </g>
      )}
    </svg>
  );
}
