import type { Point } from './geometry';

/**
 * Where a board photo sits on the map: a photo pixel `p` lands at `scale × p + offset`, where
 * `scale` is a complex number, so it rotates as well as scales. Two pinned points fix it.
 */
export interface PhotoPlacement {
  readonly scale: Point;
  readonly offset: Point;
}

/** A point on the photo, in its pixels, and the map point it belongs at. */
export interface PhotoPin {
  readonly photo: Point;
  readonly map: Point;
}

function multiply(a: Point, b: Point): Point {
  return { x: a.x * b.x - a.y * b.y, y: a.x * b.y + a.y * b.x };
}

function divide(a: Point, b: Point): Point {
  const size = b.x * b.x + b.y * b.y;
  return { x: (a.x * b.x + a.y * b.y) / size, y: (a.y * b.x - a.x * b.y) / size };
}

function subtract(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function photoToMap({ scale, offset }: PhotoPlacement, point: Point): Point {
  const scaled = multiply(scale, point);
  return { x: scaled.x + offset.x, y: scaled.y + offset.y };
}

export function mapToPhoto({ scale, offset }: PhotoPlacement, point: Point): Point {
  return divide(subtract(point, offset), scale);
}

/** The placement that puts both pins' photo points on their map points. Null if they coincide. */
export function placementFromPins(first: PhotoPin, second: PhotoPin): PhotoPlacement | null {
  const photoSpan = subtract(second.photo, first.photo);
  if (Math.hypot(photoSpan.x, photoSpan.y) < 1e-9) return null;
  const scale = divide(subtract(second.map, first.map), photoSpan);
  return { scale, offset: subtract(first.map, multiply(scale, first.photo)) };
}

/** Puts a photo of the given size over a map area, upright, before any pins are placed. */
export function fitPhoto(
  photo: { width: number; height: number },
  area: { left: number; top: number; width: number },
): PhotoPlacement {
  return { scale: { x: area.width / photo.width, y: 0 }, offset: { x: area.left, y: area.top } };
}

/** The SVG transform for a placement. */
export function placementMatrix({ scale, offset }: PhotoPlacement): string {
  return `matrix(${scale.x} ${scale.y} ${-scale.y} ${scale.x} ${offset.x} ${offset.y})`;
}

const STORAGE_PREFIX = 'dday-photo-placement:';

/** The placement last used for a photo in this browser, if any. */
export function loadPlacement(name: string): PhotoPlacement | null {
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + name);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as PhotoPlacement;
    const numbers = [parsed.scale.x, parsed.scale.y, parsed.offset.x, parsed.offset.y];
    return numbers.every(Number.isFinite) ? parsed : null;
  } catch {
    return null;
  }
}

/** Forgets a photo's placement, so it starts unpinned next time. */
export function forgetPlacement(name: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + name);
  } catch {
    // Nothing to forget if storage is unavailable.
  }
}

export function savePlacement(name: string, placement: PhotoPlacement): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + name, JSON.stringify(placement));
  } catch {
    // Storage can be unavailable; the photo just has to be pinned again next time.
  }
}
