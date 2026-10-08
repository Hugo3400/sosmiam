import { PhotosPublication } from "~/composants/fil/PhotosPublication";
import { VideoPublication } from "~/composants/fil/VideoPublication";
import type { MediaPublication as Media } from "~/contenus/type-publication";

type Props = {
  media: Media;
  largeur: number;
  hauteur: number;
  actif: boolean;
  enPause: boolean;
  /** Place à laisser en haut pour le compteur de photos (en-tête du fil) */
  margeHaut: number;
  /** Appui sur une photo (double appui : « J'aime ») */
  onAppuiPhoto: () => void;
};

/** Le média d'une publication en plein écran : vidéo ou photos. */
export function MediaPublication({ media, largeur, hauteur, actif, enPause, margeHaut, onAppuiPhoto }: Props) {
  if (media.type === "photos") return <PhotosPublication photos={media.photos} largeur={largeur} hauteur={hauteur} actif={actif} haut={margeHaut} onAppui={onAppuiPhoto} />;
  return <VideoPublication media={media} actif={actif} enPause={enPause} />;
}
