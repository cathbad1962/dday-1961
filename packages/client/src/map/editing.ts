import {
  formatHex,
  formatHexside,
  HEXSIDE_FEATURES,
  hexLine,
  INVASION_AREAS,
  isBoardHex,
  isBoardHexside,
  type Hex,
  type Hexside,
  type HexsideFeature,
  type HexsideMap,
  type InvasionArea,
  type MapData,
  type SupplyArrow,
  type TerrainMap,
  type TerrainType,
} from '@dday/engine';
import { hexAtPoint, hexsidesAlong, type Point } from './geometry';

export type TerrainTool = TerrainType | 'erase';
export type HexsideTool = HexsideFeature | 'erase-hexside';
/**
 * Star, area and port tools add hexes, or take them away if the drag starts on a hex that
 * already has them. The supply tool drags an arrow from the number's hex to where it points.
 */
export type MarkingTool = 'star' | 'area' | 'port' | 'supply' | 'erase-supply';
export type PaintTool = TerrainTool | HexsideTool | MarkingTool;

/** The parts of the map the editor changes. */
export type EditableMap = Omit<MapData, 'version'>;

/** What a marking tool works on, chosen in the palette. */
export interface MarkingOptions {
  readonly area: InvasionArea;
  readonly port: string | null;
}

export function isHexsideTool(tool: PaintTool): tool is HexsideTool {
  return tool === 'erase-hexside' || (HEXSIDE_FEATURES as readonly string[]).includes(tool);
}

export function isMarkingTool(tool: PaintTool): tool is MarkingTool {
  return ['star', 'area', 'port', 'supply', 'erase-supply'].includes(tool);
}

/**
 * Sets or erases a value for each key.
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

/** Adds or removes labels from a list. Returns the same list if nothing changed. */
function toggle(
  list: readonly string[],
  labels: readonly string[],
  adding: boolean,
): readonly string[] {
  const present = new Set(list);
  const changed = labels.filter((label) => present.has(label) !== adding);
  if (changed.length === 0) return list;
  if (adding) return [...list, ...new Set(changed)];
  const removed = new Set(changed);
  return list.filter((label) => !removed.has(label));
}

function boardLabels(hexes: readonly Hex[]): string[] {
  return hexes.filter((hex) => isBoardHex(hex)).map(formatHex);
}

/** Applies a terrain tool to some hexes, ignoring any off the board. */
export function paintHexes(
  terrain: TerrainMap,
  hexes: readonly Hex[],
  tool: TerrainTool,
): TerrainMap {
  return paint(terrain, boardLabels(hexes), tool === 'erase' ? null : tool);
}

/** Applies a hexside tool to some hexsides, ignoring any off the board. */
export function paintHexsides(
  hexsides: HexsideMap,
  sides: readonly Hexside[],
  tool: HexsideTool,
): HexsideMap {
  const labels = sides.filter((side) => isBoardHexside(side)).map(formatHexside);
  return paint(hexsides, labels, tool === 'erase-hexside' ? null : tool);
}

/** Adds hexes to an invasion area, taking them out of any other, or removes them. */
export function paintArea(
  map: EditableMap,
  hexes: readonly Hex[],
  area: InvasionArea,
  adding: boolean,
): EditableMap {
  const labels = boardLabels(hexes);
  const areas = { ...map.invasionAreas };
  let changed = false;
  for (const other of INVASION_AREAS) {
    const current = areas[other] ?? [];
    const next =
      other === area
        ? toggle(current, labels, adding)
        : adding
          ? toggle(current, labels, false)
          : current;
    if (next !== current) {
      areas[other] = next;
      changed = true;
    }
  }
  return changed ? { ...map, invasionAreas: areas } : map;
}

/** Adds hexes to a port's letter hexes, or removes them. */
export function paintPort(
  map: EditableMap,
  hexes: readonly Hex[],
  name: string,
  adding: boolean,
): EditableMap {
  const port = map.ports[name];
  if (!port) return map;
  const next = toggle(port.hexes, boardLabels(hexes), adding);
  return next === port.hexes
    ? map
    : { ...map, ports: { ...map.ports, [name]: { ...port, hexes: next } } };
}

export function paintStars(map: EditableMap, hexes: readonly Hex[], adding: boolean): EditableMap {
  const stars = toggle(map.stars, boardLabels(hexes), adding);
  return stars === map.stars ? map : { ...map, stars };
}

/** Prints a red number in `from` with an arrow to `to`, replacing any number already there. */
export function setSupplyArrow(
  map: EditableMap,
  from: Hex,
  to: Hex,
  arrow: Omit<SupplyArrow, 'to'>,
): EditableMap {
  if (!isBoardHex(from) || !isBoardHex(to) || (from.l === to.l && from.n === to.n)) return map;
  const { capacity, boxed, port } = arrow;
  const value: SupplyArrow = { to: formatHex(to), capacity, boxed, ...(port ? { port } : {}) };
  return { ...map, supply: { ...map.supply, [formatHex(from)]: value } };
}

export function eraseSupplyArrows(map: EditableMap, hexes: readonly Hex[]): EditableMap {
  const supply = paint(map.supply, boardLabels(hexes), null);
  return supply === map.supply ? map : { ...map, supply };
}

export function addPort(map: EditableMap, name: string, letter: string): EditableMap {
  const trimmed = name.trim();
  if (trimmed === '' || !/^[A-Z]$/.test(letter) || trimmed in map.ports) return map;
  return { ...map, ports: { ...map.ports, [trimmed]: { letter, hexes: [] } } };
}

/** Removes a port, and unlinks any red number that was its capacity. */
export function removePort(map: EditableMap, name: string): EditableMap {
  if (!(name in map.ports)) return map;
  const ports = { ...map.ports };
  delete ports[name];
  const supply: Record<string, SupplyArrow> = {};
  for (const [from, arrow] of Object.entries(map.supply)) {
    if (arrow.port === name) {
      const { to, capacity, boxed } = arrow;
      supply[from] = { to, capacity, boxed };
    } else {
      supply[from] = arrow;
    }
  }
  return { ...map, ports, supply };
}

/** Whether a drag starting at `point` adds the marking (true) or removes it (false). */
export function strokeAdds(
  map: EditableMap,
  point: Point,
  tool: MarkingTool,
  options: MarkingOptions,
): boolean {
  const label = formatHex(hexAtPoint(point));
  switch (tool) {
    case 'star':
      return !map.stars.includes(label);
    case 'area':
      return !(map.invasionAreas[options.area] ?? []).includes(label);
    case 'port':
      return !(options.port !== null && map.ports[options.port]?.hexes.includes(label));
    default:
      return true;
  }
}

/**
 * Applies a tool along one step of a drag, from the pointer's last position (null at the
 * start of the drag) to where it is now, in map units. A fast drag skips past hexes and
 * hexsides between pointer events, so everything on the line between them is painted.
 * The supply tool isn't a paint stroke: see `setSupplyArrow`.
 */
export function paintStroke(
  map: EditableMap,
  from: Point | null,
  to: Point,
  tool: PaintTool,
  options: MarkingOptions & { adding: boolean } = { area: 'North Sea', port: null, adding: true },
): EditableMap {
  if (isHexsideTool(tool)) {
    const hexsides = paintHexsides(map.hexsides, hexsidesAlong(from ?? to, to), tool);
    return hexsides === map.hexsides ? map : { ...map, hexsides };
  }
  const hexes = from ? hexLine(hexAtPoint(from), hexAtPoint(to)) : [hexAtPoint(to)];
  switch (tool) {
    case 'star':
      return paintStars(map, hexes, options.adding);
    case 'area':
      return paintArea(map, hexes, options.area, options.adding);
    case 'port':
      return options.port === null ? map : paintPort(map, hexes, options.port, options.adding);
    case 'erase-supply':
      return eraseSupplyArrows(map, hexes);
    case 'supply':
      return map;
    default: {
      const terrain = paintHexes(map.terrain, hexes, tool);
      return terrain === map.terrain ? map : { ...map, terrain };
    }
  }
}
