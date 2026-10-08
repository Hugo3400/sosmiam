import type { EffetVisite } from "../../types/visite.ts";
import { calculerOuvertureAvis } from "./calculer-ouverture-avis.ts";
import { calculerPointsVisite } from "./calculer-points-visite.ts";

/** Ce que débloque une visite validée : les points (visite ou visite pendant un SOS), un tampon et l'ouverture de l'avis. */
export function calculerEffetsValidation(pendantSos: boolean, valideLeMs: number, delaiAvisMs?: number): EffetVisite[] {
  const { ouvertLe, fermeLe } = calculerOuvertureAvis(valideLeMs, delaiAvisMs);
  return [
    { type: "points", valeur: calculerPointsVisite(pendantSos), raison: pendantSos ? "visite-sos" : "visite" },
    { type: "tampon", delta: 1 },
    { type: "ouvrir-avis", ouvertLe, fermeLe },
  ];
}
