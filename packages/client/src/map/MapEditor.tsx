import { boardHexes, parseMapData, serialiseMapData } from '@dday/engine';
import { useCallback, useEffect, useRef, useState } from 'react';
import mapUrl from '../../../../data/map.json?url';
import { isHexsideTool, paintStroke, type EditableMap, type PaintTool } from './editing';
import type { Point } from './geometry';
import { HexMap } from './HexMap';

const BOARD_HEXES = boardHexes();

// Saving writes to data/map.json in the repo, which only the Vite dev server can do.
const EDITABLE = import.meta.env.DEV;

interface ToolOption {
  readonly tool: PaintTool;
  readonly name: string;
}

const TERRAIN_TOOLS: readonly ToolOption[] = [
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

const HEXSIDE_TOOLS: readonly ToolOption[] = [
  { tool: 'river', name: 'River' },
  { tool: 'rhine-ijssel', name: 'Rhine–IJssel line' },
  { tool: 'erase-hexside', name: 'Erase' },
];

async function loadMap(): Promise<EditableMap> {
  const response = await fetch(mapUrl, { cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const { terrain, hexsides } = parseMapData(await response.json());
  return { terrain, hexsides };
}

async function saveMap(map: EditableMap): Promise<void> {
  const response = await fetch('/api/map', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: serialiseMapData({ version: 1, ...map }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

export function MapEditor() {
  const [map, setMap] = useState<EditableMap | null>(null);
  const [savedMap, setSavedMap] = useState<EditableMap | null>(null);
  const [tool, setTool] = useState<PaintTool>('clear');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const toolRef = useRef(tool);
  toolRef.current = tool;

  useEffect(() => {
    loadMap().then(
      (loaded) => {
        setMap(loaded);
        setSavedMap(loaded);
      },
      (cause: unknown) => setError(`Couldn't load the map: ${String(cause)}`),
    );
  }, []);

  const unsaved = map !== savedMap;

  const save = useCallback(async () => {
    if (!map || saving) return;
    setSaving(true);
    try {
      await saveMap(map);
      setSavedMap(map);
      setError(null);
    } catch (cause) {
      setError(`Couldn't save the map: ${String(cause)}`);
    } finally {
      setSaving(false);
    }
  }, [map, saving]);

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

  const paint = useCallback((from: Point | null, to: Point) => {
    setMap((current) => current && paintStroke(current, from, to, toolRef.current));
  }, []);

  if (!map) return error ? <p className="map-error">{error}</p> : null;

  const toolButtons = (options: readonly ToolOption[]) =>
    options.map(({ tool: option, name }) => (
      <button
        key={option}
        type="button"
        aria-pressed={tool === option}
        onClick={() => setTool(option)}
      >
        <span className={`swatch ${isHexsideTool(option) ? 'hexside' : 'terrain'}-${option}`} />
        {name}
      </button>
    ));

  return (
    <>
      <HexMap
        hexes={BOARD_HEXES}
        terrain={map.terrain}
        hexsides={map.hexsides}
        onPaint={EDITABLE ? paint : undefined}
      />
      {EDITABLE && (
        <aside className="palette">
          <h2>Terrain</h2>
          {toolButtons(TERRAIN_TOOLS)}
          <h2>Hexsides</h2>
          {toolButtons(HEXSIDE_TOOLS)}
          <button type="button" disabled={!unsaved || saving} onClick={() => void save()}>
            {unsaved ? 'Save' : 'Saved'}
          </button>
          {error && <p className="map-error">{error}</p>}
          <p className="palette-hint">
            {isHexsideTool(tool)
              ? 'Drag along hex edges to draw. Right drag pans. Scroll zooms.'
              : 'Left drag paints. Right drag pans. Scroll zooms.'}
          </p>
        </aside>
      )}
    </>
  );
}
