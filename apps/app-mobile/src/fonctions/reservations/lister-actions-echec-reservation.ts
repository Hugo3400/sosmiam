import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";

import type { ActionEchecVisite } from "~/composants/visites/MessageEchecVisite";
import { CARTE_RESERVATION_PAR_LANGUE } from "~/contenus/textes-reservations-client";

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

export function listerActionsEchecReservation(erreur: ErreurService, o: { reessayer: () => void; ouvrirReglages: () => void }, langue: Langue): ActionEchecVisite[] {
  const T = choisirTextes(CARTE_RESERVATION_PAR_LANGUE, langue);
  const actions: ActionEchecVisite[] = [];
  if (A_REGLER_DANS_LE_TELEPHONE.includes(erreur)) actions.push({ libelle: T.ouvrirReglages, onPress: o.ouvrirReglages });
  if (A_REESSAYER.includes(erreur)) actions.push({ libelle: T.reessayer, variante: actions.length > 0 ? "blanc" : "jaune", onPress: o.reessayer });
  return actions;
}
