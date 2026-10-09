// Une publication de la base, mise au format de l'app (type PublicationApi de packages/commun). Les médias deviennent des
// adresses complètes (https://…/app/medias/<fichier>), servies par l'API seulement tant que la publication est visible.
import type { AuteurPublication, MediaPublicationApi, PublicationApi } from "../../../../../packages/commun/src/types/publication.ts";

/** Ce que le service lit d'une publication visible */
export type LignePublicationApp = {
  id: number;
  lieuId: number;
  auteurType: string;
  auteurPseudo: string | null;
  partenariat: string | null;
  legende: string;
  illustration: boolean;
  publieeLe: Date;
  medias: { type: string; fichier: string; ordre: number }[];
  jaimes: number;
  commentaires: number;
};

/** Le média de la publication : une vidéo (et son affiche si elle en a une), sinon ses photos dans l'ordre ; rien sinon */
function lireMedia(medias: LignePublicationApp["medias"], adresse: (fichier: string) => string): MediaPublicationApi | undefined {
  const video = medias.find((m) => m.type === "video");
  if (video) {
    const affiche = medias.find((m) => m.type === "affiche");
    return { type: "video", video: adresse(video.fichier), ...(affiche ? { affiche: adresse(affiche.fichier) } : {}) };
  }
  const photos = medias.filter((m) => m.type === "photo").sort((a, b) => a.ordre - b.ordre);
  return photos.length > 0 ? { type: "photos", photos: photos.map((p) => adresse(p.fichier)) } : undefined;
}

/** Met une publication visible au format de l'app ; `adresse` donne l'adresse publique d'un fichier de média. */
export function presenterPublicationApp(p: LignePublicationApp, adresse: (fichier: string) => string): PublicationApi {
  const auteur: AuteurPublication =
    p.auteurType === "createur" && p.auteurPseudo
      ? { type: "createur", pseudo: p.auteurPseudo, ...(p.partenariat ? { partenariat: p.partenariat } : {}) }
      : { type: "lieu" };
  const media = lireMedia(p.medias, adresse);
  return {
    id: String(p.id),
    lieuId: p.lieuId,
    auteur,
    legende: p.legende,
    ...(media ? { media } : {}),
    illustration: p.illustration,
    jaimes: p.jaimes,
    commentaires: p.commentaires,
    publieeLe: p.publieeLe.toISOString(),
  };
}
