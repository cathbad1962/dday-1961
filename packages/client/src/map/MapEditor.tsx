import {
  boardHexes,
  parseMapData,
  serialiseMapData,
  type Hex,
  type TerrainMap,
} from '@dday/engine';
import { useCallback, useEffect, useRef, useState } from 'react';
import mapUrl from '../../../../data/map.json?url';
import { paintHexes, type PaintTool } from './editing';
import { HexMap } from './HexMap';

const BOARD_HEXES = boardHexes();

// Saving writes to data/map.json in the repo, which only the Vite dev server can do.
const EDITABLE = import.meta.env.DEV;

const TOOLS: readonly { tool: PaintTool; name: string }[] = [
  { tool: 'clear', name: 'Clear' },
  { tool: 'sea', name: 'Sea' },
  { tool: 'city', name: 'City' },
  { tool: 'fortified', name: 'Fortified zone' },
  { tool: 'fortress', name: 'Fortress' },
  { tool: 'mountain', name: 'Mountain' },
  { tool: 'impassable', name: '"X" hex' },
  { tool: 'neutral', name: 'Neutral' },
  { tool: 'none', name: 'No hex printed' },
  { tool: 'erase', name: 'Erase' },
];

async function loadTerrain(): Promise<TerrainMap> {
  const response = await fetch(mapUrl, { cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return parseMapData(await response.json()).terrain;
}

async function saveTerrain(terrain: TerrainMap): Promise<void> {
  const response = await fetch('/api/map', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: serialiseMapData({ version: 1, terrain }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

export function MapEditor() {
  const [terrain, setTerrain] = useState<TerrainMap | null>(null);
  const [savedTerrain, setSavedTerrain] = useState<TerrainMap | null>(null);
  const [tool, setTool] = useState<PaintTool>('clear');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const toolRef = useRef(tool);
  toolRef.current = tool;

  useEffect(() => {
    loadTerrain().then(
      (loaded) => {
        setTerrain(loaded);
        setSavedTerrain(loaded);
      },
      (cause: unknown) => setError(`Couldn't load the map: ${String(cause)}`),
    );
  }, []);

  const unsaved = terrain !== savedTerrain;

  const save = useCallback(async () => {
    if (!terrain || saving) return;
    setSaving(true);
    try {
      await saveTerrain(terrain);
      setSavedTerrain(terrain);
      setError(null);
    } catch (cause) {
      setError(`Couldn't save the map: ${String(cause)}`);
    } finally {
      setSaving(false);
    }
  }, [terrain, saving]);

  useEffect(() => {
    if (!EDITABLE) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        void save();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [save]);

  useEffect(() => {
    if (!unsaved) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [unsaved]);

  const paint = useCallback((hexes: Hex[]) => {
    setTerrain((current) => current && paintHexes(current, hexes, toolRef.current));
  }, []);

  if (!terrain) return error ? <p className="map-error">{error}</p> : null;

  return (
    <>
      <HexMap hexes={BOARD_HEXES} terrain={terrain} onPaint={EDITABLE ? paint : undefined} />
      {EDITABLE && (
        <aside className="palette">
          {TOOLS.map(({ tool: option, name }) => (
            <button
              key={option}
              type="button"
              aria-pressed={tool === option}
              onClick={() => setTool(option)}
            >
              <span className={`swatch terrain-${option}`} />
              {name}
            </button>
          ))}
          <button type="button" disabled={!unsaved || saving} onClick={() => void save()}>
            {unsaved ? 'Save' : 'Saved'}
          </button>
          {error && <p className="map-error">{error}</p>}
          <p className="palette-hint">Left drag paints. Right drag pans. Scroll zooms.</p>
        </aside>
      )}
    </>
  );
}
