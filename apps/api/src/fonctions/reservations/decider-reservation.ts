import { faireEvoluerReservation } from "../../../../../packages/commun/src/fonctions/reservations/faire-evoluer-reservation.ts";
import type { EvenementReservation } from "../../../../../packages/commun/src/types/reservation.ts";
import type { ChampsReservation, LigneReservation } from "../../services/reservations-regles.ts";
import type { TablesVisites } from "../../services/visites-regles.ts";

export type ReservationDecidee =
  | { ok: true; reservation: LigneReservation; creerVisite: boolean }
  | { ok: false; erreur: "transition-interdite" | "delai-depasse" | "hors-fenetre-presence" };

/**
 * Fait évoluer une réservation avec la machine à états de packages/commun (faireEvoluerReservation) et l'écrit, dans la
 * transaction. `parId` : le membre de l'équipe qui agit (null : le client). Écrit aussi le motif (refus, annulation par le
 * lieu), l'heure de la réponse (accepter, refuser), « tardive » (annulation du client) et `enPlus` (le code d'arrivée).
 * `creerVisite` : « Venu » et « Je suis là » sont réunis, la visite est à créer par l'appelant.
 */
export async function deciderReservation(
  t: TablesVisites, r: LigneReservation, evenement: EvenementReservation, maintenant: Date, parId: number | null, enPlus: ChampsReservation = {},
): Promise<ReservationDecidee> {
  const transition = faireEvoluerReservation(
    { statut: r.statut, creneau: r.creneau.toISOString(), presenceLe: r.presenceLe?.toISOString() ?? null },
    evenement,
    maintenant.getTime(),
  );
  if (!transition.ok) return transition;
  const champs: ChampsReservation = {
    statut: transition.statut,
    presenceLe: transition.presenceLe === null ? null : new Date(transition.presenceLe),
    ...(evenement.type === "annuler-client" ? { tardive: transition.tardive } : {}),
    ...(evenement.type === "refuser" || evenement.type === "annuler-lieu" ? { motifRefus: evenement.motif } : {}),
    ...(evenement.type === "accepter" || evenement.type === "refuser" ? { reponduLe: maintenant } : {}),
    ...(parId !== null ? { reponduParId: parId } : {}),
    ...enPlus,
  };
  await t.modifierReservation(r.id, champs);
  return { ok: true, reservation: { ...r, ...champs }, creerVisite: transition.effets.some((e) => e.type === "creer-visite") };
}
