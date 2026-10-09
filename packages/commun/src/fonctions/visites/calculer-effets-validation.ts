import type { EffetVisite, ReglementVisite } from "../../types/visite.ts";
import { calculerOuvertureAvis } from "./calculer-ouverture-avis.ts";
import { calculerPointsVisite } from "./calculer-points-visite.ts";

/**
 * Ce que débloque une visite validée : les points (visite ou visite pendant un SOS), un tampon et l'ouverture de l'avis.
 * Offerte par le lieu : seulement l'avis (marqué « Repas offert »), ni points ni tampon (décidé le 9 octobre 2026).
 */
export function calculerEffetsValidation(pendantSos: boolean, valideLeMs: number, delaiAvisMs?: number, reglement: ReglementVisite | null = null): EffetVisite[] {
  const { ouvertLe, fermeLe } = calculerOuvertureAvis(valideLeMs, delaiAvisMs);
  if (reglement?.type === "offert") return [{ type: "ouvrir-avis", ouvertLe, fermeLe }];
  return [
    { type: "points", valeur: calculerPointsVisite(pendantSos), raison: pendantSos ? "visite-sos" : "visite" },
    { type: "tampon", delta: 1 },
    { type: "ouvrir-avis", ouvertLe, fermeLe },
  ];
}
