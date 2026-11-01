import { formatHex, type Hex } from '@dday/engine';
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import {
  fitView,
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
}

export function HexMap({ hexes }: HexMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<Point | null>(null);
  const [view, setView] = useState<View | null>(null);

  const outlines = useMemo(() => hexes.map(hexOutline).join(''), [hexes]);
  const labels = useMemo(
    () =>
      // Columns north of 1 have no numbers yet, so they stay unlabelled.
      hexes
        .filter((hex) => hex.n >= 1)
        .map((hex) => {
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

  const startDrag = (event: PointerEvent<SVGSVGElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY };
  };

  const drag = (event: PointerEvent<SVGSVGElement>) => {
    const last = dragRef.current;
    if (!last) return;
    const dx = event.clientX - last.x;
    const dy = event.clientY - last.y;
    dragRef.current = { x: event.clientX, y: event.clientY };
    setView((current) => current && panView(current, dx, dy));
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
    >
      {view && (
        <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
          <path className="hex-map-grid" d={outlines} />
          {view.scale >= LABEL_MIN_SCALE && <g className="hex-map-labels">{labels}</g>}
        </g>
      )}
    </svg>
  );
}
