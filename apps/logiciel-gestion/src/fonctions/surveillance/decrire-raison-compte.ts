import type { RaisonCompte, SeuilsSurveillance } from "../../services/surveillance.ts";
import { formaterDate } from "../texte/formater-date.ts";

/** Pourquoi un compte est signalé, en une phrase : « 6 visites validées le 9 oct. 2026 (plus de 4 dans la journée) ». */
export function decrireRaisonCompte(raison: RaisonCompte, seuils: SeuilsSurveillance): string {
  if (raison.type === "par-jour") {
    return `${raison.validees} visites validées le ${formaterDate(`${raison.jour}T12:00:00Z`)} (plus de ${seuils.parJour} dans la journée)`;
  }
  return `${raison.refusees} refus sur ${raison.decidees} visites (${raison.part} %), venant de ${raison.lieux} lieux différents`;
}
