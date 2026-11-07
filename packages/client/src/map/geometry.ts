import {
  DIRECTIONS,
  formatHexside,
  hexsideOf,
  roundHex,
  type Hex,
  type Hexside,
} from '@dday/engine';

/** Centre-to-corner size of a hex, in map units. */
export const HEX_SIZE = 20;

const MIN_SCALE = 0.2;
const MAX_SCALE = 8;
const FIT_MARGIN = 0.97;

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** Screen position of the map: map units are scaled, then shifted by `x` and `y` pixels. */
export interface View extends Point {
  readonly scale: number;
}

export interface Size {
  readonly width: number;
  readonly height: number;
}

/** Numbers grow to the right; letters grow upward, half a hex higher per column. */
export function hexCentre({ l, n }: Hex): Point {
  return {
    x: 1.5 * HEX_SIZE * n,
    y: -Math.sqrt(3) * HEX_SIZE * (l + n / 2),
  };
}

/** Converts a point on the screen, measured from the map's top-left corner, to map units. */
export function screenToMap(view: View, { x, y }: Point): Point {
  return { x: (x - view.x) / view.scale, y: (y - view.y) / view.scale };
}

/** The hex containing a point in map units. */
export function hexAtPoint({ x, y }: Point): Hex {
  const n = x / (1.5 * HEX_SIZE);
  const l = -y / (Math.sqrt(3) * HEX_SIZE) - n / 2;
  return roundHex(l, n);
}

/** A hexside's midpoint, and unit vectors along it and across it (towards `to`). */
function hexsideFrame({ from, to }: Hexside): { middle: Point; along: Point; across: Point } {
  const a = hexCentre(from);
  const b = hexCentre(to);
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const across = { x: (b.x - a.x) / length, y: (b.y - a.y) / length };
  return {
    middle: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    along: { x: -across.y, y: across.x },
    across,
  };
}

// A point is on a hexside if it's this close to the edge, measured across it...
const HEXSIDE_REACH_ACROSS = HEX_SIZE * 0.3;
// ...and no nearer a corner than this. All three edges meeting at a corner are equally close
// to it, so near a corner there's no telling which one is meant.
const HEXSIDE_REACH_ALONG = HEX_SIZE * 0.4;

/** The hexside a point is on, or null if it's in the middle of a hex or near a corner. */
export function hexsideAtPoint(point: Point): Hexside | null {
  const hex = hexAtPoint(point);
  let nearest: Hexside | null = null;
  let nearestDistance = HEXSIDE_REACH_ACROSS;
  for (const direction of DIRECTIONS) {
    const side = hexsideOf(hex, direction);
    const { middle, along, across } = hexsideFrame(side);
    const dx = point.x - middle.x;
    const dy = point.y - middle.y;
    const distanceAlong = Math.abs(dx * along.x + dy * along.y);
    const distanceAcross = Math.abs(dx * across.x + dy * across.y);
    if (distanceAlong <= HEXSIDE_REACH_ALONG && distanceAcross <= nearestDistance) {
      nearest = side;
      nearestDistance = distanceAcross;
    }
  }
  return nearest;
}

const HEXSIDE_SAMPLE_STEP = HEX_SIZE / 8;

/** The hexsides a pointer passes over moving in a straight line, in order, without repeats. */
export function hexsidesAlong(from: Point, to: Point): Hexside[] {
  const steps = Math.max(
    1,
    Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / HEXSIDE_SAMPLE_STEP),
  );
  const found = new Map<string, Hexside>();
  for (let step = 0; step <= steps; step++) {
    const t = step / steps;
    const side = hexsideAtPoint({
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
    });
    if (side) found.set(formatHexside(side), side);
  }
  return [...found.values()];
}

/** The line along a hexside, between its two corners. */
export function hexsidePath(side: Hexside): string {
  // The edge is one hex size long, centred on its midpoint.
  const { middle, along } = hexsideFrame(side);
  const dx = along.x * (HEX_SIZE / 2);
  const dy = along.y * (HEX_SIZE / 2);
  return `M${middle.x - dx} ${middle.y - dy}L${middle.x + dx} ${middle.y + dy}`;
}

export function hexOutline(hex: Hex): string {
  const { x, y } = hexCentre(hex);
  const halfHeight = (Math.sqrt(3) / 2) * HEX_SIZE;
  const corners = [
    [x + HEX_SIZE, y],
    [x + HEX_SIZE / 2, y + halfHeight],
    [x - HEX_SIZE / 2, y + halfHeight],
    [x - HEX_SIZE, y],
    [x - HEX_SIZE / 2, y - halfHeight],
    [x + HEX_SIZE / 2, y - halfHeight],
  ];
  return `M${corners.map(([cx, cy]) => `${cx} ${cy}`).join('L')}Z`;
}

/** The view that shows every hex, centred in a viewport of the given size. */
export function fitView(hexes: readonly Hex[], viewport: Size): View {
  const centres = hexes.map(hexCentre);
  const left = Math.min(...centres.map(({ x }) => x)) - HEX_SIZE;
  const right = Math.max(...centres.map(({ x }) => x)) + HEX_SIZE;
  const top = Math.min(...centres.map(({ y }) => y)) - HEX_SIZE;
  const bottom = Math.max(...centres.map(({ y }) => y)) + HEX_SIZE;
  const scale =
    FIT_MARGIN * Math.min(viewport.width / (right - left), viewport.height / (bottom - top));
  return {
    scale,
    x: (viewport.width - (left + right) * scale) / 2,
    y: (viewport.height - (top + bottom) * scale) / 2,
  };
}

export function panView(view: View, dx: number, dy: number): View {
  return { ...view, x: view.x + dx, y: view.y + dy };
}

/** Zooms by `factor`, keeping the map point under `anchor` where it is on screen. */
export function zoomView(view: View, factor: number, anchor: Point): View {
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, view.scale * factor));
  const applied = scale / view.scale;
  return {
    scale,
    x: anchor.x - (anchor.x - view.x) * applied,
    y: anchor.y - (anchor.y - view.y) * applied,
  };
}
