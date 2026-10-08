import type { Visite } from "../../types/visite.ts";

/**
 * Où en est l'avis d'une visite : aucun (pas de visite validée), à venir (dans moins d'une heure), ouvert, donné,
 * ou fermé (14 jours passés). Des dates illisibles comptent comme un avis fermé.
 */
export function decrireEtatAvis(avis: Visite["avis"], maintenantMs: number): "aucun" | "a-venir" | "ouvert" | "donne" | "ferme" {
  if (avis === null) return "aucun";
  if (avis.donne) return "donne";
  const ouvertLeMs = Date.parse(avis.ouvertLe);
  const fermeLeMs = Date.parse(avis.fermeLe);
  if (Number.isNaN(ouvertLeMs) || Number.isNaN(fermeLeMs)) return "ferme";
  if (maintenantMs < ouvertLeMs) return "a-venir";
  if (maintenantMs >= fermeLeMs) return "ferme";
  return "ouvert";
}
