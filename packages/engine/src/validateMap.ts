/**
 * Checks a map for mistakes made while entering the board. These are things the file
 * format allows but the board can't show, such as a star at sea or an arrow pointing out
 * to sea. Errors are certainly wrong; warnings are probably wrong or not finished yet.
 */

import { boardHexes } from './board';
import { formatHex, hexDistance, parseHex } from './hex';
import { parseHexside } from './hexside';
import { INVASION_AREAS, type InvasionArea, type MapData, type TerrainType } from './map';

export interface MapIssue {
  readonly level: 'error' | 'warning';
  readonly message: string;
  /** The hexes to look at. */
  readonly hexes: readonly string[];
}

const LAND: ReadonlySet<TerrainType> = new Set([
  'clear',
  'city',
  'fortified',
  'fortress',
  'mountain',
]);

/** True only if the hex is painted and isn't land, so unpainted hexes aren't reported twice. */
function isPaintedNonLand(type: TerrainType | undefined): boolean {
  return type !== undefined && !LAND.has(type);
}

function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

export function validateMap(map: MapData): MapIssue[] {
  const issues: MapIssue[] = [];
  const error = (message: string, hexes: readonly string[]) =>
    issues.push({ level: 'error', message, hexes });
  const warning = (message: string, hexes: readonly string[]) =>
    issues.push({ level: 'warning', message, hexes });
  const terrainOf = (label: string) => map.terrain[label];

  const unpainted = boardHexes()
    .map(formatHex)
    .filter((label) => !(label in map.terrain));
  if (unpainted.length > 0)
    warning(`${plural(unpainted.length, 'hex', 'hexes')} not painted yet`, unpainted);

  // Rivers run between land hexes; an edge with sea or nothing on one side is coast.
  const coastalRivers = Object.keys(map.hexsides).filter((label) => {
    const { from, to } = parseHexside(label);
    return [from, to].some((hex) => isPaintedNonLand(terrainOf(formatHex(hex))));
  });
  if (coastalRivers.length > 0) {
    const hexes = coastalRivers.flatMap((label) => label.split('/'));
    warning(`${plural(coastalRivers.length, 'river edge')} not between two land hexes`, hexes);
  }

  const starsOffLand = map.stars.filter((label) => isPaintedNonLand(terrainOf(label)));
  if (starsOffLand.length > 0)
    error(`${plural(starsOffLand.length, 'star')} not on land`, starsOffLand);

  const areaOf = new Map<string, InvasionArea>();
  for (const area of INVASION_AREAS) {
    const hexes = map.invasionAreas[area] ?? [];
    if (hexes.length === 0) {
      warning(`${area} invasion area not entered yet`, []);
      continue;
    }
    for (const label of hexes) {
      const other = areaOf.get(label);
      if (other) error(`${label} is in both ${other} and ${area}`, [label]);
      else areaOf.set(label, area);
    }
  }

  for (const [from, arrow] of Object.entries(map.supply)) {
    const number = `The ${arrow.boxed ? 'boxed ' : ''}${arrow.capacity} in ${from}`;
    const fromType = terrainOf(from);
    if (fromType !== undefined && fromType !== 'sea')
      error(`${number} isn't printed at sea`, [from]);
    if (isPaintedNonLand(terrainOf(arrow.to))) {
      error(`${number} points to ${arrow.to}, which isn't land`, [from, arrow.to]);
    }
    if (!arrow.boxed) {
      // Assault beaches: units on the sea hex attack the hex the arrow points to.
      if (hexDistance(parseHex(from), parseHex(arrow.to)) !== 1) {
        warning(`${number} points to ${arrow.to}, which isn't next to it`, [from, arrow.to]);
      }
      if (!areaOf.has(from)) warning(`${number} isn't in an invasion area`, [from]);
    }
  }

  for (const area of INVASION_AREAS) {
    const hexes = map.invasionAreas[area] ?? [];
    if (hexes.length === 0) continue;
    const hasBeach = hexes.some((label) => {
      const arrow = map.supply[label];
      return arrow !== undefined && !arrow.boxed;
    });
    if (!hasBeach) warning(`${area} has no unboxed red numbers to assault from`, hexes);
  }

  for (const [name, port] of Object.entries(map.ports)) {
    if (port.hexes.length === 0) {
      warning(`${name} has no ${port.letter} hexes`, []);
      continue;
    }
    const offLand = port.hexes.filter((label) => isPaintedNonLand(terrainOf(label)));
    if (offLand.length > 0) error(`${name} has ${port.letter} hexes not on land`, offLand);
    const capacities = Object.entries(map.supply).filter(([, arrow]) => arrow.port === name);
    if (capacities.length === 0) warning(`${name} has no boxed number`, port.hexes);
  }

  return issues;
}
