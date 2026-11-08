import { placementMatrix, type PhotoPlacement } from './photo';
import type { LoadedPhoto } from './usePhotos';

interface BoardPhotoProps {
  photo: LoadedPhoto;
  placement: PhotoPlacement;
  opacity: number;
}

export function BoardPhoto({ photo, placement, opacity }: BoardPhotoProps) {
  return (
    <image
      className="board-photo"
      href={photo.url}
      width={photo.width}
      height={photo.height}
      transform={placementMatrix(placement)}
      opacity={opacity}
    />
  );
}
