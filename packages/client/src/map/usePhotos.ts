import { useEffect, useState } from 'react';

export interface LoadedPhoto {
  readonly name: string;
  readonly url: string;
  readonly width: number;
  readonly height: number;
}

/**
 * Loads a board photo from the dev server. Phone photos are often stored sideways with a flag
 * saying which way is up; redrawing the photo applies that flag, so the image is upright and
 * its size is the upright size.
 */
async function loadPhoto(name: string): Promise<LoadedPhoto> {
  const response = await fetch(`/api/photos/${encodeURIComponent(name)}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const bitmap = await createImageBitmap(await response.blob(), { imageOrientation: 'from-image' });
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.9),
  );
  if (!blob) throw new Error("couldn't redraw the photo");
  return { name, url: URL.createObjectURL(blob), width: canvas.width, height: canvas.height };
}

/** The photo with this name, once loaded, or null. */
export function usePhoto(
  name: string | null,
  onError: (message: string) => void,
): LoadedPhoto | null {
  const [photo, setPhoto] = useState<LoadedPhoto | null>(null);
  useEffect(() => {
    setPhoto(null);
    if (!name) return;
    let cancelled = false;
    let loaded: LoadedPhoto | null = null;
    loadPhoto(name).then(
      (result) => {
        loaded = result;
        if (cancelled) URL.revokeObjectURL(result.url);
        else setPhoto(result);
      },
      (cause: unknown) => {
        if (!cancelled) onError(`Couldn't load ${name}: ${String(cause)}`);
      },
    );
    return () => {
      cancelled = true;
      if (loaded) URL.revokeObjectURL(loaded.url);
    };
  }, [name, onError]);
  return photo;
}

/** The photos available to trace over. Empty if there are none or the list can't be read. */
export function usePhotoList(): readonly string[] {
  const [names, setNames] = useState<readonly string[]>([]);
  useEffect(() => {
    fetch('/api/photos')
      .then((response) => (response.ok ? (response.json() as Promise<string[]>) : []))
      .then(setNames, () => setNames([]));
  }, []);
  return names;
}
