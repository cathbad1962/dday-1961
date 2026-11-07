/**
 * The board's terrain and hexside features, as stored in data/map.json.
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

export interface MapData {
  readonly version: 1;
  readonly terrain: TerrainMap;
  readonly hexsides: HexsideMap;
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

const mapSchema = z.object({
  version: z.literal(1),
  terrain: z.record(
    z.string().refine(isBoardLabel, { error: 'not a hex on the board' }),
    z.enum(TERRAIN_TYPES),
  ),
  // Maps saved before hexsides existed have none.
  hexsides: z
    .record(
      z.string().refine(isBoardHexsideLabel, { error: 'not a hexside on the board' }),
      z.enum(HEXSIDE_FEATURES),
    )
    .default({}),
});

/** Checks untrusted JSON. Throws if it isn't a valid map. */
export function parseMapData(json: unknown): MapData {
  return mapSchema.parse(json);
}

/** Writes hexes and hexsides in board order, so that saving a map gives small version-control diffs. */
export function serialiseMapData({ version, terrain, hexsides }: MapData): string {
  const orderedTerrain: Record<string, TerrainType> = {};
  const orderedHexsides: Record<string, HexsideFeature> = {};
  for (const hex of boardHexes()) {
    const label = formatHex(hex);
    const type = terrain[label];
    if (type) orderedTerrain[label] = type;
    for (const direction of HEXSIDE_DIRECTIONS) {
      const side = hexsideOf(hex, direction);
      if (!isBoardHexside(side)) continue;
      const sideLabel = formatHexside(side);
      const feature = hexsides[sideLabel];
      if (feature) orderedHexsides[sideLabel] = feature;
    }
  }
  const data = { version, terrain: orderedTerrain, hexsides: orderedHexsides };
  return `${JSON.stringify(data, null, 2)}\n`;
}
