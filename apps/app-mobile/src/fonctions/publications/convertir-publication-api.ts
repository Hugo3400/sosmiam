import type { PublicationApi } from "@sos-miam/commun/types/publication";

import type { Publication } from "~/contenus/type-publication";

/**
 * Une publication de l'API au format du fil : les médias sont des adresses, passées telles quelles aux lecteurs.
 * `aimeeSurServeur` : ton J'aime était sur le serveur quand elle a été lue (son compteur le compte déjà) ; il est retiré
 * de `jaimesAutres`, pour que le fil ne le compte jamais deux fois.
 */
export function convertirPublicationApi(p: PublicationApi, aimeeSurServeur = false): Publication {
  const media: Publication["media"] = !p.media
    ? undefined
    : p.media.type === "video"
      ? { type: "video", video: { uri: p.media.video }, affiche: p.media.affiche ? { uri: p.media.affiche } : undefined }
      : { type: "photos", photos: p.media.photos.map((uri) => ({ uri })) };
  return {
    id: p.id,
    lieuId: p.lieuId,
    auteur: p.auteur,
    legende: p.legende,
    media,
    jaimes: p.jaimes,
    jaimesAutres: Math.max(0, p.jaimes - (aimeeSurServeur ? 1 : 0)),
    commentaires: p.commentaires,
    illustration: p.illustration,
    publieeLe: p.publieeLe,
  };
}
