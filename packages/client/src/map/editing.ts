import {
  formatHex,
  formatHexside,
  HEXSIDE_FEATURES,
  hexLine,
  isBoardHex,
  isBoardHexside,
  type Hex,
  type Hexside,
  type HexsideFeature,
  type HexsideMap,
  type TerrainMap,
  type TerrainType,
} from '@dday/engine';
import { hexAtPoint, hexsidesAlong, type Point } from './geometry';

export type TerrainTool = TerrainType | 'erase';
export type HexsideTool = HexsideFeature | 'erase-hexside';
export type PaintTool = TerrainTool | HexsideTool;

/** The parts of the map the editor changes. */
export interface EditableMap {
  readonly terrain: TerrainMap;
  readonly hexsides: HexsideMap;
}

export function isHexsideTool(tool: PaintTool): tool is HexsideTool {
  return tool === 'erase-hexside' || (HEXSIDE_FEATURES as readonly string[]).includes(tool);
}

/**
 * Sets or erases a value for each key, skipping keys that aren't allowed.
 * Returns the same object if nothing changed, so unsaved changes can be spotted by identity.
 */
function paint<T>(
  values: Readonly<Record<string, T>>,
  keys: readonly string[],
  value: T | null,
): Readonly<Record<string, T>> {
  const painted = { ...values };
  let changed = false;
  for (const key of keys) {
    if (value === null) {
      if (key in painted) {
        delete painted[key];
        changed = true;
      }
    } else if (painted[key] !== value) {
      painted[key] = value;
      changed = true;
    }
  }
  return changed ? painted : values;
}

/** Applies a terrain tool to some hexes, ignoring any off the board. */
export function paintHexes(
  terrain: TerrainMap,
  hexes: readonly Hex[],
  tool: TerrainTool,
): TerrainMap {
  const labels = hexes.filter(isBoardHex).map(formatHex);
  return paint(terrain, labels, tool === 'erase' ? null : tool);
}

/** Applies a hexside tool to some hexsides, ignoring any off the board. */
export function paintHexsides(
  hexsides: HexsideMap,
  sides: readonly Hexside[],
  tool: HexsideTool,
): HexsideMap {
  const labels = sides.filter(isBoardHexside).map(formatHexside);
  return paint(hexsides, labels, tool === 'erase-hexside' ? null : tool);
}

/**
 * Applies a tool along one step of a drag, from the pointer's last position (null at the
 * start of the drag) to where it is now, in map units. A fast drag skips past hexes and
 * hexsides between pointer events, so everything on the line between them is painted.
 */
export function paintStroke(
  map: EditableMap,
  from: Point | null,
  to: Point,
  tool: PaintTool,
): EditableMap {
  if (isHexsideTool(tool)) {
    const hexsides = paintHexsides(map.hexsides, hexsidesAlong(from ?? to, to), tool);
    return hexsides === map.hexsides ? map : { ...map, hexsides };
  }
  const hexes = from ? hexLine(hexAtPoint(from), hexAtPoint(to)) : [hexAtPoint(to)];
  const terrain = paintHexes(map.terrain, hexes, tool);
  return terrain === map.terrain ? map : { ...map, terrain };
}
