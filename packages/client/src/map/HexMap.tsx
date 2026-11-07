import { formatHex, hexLine, type Hex, type TerrainMap, type TerrainType } from '@dday/engine';
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import {
  fitView,
  hexAtScreenPoint,
  hexCentre,
  hexOutline,
  panView,
  zoomView,
  type Point,
  type View,
} from './geometry';

const LABEL_MIN_SCALE = 1;
const ZOOM_PER_WHEEL_PIXEL = 0.002;

interface HexMapProps {
  hexes: readonly Hex[];
  terrain: TerrainMap;
  /** Given, the left button paints and the other buttons pan. Otherwise any button pans. */
  onPaint?: (hexes: Hex[]) => void;
}

type Drag = { kind: 'pan'; last: Point } | { kind: 'paint'; last: Hex };

export function HexMap({ hexes, terrain, onPaint }: HexMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const [view, setView] = useState<View | null>(null);

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

  const labels = useMemo(
    () =>
      hexes.map((hex) => {
        const { x, y } = hexCentre(hex);
        const label = formatHex(hex);
        return (
          <text key={label} x={x} y={y}>
            {label}
          </text>
        );
      }),
    [hexes],
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

  const hexUnderPointer = (event: PointerEvent<SVGSVGElement>, currentView: View) => {
    const { left, top } = event.currentTarget.getBoundingClientRect();
    return hexAtScreenPoint(currentView, { x: event.clientX - left, y: event.clientY - top });
  };

  const startDrag = (event: PointerEvent<SVGSVGElement>) => {
    if (!view) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    if (onPaint && event.button === 0) {
      const hex = hexUnderPointer(event, view);
      dragRef.current = { kind: 'paint', last: hex };
      onPaint([hex]);
    } else {
      dragRef.current = { kind: 'pan', last: { x: event.clientX, y: event.clientY } };
    }
  };

  const drag = (event: PointerEvent<SVGSVGElement>) => {
    const current = dragRef.current;
    if (!current || !view) return;
    if (current.kind === 'paint') {
      const hex = hexUnderPointer(event, view);
      // A fast drag skips hexes between pointer events, so fill in the line between them.
      onPaint?.(hexLine(current.last, hex));
      dragRef.current = { kind: 'paint', last: hex };
    } else {
      const dx = event.clientX - current.last.x;
      const dy = event.clientY - current.last.y;
      dragRef.current = { kind: 'pan', last: { x: event.clientX, y: event.clientY } };
      setView(panView(view, dx, dy));
    }
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  return (
    <svg
      ref={svgRef}
      className="hex-map"
      onPointerDown={startDrag}
      onPointerMove={drag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onContextMenu={(event) => event.preventDefault()}
    >
      {view && (
        <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
          {outlines.map(({ type, path }) => (
            <path key={type} className={`hex-map-grid terrain-${type}`} d={path} />
          ))}
          {view.scale >= LABEL_MIN_SCALE && <g className="hex-map-labels">{labels}</g>}
        </g>
      )}
    </svg>
  );
}
