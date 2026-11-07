/**
 * The board's terrain, as stored in data/map.json.
 * Coastal hexes aren't a type here: a land hex next to the sea is coastal (rules spec 2.1).
 */

import { z } from 'zod';
import { boardHexes, isBoardHex } from './board';
import { formatHex, parseHex } from './hex';

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

export interface MapData {
  readonly version: 1;
  readonly terrain: TerrainMap;
}

function isBoardLabel(label: string): boolean {
  try {
    return isBoardHex(parseHex(label));
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
});

/** Checks untrusted JSON. Throws if it isn't a valid map. */
export function parseMapData(json: unknown): MapData {
  return mapSchema.parse(json);
}

/** Writes hexes in board order, so that saving a map gives small version-control diffs. */
export function serialiseMapData({ version, terrain }: MapData): string {
  const ordered: Record<string, TerrainType> = {};
  for (const label of boardHexes().map(formatHex)) {
    const type = terrain[label];
    if (type) ordered[label] = type;
  }
  return `${JSON.stringify({ version, terrain: ordered }, null, 2)}\n`;
}
