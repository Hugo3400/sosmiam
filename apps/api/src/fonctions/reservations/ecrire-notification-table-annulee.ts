import type { LieuResume } from "../../../../../packages/commun/src/types/lieu-resume.ts";
import type { MessagePush } from "../../services/notifications/expedier-push.ts";
import type { LigneReservation } from "../../services/reservations-regles.ts";
import { ajouterPreventionReservation } from "./ajouter-prevention-reservation.ts";
import { ecrireMomentReservation } from "./ecrire-moment-reservation.ts";

const LIEN = "/pro/reservations";

export function ecrireNotificationTableAnnulee(r: Pick<LigneReservation, "personnes" | "creneau">, lieu: LieuResume, maintenant: Date): MessagePush {
  const plusieurs = r.personnes > 1;
  const sortie = lieu.type === "sortie";
  const quoi = sortie ? (plusieurs ? "leurs places" : "sa place") : plusieurs ? "leur table" : "sa table";
  const texte = `${lieu.nom} : ${r.personnes} ${plusieurs ? "gourmands annulent" : "gourmand annule"} ${quoi} ${ecrireMomentReservation(r.creneau, maintenant)}. De la place à redonner !`;
  return { titre: sortie ? "Une place se libère 🪑" : "Une table se libère 🪑", texte: ajouterPreventionReservation(texte, lieu), lien: LIEN };
}
