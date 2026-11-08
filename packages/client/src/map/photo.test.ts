import { describe, expect, it } from 'vitest';
import { mapToPhoto, photoToMap, placementFromPins, placementMatrix } from './photo';

describe('pinning a photo', () => {
  it('puts both pinned photo points on their map points', () => {
    const first = { photo: { x: 100, y: 200 }, map: { x: -40, y: 300 } };
    const second = { photo: { x: 900, y: 650 }, map: { x: 260, y: 20 } };
    const placement = placementFromPins(first, second);
    expect(placement).not.toBeNull();
    if (!placement) return;
    for (const pin of [first, second]) {
      const placed = photoToMap(placement, pin.photo);
      expect(placed.x).toBeCloseTo(pin.map.x);
      expect(placed.y).toBeCloseTo(pin.map.y);
    }
  });

  it('turns map points back into photo points', () => {
    const placement = { scale: { x: 0.3, y: -0.2 }, offset: { x: 15, y: -7 } };
    const point = { x: 123, y: 456 };
    const back = mapToPhoto(placement, photoToMap(placement, point));
    expect(back.x).toBeCloseTo(point.x);
    expect(back.y).toBeCloseTo(point.y);
  });

  it('needs two different photo points', () => {
    const pin = { photo: { x: 1, y: 1 }, map: { x: 0, y: 0 } };
    expect(placementFromPins(pin, { ...pin, map: { x: 5, y: 5 } })).toBeNull();
  });

  it('writes an SVG matrix that places pixels where photoToMap does', () => {
    const placement = { scale: { x: 0.5, y: 0.25 }, offset: { x: 10, y: 20 } };
    const [a, b, c, d, e, f] = (placementMatrix(placement).match(/-?[\d.]+/g) ?? []).map(Number);
    const point = { x: 8, y: -4 };
    const placed = photoToMap(placement, point);
    expect((a ?? 0) * point.x + (c ?? 0) * point.y + (e ?? 0)).toBeCloseTo(placed.x);
    expect((b ?? 0) * point.x + (d ?? 0) * point.y + (f ?? 0)).toBeCloseTo(placed.y);
  });
});
