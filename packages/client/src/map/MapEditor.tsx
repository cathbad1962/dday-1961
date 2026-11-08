import {
  boardHexes,
  parseHex,
  parseMapData,
  serialiseMapData,
  validateMap,
  type Hex,
  type InvasionArea,
} from '@dday/engine';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import mapUrl from '../../../../data/map.json?url';
import { BoardPhoto } from './BoardPhoto';
import {
  addPort,
  isHexsideTool,
  isMarkingTool,
  paintStroke,
  removePort,
  setSupplyArrow,
  strokeAdds,
  type EditableMap,
  type PaintTool,
} from './editing';
import { HEX_SIZE, hexAtPoint, hexCentre, type Point } from './geometry';
import { HexMap } from './HexMap';
import { IssuesPanel } from './IssuesPanel';
import { MapMarkings } from './MapMarkings';
import { MarkingsPanel, type SupplySettings } from './MarkingsPanel';
import {
  fitPhoto,
  forgetPlacement,
  loadPlacement,
  mapToPhoto,
  placementFromPins,
  savePlacement,
  type PhotoPin,
  type PhotoPlacement,
} from './photo';
import { PhotoPanel } from './PhotoPanel';
import { usePhoto, usePhotoList } from './usePhotos';

const BOARD_HEXES = boardHexes();

// Saving writes to data/map.json in the repo, which only the Vite dev server can do.
const EDITABLE = import.meta.env.DEV;

type Tab = 'terrain' | 'hexsides' | 'markings' | 'photo' | 'check';

const TABS: readonly { tab: Tab; name: string }[] = [
  { tab: 'terrain', name: 'Terrain' },
  { tab: 'hexsides', name: 'Edges' },
  { tab: 'markings', name: 'Markings' },
  { tab: 'photo', name: 'Photo' },
  { tab: 'check', name: 'Check' },
];

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

/** The whole board's extent in map units, for placing a photo before it's pinned. */
const BOARD_AREA = (() => {
  const centres = BOARD_HEXES.map(hexCentre);
  const left = Math.min(...centres.map(({ x }) => x)) - HEX_SIZE;
  const right = Math.max(...centres.map(({ x }) => x)) + HEX_SIZE;
  const top = Math.min(...centres.map(({ y }) => y)) - HEX_SIZE;
  return { left, top, width: right - left };
})();

/** Pinning a photo: the pins placed so far, and a photo point waiting for its hex. */
interface Pinning {
  readonly pins: readonly PhotoPin[];
  readonly photoPoint: Point | null;
}

function pinStep({ pins, photoPoint }: Pinning): string {
  if (pins.length === 0) {
    return photoPoint
      ? '2 of 4: click that same hex on the grid.'
      : '1 of 4: click the centre of a hex on the photo.';
  }
  return photoPoint
    ? '4 of 4: click that same hex on the grid.'
    : '3 of 4: click the centre of another hex on the photo, far from the first.';
}

async function loadMap(): Promise<EditableMap> {
  const response = await fetch(mapUrl, { cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const { terrain, hexsides, stars, supply, ports, invasionAreas } = parseMapData(
    await response.json(),
  );
  return { terrain, hexsides, stars, supply, ports, invasionAreas };
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
  const [tab, setTab] = useState<Tab>('terrain');
  const [tool, setTool] = useState<PaintTool>('clear');
  const [area, setArea] = useState<InvasionArea>('North Sea');
  const [port, setPort] = useState<string | null>(null);
  const [supply, setSupply] = useState<SupplySettings>({ capacity: 2, boxed: false, port: null });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const photos = usePhotoList();
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(0.6);
  const [placement, setPlacement] = useState<PhotoPlacement | null>(null);
  const [pinning, setPinning] = useState<Pinning | null>(null);
  const photo = usePhoto(photoName, setError);

  const [selectedIssue, setSelectedIssue] = useState<number | null>(null);
  const [focus, setFocus] = useState<Hex | null>(null);

  // A drag's state, read by pointer handlers without re-rendering.
  const strokeRef = useRef<{ adding: boolean; supplyFrom: Hex | null }>({
    adding: true,
    supplyFrom: null,
  });
  const [pendingArrow, setPendingArrow] = useState<{ from: Point; to: Point } | null>(null);

  useEffect(() => {
    loadMap().then(
      (loaded) => {
        setMap(loaded);
        setSavedMap(loaded);
      },
      (cause: unknown) => setError(`Couldn't load the map: ${String(cause)}`),
    );
  }, []);

  useEffect(() => {
    setPinning(null);
    setPlacement(photo ? (loadPlacement(photo.name) ?? fitPhoto(photo, BOARD_AREA)) : null);
  }, [photo]);

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

  const issues = useMemo(
    () => (map && tab === 'check' ? validateMap({ version: 1, ...map }) : []),
    [map, tab],
  );

  useEffect(() => {
    setSelectedIssue(null);
  }, [issues]);

  const selectIssue = (index: number | null) => {
    setSelectedIssue(index);
    const first = index === null ? undefined : issues[index]?.hexes[0];
    if (first) setFocus(parseHex(first));
  };

  /** A click while pinning: a photo point first, then the hex it belongs in. */
  const pin = (point: Point) => {
    if (!pinning || !placement) return;
    if (!pinning.photoPoint) {
      setPinning({ ...pinning, photoPoint: mapToPhoto(placement, point) });
      return;
    }
    const pins = [
      ...pinning.pins,
      { photo: pinning.photoPoint, map: hexCentre(hexAtPoint(point)) },
    ];
    const [first, second] = pins;
    if (!first || !second) {
      setPinning({ pins, photoPoint: null });
      return;
    }
    const pinned = placementFromPins(first, second);
    if (pinned && photo) {
      setPlacement(pinned);
      savePlacement(photo.name, pinned);
    }
    setPinning(null);
  };

  const paint = (from: Point | null, to: Point) => {
    if (!map) return;
    if (pinning) {
      if (from === null) pin(to);
      return;
    }
    const stroke = strokeRef.current;
    if (tool === 'supply') {
      if (from === null) stroke.supplyFrom = hexAtPoint(to);
      if (stroke.supplyFrom) setPendingArrow({ from: hexCentre(stroke.supplyFrom), to });
      return;
    }
    if (from === null && isMarkingTool(tool))
      stroke.adding = strokeAdds(map, to, tool, { area, port });
    const adding = stroke.adding;
    setMap((current) => current && paintStroke(current, from, to, tool, { area, port, adding }));
  };

  const endPaint = (at: Point) => {
    const stroke = strokeRef.current;
    if (tool !== 'supply' || !stroke.supplyFrom) return;
    const from = stroke.supplyFrom;
    stroke.supplyFrom = null;
    setPendingArrow(null);
    const arrow = {
      capacity: supply.capacity,
      boxed: supply.boxed,
      port: supply.boxed ? (supply.port ?? undefined) : undefined,
    };
    setMap((current) => current && setSupplyArrow(current, from, hexAtPoint(at), arrow));
  };

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

  if (!map) return error ? <p className="map-error">{error}</p> : null;

  const highlight = selectedIssue === null ? undefined : issues[selectedIssue]?.hexes;

  return (
    <>
      <HexMap
        hexes={BOARD_HEXES}
        terrain={map.terrain}
        hexsides={map.hexsides}
        onPaint={EDITABLE ? paint : undefined}
        onPaintEnd={EDITABLE ? endPaint : undefined}
        focus={focus}
        underlay={
          photo && placement && <BoardPhoto photo={photo} placement={placement} opacity={opacity} />
        }
        overlay={<MapMarkings map={map} pendingArrow={pendingArrow} highlight={highlight} />}
      />
      {EDITABLE && (
        <aside className="palette">
          <nav className="palette-tabs">
            {TABS.map(({ tab: option, name }) => (
              <button
                key={option}
                type="button"
                aria-pressed={tab === option}
                onClick={() => setTab(option)}
              >
                {name}
              </button>
            ))}
          </nav>
          <div className="palette-body">
            {tab === 'terrain' && toolButtons(TERRAIN_TOOLS)}
            {tab === 'hexsides' && toolButtons(HEXSIDE_TOOLS)}
            {tab === 'markings' && (
              <MarkingsPanel
                tool={tool}
                onTool={setTool}
                area={area}
                onArea={setArea}
                port={port}
                onPort={setPort}
                ports={map.ports}
                onAddPort={(name, letter) => {
                  setMap((current) => current && addPort(current, name, letter));
                  setPort(name.trim());
                }}
                onRemovePort={(name) => {
                  setMap((current) => current && removePort(current, name));
                  setPort(null);
                }}
                supply={supply}
                onSupply={setSupply}
              />
            )}
            {tab === 'photo' && (
              <PhotoPanel
                photos={photos}
                selected={photoName}
                onSelect={setPhotoName}
                opacity={opacity}
                onOpacity={setOpacity}
                pinStep={pinning && pinStep(pinning)}
                onStartPinning={() => setPinning({ pins: [], photoPoint: null })}
                onCancelPinning={() => setPinning(null)}
                onReset={() => {
                  if (!photo) return;
                  forgetPlacement(photo.name);
                  setPlacement(fitPhoto(photo, BOARD_AREA));
                }}
              />
            )}
            {tab === 'check' && (
              <IssuesPanel issues={issues} selected={selectedIssue} onSelect={selectIssue} />
            )}
          </div>
          <button
            type="button"
            className="save"
            disabled={!unsaved || saving}
            onClick={() => void save()}
          >
            {unsaved ? 'Save' : 'Saved'}
          </button>
          {error && <p className="map-error">{error}</p>}
          <p className="palette-hint">
            {pinning
              ? 'Pinning the photo. Right drag pans. Scroll zooms.'
              : `Painting with ${toolName(tool)}. Right drag pans. Scroll zooms.`}
          </p>
        </aside>
      )}
    </>
  );
}

function toolName(tool: PaintTool): string {
  const names: Partial<Record<PaintTool, string>> = {
    star: 'stars',
    area: 'invasion area',
    port: 'port letters',
    supply: 'red numbers',
    'erase-supply': 'red number eraser',
    'erase-hexside': 'edge eraser',
    erase: 'terrain eraser',
    'rhine-ijssel': 'Rhine–IJssel line',
  };
  return (
    names[tool] ??
    [...TERRAIN_TOOLS, ...HEXSIDE_TOOLS]
      .find((option) => option.tool === tool)
      ?.name.toLowerCase() ??
    tool
  );
}
