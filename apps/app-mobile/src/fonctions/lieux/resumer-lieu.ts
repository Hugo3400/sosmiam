import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { LieuResume } from "@sos-miam/commun/types/lieu-resume";

/** Ce qu'il faut d'un lieu pour afficher une visite, une carte de fidélité ou une réservation. */
export function resumerLieu(lieu: Lieu): LieuResume {
  return { id: lieu.id, nom: lieu.nom, emoji: lieu.emoji, type: lieu.type, ville: lieu.ville };
}
