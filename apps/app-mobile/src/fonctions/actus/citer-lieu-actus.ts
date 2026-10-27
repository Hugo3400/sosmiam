import { estLieuVerifie } from "@sos-miam/commun/fonctions/lieux/est-lieu-verifie";
import type { LieuCiteActus } from "@sos-miam/commun/types/actus";
import type { Lieu } from "@sos-miam/commun/types/lieu";

export function citerLieuActus(lieu: Lieu): LieuCiteActus {
  return { id: lieu.id, nom: lieu.nom, type: lieu.type, emoji: lieu.emoji, quartier: lieu.quartier, ville: lieu.ville, verifie: estLieuVerifie(lieu) };
}
