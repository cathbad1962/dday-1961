interface PhotoPanelProps {
  photos: readonly string[];
  selected: string | null;
  onSelect: (name: string | null) => void;
  opacity: number;
  onOpacity: (opacity: number) => void;
  /** Where pinning is up to: null when not pinning, otherwise the next click's instructions. */
  pinStep: string | null;
  onStartPinning: () => void;
  onCancelPinning: () => void;
  onReset: () => void;
}

export function PhotoPanel(props: PhotoPanelProps) {
  const { photos, selected, opacity, pinStep } = props;
  if (photos.length === 0) {
    return <p className="palette-hint">No photos found. Put board photos in docs/rules/photos.</p>;
  }
  return (
    <div className="palette-options">
      <select
        aria-label="Board photo"
        value={selected ?? ''}
        onChange={(event) => props.onSelect(event.target.value || null)}
      >
        <option value="">No photo</option>
        {photos.map((name) => (
          <option key={name}>{name}</option>
        ))}
      </select>
      {selected && (
        <>
          <label>
            Opacity
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={opacity}
              onChange={(event) => props.onOpacity(Number(event.target.value))}
            />
          </label>
          {pinStep === null ? (
            <>
              <button type="button" onClick={props.onStartPinning}>
                Pin to the grid
              </button>
              <button type="button" onClick={props.onReset}>
                Reset position
              </button>
              <p className="palette-hint">
                Pinning lines the photo up with the grid using two hexes. Pick two far apart.
              </p>
            </>
          ) : (
            <>
              <p className="palette-step">{pinStep}</p>
              <button type="button" onClick={props.onCancelPinning}>
                Cancel
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
