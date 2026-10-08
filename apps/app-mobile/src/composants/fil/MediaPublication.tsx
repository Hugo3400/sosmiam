import { PhotosPublication } from "~/composants/fil/PhotosPublication";
import { VideoPublication } from "~/composants/fil/VideoPublication";
import type { MediaPublication as Media } from "~/contenus/type-publication";

type Props = {
  media: Media;
  largeur: number;
  hauteur: number;
  actif: boolean;
  enPause: boolean;
  /** Appui long en cours sur la vidéo : elle file en x2 jusqu'à ce qu'on lâche */
  acceleree: boolean;
  /** Place à laisser en haut pour le compteur de photos et le bouton du son (en-tête du fil) */
  margeHaut: number;
  /** Hauteur de la barre d'onglets : la barre d'avancée de la vidéo se pose juste au-dessus */
  margeBas: number;
  /** Appui sur une photo (double appui : « J'aime ») */
  onAppuiPhoto: () => void;
};

/** Le média d'une publication en plein écran : vidéo (avec son, avancée et x2) ou photos (qui défilent seules). */
export function MediaPublication({ media, largeur, hauteur, actif, enPause, acceleree, margeHaut, margeBas, onAppuiPhoto }: Props) {
  if (media.type === "photos") return <PhotosPublication photos={media.photos} largeur={largeur} hauteur={hauteur} actif={actif} haut={margeHaut} onAppui={onAppuiPhoto} />;
  return <VideoPublication media={media} actif={actif} enPause={enPause} acceleree={acceleree} largeur={largeur} margeHaut={margeHaut} margeBas={margeBas} />;
}
