import { useCallback } from "react";

import { utiliserCompteRequis, type RaisonCompte } from "~/hooks/utiliser-compte-requis";

/** Ce que la personne voulait faire, côté visites, quand on lui demande de créer son compte */
export type RaisonDemandeCompte = "scan" | "addition" | "reserver" | "fidelite" | "avis";

/**
 * Raison montrée par la feuille « Crée ton compte » (src/contenus/raisons-compte.ts). Pour l'instant, toutes les entrées
 * des visites disent « valider tes visites » : des raisons plus précises s'ajouteront à RaisonCompte, puis ici.
 */
const RAISONS_FEUILLE: Readonly<Record<RaisonDemandeCompte, RaisonCompte>> = {
  scan: "scan",
  addition: "scan",
  reserver: "scan",
  fidelite: "scan",
  avis: "scan",
};

/**
 * À appeler aux entrées des visites (onglet Scan, Demander l'addition, Scanner, Réserver, Utiliser ma récompense,
 * Donner mon avis) : `if (!demanderCompte("addition")) return;`. Vrai si la personne a un compte ; sinon, la feuille
 * « Crée ton compte » de la visite sans compte s'ouvre (voir utiliserCompteRequis) et c'est faux.
 * La fonction rendue reste la même d'un rendu à l'autre.
 */
export function utiliserDemandeCompte(): (raison: RaisonDemandeCompte) => boolean {
  const exigerCompte = utiliserCompteRequis();
  return useCallback((raison: RaisonDemandeCompte) => exigerCompte(RAISONS_FEUILLE[raison]), [exigerCompte]);
}
