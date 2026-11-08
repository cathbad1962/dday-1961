/**
 * The board as printed, as stored in data/map.json: terrain, hexside features and the
 * special markings (rules spec 2.2 and 14). The file records what the board shows;
 * what each marking means in play is for the rules engine.
 * Coastal hexes aren't a type here: a land hex next to the sea is coastal (rules spec 2.1).
 */

import { z } from 'zod';
import { boardHexes, isBoardHex } from './board';
import { formatHex, parseHex } from './hex';
import {
  formatHexside,
  HEXSIDE_DIRECTIONS,
  hexsideOf,
  isBoardHexside,
  parseHexside,
} from './hexside';

export const TERRAIN_TYPES = [
  'clear',
  'sea',
  'city',
  'fortified',
  'fortress',
  'mountain',
  'impassable',
  'neutral',
  'none',
] as const;

export type TerrainType = (typeof TERRAIN_TYPES)[number];

/** Terrain by hex label. A hex that's missing hasn't been painted yet. */
export type TerrainMap = Readonly<Record<string, TerrainType>>;

/**
 * What runs along a hexside. The Rhine–IJssel line is a river that also marks
 * the edge of Germany for victory and German supply (ruling 5).
 */
export const HEXSIDE_FEATURES = ['river', 'rhine-ijssel'] as const;

export type HexsideFeature = (typeof HEXSIDE_FEATURES)[number];

/** Features by hexside label, such as `K16/L16`. A hexside that's missing has none. */
export type HexsideMap = Readonly<Record<string, HexsideFeature>>;

/** The seven invasion areas marked on the board, named as in the Reference Folder. */
export const INVASION_AREAS = [
  'North Sea',
  'Pas de Calais',
  'Le Havre',
  'Normandy',
  'Brittany',
  'Biscay',
  'South France',
] as const;

export type InvasionArea = (typeof INVASION_AREAS)[number];

/** The hexes inside each invasion area's border. */
export type InvasionAreaMap = Readonly<Partial<Record<InvasionArea, readonly string[]>>>;

/** A red number printed in a hex, with the arrow from it. */
export interface SupplyArrow {
  /** The hex the arrow points to. */
  readonly to: string;
  readonly capacity: number;
  /** Printed in a box. */
  readonly boxed: boolean;
  /** The inland port the number belongs to, by name, if it's a port's capacity. */
  readonly port?: string;
}

/** Red numbers by the hex they're printed in. */
export type SupplyMap = Readonly<Record<string, SupplyArrow>>;

/** An inland port: the letter printed in its hexes, and those hexes. */
export interface Port {
  readonly letter: string;
  readonly hexes: readonly string[];
}

/** Ports by name. Letters can repeat: Rouen and Rotterdam are both "R". */
export type PortMap = Readonly<Record<string, Port>>;

export interface MapData {
  readonly version: 1;
  readonly terrain: TerrainMap;
  readonly hexsides: HexsideMap;
  /** Hexes printed with a red star. */
  readonly stars: readonly string[];
  readonly supply: SupplyMap;
  readonly ports: PortMap;
  readonly invasionAreas: InvasionAreaMap;
}

function isBoardLabel(label: string): boolean {
  try {
    return isBoardHex(parseHex(label));
  } catch {
    return false;
  }
}

function isBoardHexsideLabel(label: string): boolean {
  try {
    return isBoardHexside(parseHexside(label));
  } catch {
    return false;
  }
}

const hexLabel = z.string().refine(isBoardLabel, { error: 'not a hex on the board' });

function uniqueHexes() {
  return z
    .array(hexLabel)
    .refine((labels) => new Set(labels).size === labels.length, { error: 'hex listed twice' });
}

const mapSchema = z
  .object({
    version: z.literal(1),
    terrain: z.record(hexLabel, z.enum(TERRAIN_TYPES)),
    // Maps saved before a section existed have none of it.
    hexsides: z
      .record(
        z.string().refine(isBoardHexsideLabel, { error: 'not a hexside on the board' }),
        z.enum(HEXSIDE_FEATURES),
      )
      .default({}),
    stars: uniqueHexes().default([]),
    supply: z
      .record(
        hexLabel,
        z.object({
          to: hexLabel,
          capacity: z.int().positive(),
          boxed: z.boolean(),
          port: z.string().min(1).optional(),
        }),
      )
      .default({}),
    ports: z
      .record(
        z.string().trim().min(1),
        z.object({ letter: z.string().regex(/^[A-Z]$/), hexes: uniqueHexes() }),
      )
      .default({}),
    invasionAreas: z.partialRecord(z.enum(INVASION_AREAS), uniqueHexes()).default({}),
  })
  .superRefine((map, context) => {
    for (const [from, arrow] of Object.entries(map.supply)) {
      if (arrow.port !== undefined && !(arrow.port in map.ports)) {
        context.addIssue({
          code: 'custom',
          path: ['supply', from, 'port'],
          message: `no port called ${arrow.port}`,
        });
      }
    }
  });

/** Checks untrusted JSON. Throws if it isn't a valid map. */
export function parseMapData(json: unknown): MapData {
  return mapSchema.parse(json);
}

/** Sorts hex labels into board order. */
export function sortHexLabels(labels: Iterable<string>): string[] {
  const order = new Map(boardHexes().map((hex, index) => [formatHex(hex), index]));
  return [...labels].sort((a, b) => (order.get(a) ?? Infinity) - (order.get(b) ?? Infinity));
}

/** Writes everything in a fixed order, so that saving a map gives small version-control diffs. */
export function serialiseMapData(map: MapData): string {
  const terrain: Record<string, TerrainType> = {};
  const hexsides: Record<string, HexsideFeature> = {};
  const supply: Record<string, SupplyArrow> = {};
  for (const hex of boardHexes()) {
    const label = formatHex(hex);
    const type = map.terrain[label];
    if (type) terrain[label] = type;
    const arrow = map.supply[label];
    if (arrow) {
      const { to, capacity, boxed, port } = arrow;
      supply[label] = port === undefined ? { to, capacity, boxed } : { to, capacity, boxed, port };
    }
    for (const direction of HEXSIDE_DIRECTIONS) {
      const side = hexsideOf(hex, direction);
      if (!isBoardHexside(side)) continue;
      const sideLabel = formatHexside(side);
      const feature = map.hexsides[sideLabel];
      if (feature) hexsides[sideLabel] = feature;
    }
  }
  const ports: Record<string, Port> = {};
  for (const name of Object.keys(map.ports).sort()) {
    const port = map.ports[name];
    if (port) ports[name] = { letter: port.letter, hexes: sortHexLabels(port.hexes) };
  }
  const invasionAreas: Partial<Record<InvasionArea, string[]>> = {};
  for (const area of INVASION_AREAS) {
    const hexes = map.invasionAreas[area];
    if (hexes && hexes.length > 0) invasionAreas[area] = sortHexLabels(hexes);
  }
  const data = {
    version: map.version,
    terrain,
    hexsides,
    stars: sortHexLabels(map.stars),
    supply,
    ports,
    invasionAreas,
  };
  return `${JSON.stringify(data, null, 2)}\n`;
}
