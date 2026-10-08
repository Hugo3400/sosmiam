import { PhotosPublication } from "~/composants/fil/PhotosPublication";
import { VideoPublication } from "~/composants/fil/VideoPublication";
import type { MediaPublication as Media } from "~/contenus/type-publication";

type Props = {
  media: Media;
  largeur: number;
  hauteur: number;
  actif: boolean;
  enPause: boolean;
};

/** Le média d'une publication en plein écran : vidéo ou photos. */
export function MediaPublication({ media, largeur, hauteur, actif, enPause }: Props) {
  if (media.type === "photos") return <PhotosPublication photos={media.photos} largeur={largeur} hauteur={hauteur} />;
  return <VideoPublication media={media} actif={actif} enPause={enPause} />;
}
