import type { LieuResume } from "../../../../../packages/commun/src/types/lieu-resume.ts";
import type { MessagePush } from "../../services/notifications/expedier-push.ts";
import type { LigneReservation } from "../../services/reservations-regles.ts";
import { ajouterPreventionReservation } from "./ajouter-prevention-reservation.ts";
import { ecrireHeureReservation } from "./ecrire-heure-reservation.ts";
import { ecrireMomentReservation } from "./ecrire-moment-reservation.ts";

const LIEN = "/pro/reservations";

export function ecrireNotificationNouvelleTable(
  r: Pick<LigneReservation, "personnes" | "creneau" | "creneauxProposes" | "statut">, lieu: LieuResume, maintenant: Date,
): MessagePush {
  const plusieurs = r.personnes > 1;
  const groupe = `${r.personnes} ${plusieurs ? "gourmands" : "gourmand"}`;
  if (r.statut === "acceptee") {
    const texte = `${lieu.nom} : ${groupe} ${plusieurs ? "arrivent" : "arrive"} ${ecrireMomentReservation(r.creneau, maintenant)}. C'est accepté tout seul, le code d'arrivée est au comptoir.`;
    return { titre: "Une résa de plus ⚡", texte: ajouterPreventionReservation(texte, lieu), lien: LIEN };
  }
  const [premier, ...autres] = r.creneauxProposes.length > 0 ? r.creneauxProposes : [r.creneau];
  const plansB = autres.length > 0 ? ` (ou ${autres.map(ecrireHeureReservation).join(", ")})` : "";
  const quoi = lieu.type === "sortie" ? "une place" : "une table";
  const texte = `${lieu.nom} : ${groupe} ${plusieurs ? "demandent" : "demande"} ${quoi} ${ecrireMomentReservation(premier!, maintenant)}${plansB}. À toi de répondre au comptoir !`;
  return { titre: "Nouvelle demande de résa 🛎️", texte: ajouterPreventionReservation(texte, lieu), lien: LIEN };
}
