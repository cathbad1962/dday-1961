import { roundHex, type Hex } from '@dday/engine';

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

/** The hex under a point on the screen, measured from the map's top-left corner. */
export function hexAtScreenPoint(view: View, { x, y }: Point): Hex {
  const n = (x - view.x) / view.scale / (1.5 * HEX_SIZE);
  const l = -(y - view.y) / view.scale / (Math.sqrt(3) * HEX_SIZE) - n / 2;
  return roundHex(l, n);
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
