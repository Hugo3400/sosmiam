import type { LieuCiteActus } from "../../../../../packages/commun/src/types/actus.ts";
import type { TypeLieu } from "../../../../../packages/commun/src/types/lieu.ts";
import type { LigneArticleActus } from "../../services/actus-regles.ts";

export function listerLieuxCitesActus(lieux: LigneArticleActus["lieux"]): LieuCiteActus[] {
  return lieux
    .filter(({ lieu }) => lieu.statut === "publie")
    .map(({ lieu }) => ({
      id: lieu.id, nom: lieu.nom, type: lieu.type as TypeLieu, emoji: lieu.emoji, quartier: lieu.quartier, ville: lieu.ville,
      verifie: lieu._count.rattachements > 0,
    }));
}
