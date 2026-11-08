import { INVASION_AREAS, type InvasionArea, type PortMap } from '@dday/engine';
import { useState, type FormEvent } from 'react';
import type { PaintTool } from './editing';

/** The red number the supply tool prints. */
export interface SupplySettings {
  readonly capacity: number;
  readonly boxed: boolean;
  readonly port: string | null;
}

interface MarkingsPanelProps {
  tool: PaintTool;
  onTool: (tool: PaintTool) => void;
  area: InvasionArea;
  onArea: (area: InvasionArea) => void;
  port: string | null;
  onPort: (port: string | null) => void;
  ports: PortMap;
  onAddPort: (name: string, letter: string) => void;
  onRemovePort: (name: string) => void;
  supply: SupplySettings;
  onSupply: (supply: SupplySettings) => void;
}

function ToolButton({
  tool,
  current,
  onTool,
  swatch,
  children,
}: {
  tool: PaintTool;
  current: PaintTool;
  onTool: (tool: PaintTool) => void;
  swatch: string;
  children: string;
}) {
  return (
    <button type="button" aria-pressed={tool === current} onClick={() => onTool(tool)}>
      <span className={`swatch marking-${swatch}`} />
      {children}
    </button>
  );
}

export function MarkingsPanel(props: MarkingsPanelProps) {
  const { tool, onTool, area, onArea, port, onPort, ports, supply, onSupply } = props;
  const [newName, setNewName] = useState('');
  const [newLetter, setNewLetter] = useState('');
  const portNames = Object.keys(ports).sort();

  const addPort = (event: FormEvent) => {
    event.preventDefault();
    props.onAddPort(newName, newLetter);
    setNewName('');
    setNewLetter('');
  };

  return (
    <>
      <ToolButton tool="star" current={tool} onTool={onTool} swatch="star">
        Star
      </ToolButton>

      <ToolButton tool="area" current={tool} onTool={onTool} swatch="area">
        Invasion area
      </ToolButton>
      {tool === 'area' && (
        <select
          aria-label="Invasion area"
          value={area}
          onChange={(event) => onArea(event.target.value as InvasionArea)}
        >
          {INVASION_AREAS.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
      )}

      <ToolButton tool="supply" current={tool} onTool={onTool} swatch="supply">
        Red number
      </ToolButton>
      {tool === 'supply' && (
        <div className="palette-options">
          <label>
            Number
            <input
              type="number"
              min={1}
              value={supply.capacity}
              onChange={(event) =>
                onSupply({
                  ...supply,
                  capacity: Math.max(1, Math.round(Number(event.target.value)) || 1),
                })
              }
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={supply.boxed}
              onChange={(event) => onSupply({ ...supply, boxed: event.target.checked })}
            />
            Boxed
          </label>
          {supply.boxed && (
            <select
              aria-label="Port this number supplies"
              value={supply.port ?? ''}
              onChange={(event) => onSupply({ ...supply, port: event.target.value || null })}
            >
              <option value="">No port</option>
              {portNames.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          )}
          <p className="palette-hint">
            Drag from the number&rsquo;s hex to where its arrow points.
          </p>
        </div>
      )}
      <ToolButton tool="erase-supply" current={tool} onTool={onTool} swatch="erase">
        Erase red number
      </ToolButton>

      <ToolButton tool="port" current={tool} onTool={onTool} swatch="port">
        Port letter hexes
      </ToolButton>
      {tool === 'port' && (
        <div className="palette-options">
          {portNames.length > 0 ? (
            <div className="palette-row">
              <select
                aria-label="Port"
                value={port ?? ''}
                onChange={(event) => onPort(event.target.value || null)}
              >
                {port === null && <option value="">Choose a port</option>}
                {portNames.map((name) => (
                  <option key={name} value={name}>
                    {name} ({ports[name]?.letter})
                  </option>
                ))}
              </select>
              {port !== null && (
                <button type="button" onClick={() => props.onRemovePort(port)}>
                  Remove
                </button>
              )}
            </div>
          ) : (
            <p className="palette-hint">Add a port first.</p>
          )}
          <form className="palette-row" onSubmit={addPort}>
            <input
              aria-label="New port name"
              placeholder="Name"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
            />
            <input
              aria-label="New port letter"
              placeholder="A"
              className="letter-input"
              maxLength={1}
              value={newLetter}
              onChange={(event) => setNewLetter(event.target.value.toUpperCase())}
            />
            <button
              type="submit"
              disabled={
                newName.trim() === '' || !/^[A-Z]$/.test(newLetter) || newName.trim() in ports
              }
            >
              Add
            </button>
          </form>
        </div>
      )}
    </>
  );
}
