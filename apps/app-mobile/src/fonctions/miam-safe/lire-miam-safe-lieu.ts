import { calculerRepereSentiBien } from "@sos-miam/commun/fonctions/miam-safe/calculer-repere-senti-bien";
import { LIEUX_MIAM_SAFE_EXEMPLES } from "~/contenus/miam-safe";

/** Ce que la fiche montre de Miam Safe pour un lieu */
export type MiamSafeLieu = {
  /** Le lieu a signé la charte : badge, phrase et alerte silencieuse au comptoir */
  engage: boolean;
  /** « Les Miamis s'y sentent bien » (90 % de oui sur au moins 20 réponses) */
  repere: boolean;
};

/** Miam Safe pour ce lieu (démo : données d'exemple, en attendant l'API). */
export function lireMiamSafeLieu(lieuId: number): MiamSafeLieu {
  const donnees = LIEUX_MIAM_SAFE_EXEMPLES[lieuId];
  if (!donnees) return { engage: false, repere: false };
  return { engage: true, repere: calculerRepereSentiBien(donnees.oui, donnees.reponses) };
}
