import type { AcceptationHoraire, DemandeAAccepter } from "../../types/decisions-reservations.ts";
import type { OccupationReservation, ReglagesReservations } from "../../types/reglages-reservations.ts";
import { calculerLimiteReponseReservation } from "./calculer-limite-reponse-reservation.ts";
import { calculerPropositionsReservation } from "./calculer-propositions-reservation.ts";
import { choisirHoraireParDefaut } from "./choisir-horaire-par-defaut.ts";

export type ContexteAcceptation = {
  reglages: ReglagesReservations | null;
  occupees: readonly OccupationReservation[];
  maintenant: Date;
};

export function verifierAcceptationHoraire(
  demande: DemandeAAccepter,
  choisi: string | null,
  c: ContexteAcceptation,
  depasser: boolean,
): AcceptationHoraire {
  const propositions = calculerPropositionsReservation({ ...demande, statut: "demandee" }, c.reglages, c.occupees).map((p) => ({
    ...p,
    instant: Date.parse(p.creneau),
  }));
  const viseMs = choisi === null ? null : Date.parse(choisi);
  if (viseMs !== null && (Number.isNaN(viseMs) || !propositions.some((p) => p.instant === viseMs))) return { ok: false, erreur: "horaire-non-propose" };
  const limite = Date.parse(calculerLimiteReponseReservation({ ...demande, statut: "demandee" }, c.reglages) ?? "");
  if (Number.isNaN(limite) || c.maintenant.getTime() >= limite) return { ok: false, erreur: "delai-depasse" };
  const parDefaut = choisirHoraireParDefaut(propositions, demande.personnes);
  const retenuMs = viseMs ?? (parDefaut === null ? null : Date.parse(parDefaut));
  const vise = propositions.find((p) => p.instant === retenuMs) ?? propositions[0]!;
  const creneau = new Date(vise.instant).toISOString();
  const places = vise.places === null ? null : Math.max(0, vise.places);
  const depassement = places === null ? 0 : Math.max(0, demande.personnes - places);
  if (!depasser && vise.jourFerme) return { ok: false, erreur: "jour-ferme", creneau, places };
  if (!depasser && depassement > 0) return { ok: false, erreur: "capacite-depassee", creneau, places };
  return { ok: true, creneau, depassement, horsReglages: vise.horsReglages, jourFerme: vise.jourFerme };
}
