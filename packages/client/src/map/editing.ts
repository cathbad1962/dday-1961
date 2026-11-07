import { formatHex, isBoardHex, type Hex, type TerrainMap, type TerrainType } from '@dday/engine';

export type PaintTool = TerrainType | 'erase';

/**
 * Applies a tool to some hexes, ignoring any off the board.
 * Returns the same object if nothing changed, so unsaved changes can be spotted by identity.
 */
export function paintHexes(
  terrain: TerrainMap,
  hexes: readonly Hex[],
  tool: PaintTool,
): TerrainMap {
  const painted = { ...terrain };
  let changed = false;
  for (const hex of hexes) {
    if (!isBoardHex(hex)) continue;
    const label = formatHex(hex);
    if (tool === 'erase') {
      if (label in painted) {
        delete painted[label];
        changed = true;
      }
    } else if (painted[label] !== tool) {
      painted[label] = tool;
      changed = true;
    }
  }
  return changed ? painted : terrain;
}
