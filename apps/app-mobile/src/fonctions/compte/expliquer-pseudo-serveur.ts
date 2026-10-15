import type { DecisionModerationApi } from "@sos-miam/commun/types/signalement";
import { estPseudoNeutre } from "~/fonctions/compte/est-pseudo-neutre";
import type { AnnonceSynchro, SynchroProfil } from "~/stockage/synchro-profil";

type Explication = { annonce: AnnonceSynchro | null; misDeCote: SynchroProfil["pseudoMisDeCote"] };

/**
 * Le serveur montre `nouveau` à la place d'`ancien` (le pseudo d'avant : celui du serveur, ou celui du téléphone à la
 * première synchro). C'est l'équipe si `decision` est une décision qui a retenu ton profil, ou, si la liste ne se lit pas,
 * si `nouveau` a la forme d'un pseudo neutre : l'ancien est alors mis de côté (réservé pour personne pendant
 * `reservationMs`), et un pseudo neutre s'annonce. Sinon, rien à dire (un autre téléphone du compte), sauf à la première
 * synchro (`premiere`) : le changement fait sur ce téléphone n'était jamais parti, on le dit.
 */
export function expliquerPseudoServeur(
  ancien: string | null,
  nouveau: string,
  decision: DecisionModerationApi | null | "illisible",
  premiere: boolean,
  reservationMs: number,
  maintenant: number = Date.now(),
): Explication {
  const neutre = estPseudoNeutre(nouveau);
  const parLEquipe = decision === "illisible" ? neutre : decision !== null;
  if (!parLEquipe) return { annonce: premiere ? { type: "pseudo-du-serveur", pseudo: nouveau } : null, misDeCote: null };
  const decideLe = decision !== "illisible" && decision?.decideLe ? Date.parse(decision.decideLe) : maintenant;
  return {
    annonce: neutre ? { type: "pseudo-neutre", pseudo: nouveau } : null,
    misDeCote: ancien ? { pseudo: ancien, jusqua: new Date((Number.isFinite(decideLe) ? decideLe : maintenant) + reservationMs).toISOString() } : null,
  };
}
