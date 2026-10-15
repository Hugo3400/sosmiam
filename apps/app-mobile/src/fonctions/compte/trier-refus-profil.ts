import type { DetailsErreur } from "@sos-miam/commun/client-api/reponse-api";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { AnnonceSynchro, ChampSynchro } from "~/stockage/synchro-profil";

/**
 * Un refus définitif du serveur pour des champs partis du téléphone (un refus n'écrit rien) : ceux qui quittent la file
 * pour que le reste puisse repartir, et l'annonce qu'il mérite. Pseudo pris : le pseudo seul (jamais parti, il s'efface du
 * téléphone) ; compte limité : prénom et pseudo (ils restent ceux du serveur, avec une annonce si le prénom était du
 * voyage) ; champ invalide : ce champ-là ; sinon, tout ce qui est parti.
 */
export function trierRefusProfil(
  refus: { erreur: ErreurService; champ?: string; details?: DetailsErreur },
  partis: readonly ChampSynchro[],
): { retirer: ChampSynchro[]; annonce: AnnonceSynchro | null } {
  const champ = partis.find((c) => c === refus.champ);
  if (refus.erreur === "pseudo-pris" && partis.includes("pseudo")) return { retirer: ["pseudo"], annonce: null };
  if (refus.erreur === "compte-limite" && (partis.includes("prenom") || partis.includes("pseudo"))) {
    const annonce: AnnonceSynchro | null = partis.includes("prenom") ? { type: "prenom-limite", jusqua: refus.details?.jusqua ?? null } : null;
    return { retirer: ["prenom", "pseudo"], annonce };
  }
  if (refus.erreur === "champ-invalide" && champ) return { retirer: [champ], annonce: null };
  return { retirer: [...partis], annonce: null };
}
