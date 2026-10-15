import { peutVoirSortieMiamis } from "../../../../../packages/commun/src/fonctions/sorties-miamis/peut-voir-sortie-miamis.ts";
import type { ProfilVisibiliteMiamis } from "../../../../../packages/commun/src/types/sorties-miamis.ts";
import type { LigneParticipationMiamis, LigneSortieMiamis } from "../../services/communaute-regles.ts";
import { lirePublicSortie } from "./lire-public-sortie.ts";

export type VueVisibiliteSortie = {
  moi: number;
  ligne: LigneSortieMiamis;
  participations: readonly LigneParticipationMiamis[];
  profil: ProfilVisibiliteMiamis | null;
  caches: ReadonlySet<number>;
  lieuPublie: boolean;
};

export function estSortieVisible(v: VueVisibiliteSortie): boolean {
  const { ligne, moi } = v;
  if (ligne.annuleeLe !== null || ligne.retireeLe !== null) return false;
  if (ligne.organisateurId === moi) return true;
  if (v.caches.has(ligne.organisateurId)) return false;
  if (v.participations.some((p) => p.compteId === moi)) return true;
  if (!v.lieuPublie || !v.profil || !peutVoirSortieMiamis(lirePublicSortie(ligne.publicType, ligne.publicValeur), v.profil)) return false;
  return !v.participations.some((p) => (p.statut === "accepte" || p.statut === "attente") && v.caches.has(p.compteId));
}
