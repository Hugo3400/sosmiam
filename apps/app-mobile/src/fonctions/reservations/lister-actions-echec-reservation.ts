import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";

import type { ActionEchecVisite } from "~/composants/visites/MessageEchecVisite";

const A_REESSAYER: readonly ErreurService[] = [
  "hors-ligne",
  "position-refusee",
  "position-coupee",
  "position-introuvable",
  "position-approximative",
  "position-imprecise",
  "position-perimee",
  "position-simulee",
  "hors-zone",
];

const A_REGLER_DANS_LE_TELEPHONE: readonly ErreurService[] = ["position-bloquee", "position-approximative"];

export function listerActionsEchecReservation(erreur: ErreurService, o: { reessayer: () => void; ouvrirReglages: () => void }): ActionEchecVisite[] {
  const actions: ActionEchecVisite[] = [];
  if (A_REGLER_DANS_LE_TELEPHONE.includes(erreur)) actions.push({ libelle: "Ouvrir les réglages", onPress: o.ouvrirReglages });
  if (A_REESSAYER.includes(erreur)) actions.push({ libelle: "Réessayer", variante: actions.length > 0 ? "blanc" : "jaune", onPress: o.reessayer });
  return actions;
}
