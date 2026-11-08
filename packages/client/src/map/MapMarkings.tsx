import {
  DIRECTIONS,
  INVASION_AREAS,
  neighbour,
  parseHex,
  hexsideOf,
  formatHex,
  type Hex,
} from '@dday/engine';
import { memo, useMemo } from 'react';
import type { EditableMap } from './editing';
import { HEX_SIZE, hexCentre, hexOutline, hexsidePath, type Point } from './geometry';

interface MapMarkingsProps {
  map: EditableMap;
  /** An arrow being dragged out, from a hex centre to the pointer. */
  pendingArrow?: { from: Point; to: Point } | null;
  /** Hexes to pick out, such as those a validation issue names. */
  highlight?: readonly string[];
}

// Arrows start a little way out from the number and stop short of the target's centre.
const ARROW_START = HEX_SIZE * 0.45;
const ARROW_END = HEX_SIZE * 0.55;

function arrowPath(from: Point, to: Point): string {
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  if (length <= ARROW_START + ARROW_END) return '';
  const ux = (to.x - from.x) / length;
  const uy = (to.y - from.y) / length;
  return `M${from.x + ux * ARROW_START} ${from.y + uy * ARROW_START}L${to.x - ux * ARROW_END} ${to.y - uy * ARROW_END}`;
}

/** The hexsides around the outside of a set of hexes. */
function borderPath(labels: readonly string[]): string {
  const inside = new Set(labels);
  const paths: string[] = [];
  for (const label of labels) {
    const hex = parseHex(label);
    for (const direction of DIRECTIONS) {
      if (!inside.has(formatHexSafe(neighbour(hex, direction)))) {
        paths.push(hexsidePath(hexsideOf(hex, direction)));
      }
    }
  }
  return paths.join('');
}

/** Off-board neighbours can have no label; they're never inside an area. */
function formatHexSafe(hex: Hex): string {
  try {
    return formatHex(hex);
  } catch {
    return '';
  }
}

function centroid(labels: readonly string[]): Point {
  const centres = labels.map((label) => hexCentre(parseHex(label)));
  return {
    x: centres.reduce((sum, { x }) => sum + x, 0) / centres.length,
    y: centres.reduce((sum, { y }) => sum + y, 0) / centres.length,
  };
}

/** Stars, red numbers and arrows, port letters and invasion area borders, as the board prints them. */
export const MapMarkings = memo(function MapMarkings({
  map,
  pendingArrow,
  highlight,
}: MapMarkingsProps) {
  const areas = useMemo(
    () =>
      INVASION_AREAS.flatMap((area) => {
        const hexes = map.invasionAreas[area] ?? [];
        if (hexes.length === 0) return [];
        return [{ area, border: borderPath(hexes), centre: centroid(hexes) }];
      }),
    [map.invasionAreas],
  );

  const letters = useMemo(() => {
    const byHex = new Map<string, string>();
    for (const name of Object.keys(map.ports).sort()) {
      const port = map.ports[name];
      if (!port) continue;
      for (const label of port.hexes) byHex.set(label, (byHex.get(label) ?? '') + port.letter);
    }
    return [...byHex];
  }, [map.ports]);

  return (
    <g className="map-markings">
      {areas.map(({ area, border, centre }) => (
        <g key={area}>
          <path className="area-border" d={border} />
          <text className="area-name" x={centre.x} y={centre.y}>
            {area}
          </text>
        </g>
      ))}
      {map.stars.map((label) => {
        const { x, y } = hexCentre(parseHex(label));
        return (
          <text key={label} className="hex-star" x={x} y={y - HEX_SIZE * 0.45}>
            ★
          </text>
        );
      })}
      {letters.map(([label, text]) => {
        const { x, y } = hexCentre(parseHex(label));
        return (
          <text key={label} className="port-letters" x={x} y={y + HEX_SIZE * 0.5}>
            {text}
          </text>
        );
      })}
      {Object.entries(map.supply).map(([from, arrow]) => {
        const start = hexCentre(parseHex(from));
        const end = hexCentre(parseHex(arrow.to));
        const numberY = start.y - HEX_SIZE * 0.42;
        const width = 4 + 4.2 * String(arrow.capacity).length;
        return (
          <g key={from} className="supply">
            <path className="supply-arrow" d={arrowPath(start, end)} markerEnd="url(#arrowhead)" />
            {arrow.boxed && (
              <rect
                className="supply-box"
                x={start.x - width / 2}
                y={numberY - 4.5}
                width={width}
                height={9}
              />
            )}
            <text className="supply-number" x={start.x} y={numberY}>
              {arrow.capacity}
            </text>
          </g>
        );
      })}
      {pendingArrow && (
        <path
          className="supply-arrow pending"
          d={arrowPath(pendingArrow.from, pendingArrow.to)}
          markerEnd="url(#arrowhead)"
        />
      )}
      {highlight && highlight.length > 0 && (
        <path
          className="hex-highlight"
          d={highlight.map((label) => hexOutline(parseHex(label))).join('')}
        />
      )}
    </g>
  );
});

/** The arrowhead the supply arrows use. Goes in the SVG's <defs>. */
export function ArrowheadMarker() {
  return (
    <marker
      id="arrowhead"
      viewBox="0 0 10 10"
      refX="8"
      refY="5"
      markerWidth="5"
      markerHeight="5"
      orient="auto-start-reverse"
    >
      <path d="M0 0L10 5L0 10Z" className="arrowhead" />
    </marker>
  );
}
