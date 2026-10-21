import { peutVoirSortieMiamis } from "../../../../../packages/commun/src/fonctions/sorties-miamis/peut-voir-sortie-miamis.ts";
import type { ProfilVisibiliteMiamis } from "../../../../../packages/commun/src/types/sorties-miamis.ts";
import type { LigneParticipationMiamis, LigneSortieMiamis } from "../../services/communaute-regles.ts";
import { estInvitationHabitueValable } from "./est-invitation-habitue-valable.ts";
import { lirePublicSortie } from "./lire-public-sortie.ts";

export type VueVisibiliteSortie = {
  moi: number;
  ligne: LigneSortieMiamis;
  participations: readonly LigneParticipationMiamis[];
  profil: ProfilVisibiliteMiamis | null;
  villeCle: string | null;
  caches: ReadonlySet<number>;
  lieuPublie: boolean;
  maintenant: Date;
};

const EN_COURS_AVANT_LA_SORTIE: ReadonlySet<string> = new Set(["attente", "demande"]);

function gardeUnePlace(p: LigneParticipationMiamis, aVenir: boolean, maintenant: Date): boolean {
  if (p.statut === "accepte") return true;
  return aVenir && (EN_COURS_AVANT_LA_SORTIE.has(p.statut) || estInvitationHabitueValable(p, maintenant));
}

export function estSortieVisible(v: VueVisibiliteSortie): boolean {
  const { ligne, moi } = v;
  if (ligne.annuleeLe !== null || ligne.retireeLe !== null) return false;
  if (ligne.organisateurId === moi) return true;
  if (v.caches.has(ligne.organisateurId)) return false;
  const aVenir = ligne.quand.getTime() > v.maintenant.getTime();
  const mienne = v.participations.find((p) => p.compteId === moi);
  if (mienne && gardeUnePlace(mienne, aVenir, v.maintenant)) return true;
  if (!aVenir || v.villeCle === null || v.villeCle !== ligne.villeCle) return false;
  if (!v.lieuPublie || !v.profil || !peutVoirSortieMiamis(lirePublicSortie(ligne.publicType, ligne.publicValeur), v.profil)) return false;
  return !v.participations.some((p) => (p.statut === "accepte" || p.statut === "attente") && v.caches.has(p.compteId));
}
