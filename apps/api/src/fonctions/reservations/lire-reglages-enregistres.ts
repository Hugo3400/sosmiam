import { nettoyerJoursFermes } from "../../../../../packages/commun/src/fonctions/reservations/nettoyer-jours-fermes.ts";
import { DELAIS_RESERVATION, MODES_ACCEPTATION_RESERVATION, REGLAGES_RESERVATIONS_DEFAUT } from "../../../../../packages/commun/src/regles/reglages-reservations.ts";
import type { DelaiReservation, ModeAcceptationReservation, ReglagesReservations } from "../../../../../packages/commun/src/types/reglages-reservations.ts";
import { validerReglagesReservations } from "../../../../../packages/commun/src/validation/valider-reglages-reservations.ts";

export type ReglagesEnregistres = { services: unknown; acceptation: string; delai: string; joursFermes: readonly string[] | null };

export function lireReglagesEnregistres(r: ReglagesEnregistres, maintenant: Date): ReglagesReservations {
  const joursFermes = nettoyerJoursFermes(r.joursFermes ?? [], maintenant);
  const delai = DELAIS_RESERVATION.includes(r.delai as DelaiReservation) ? (r.delai as DelaiReservation) : REGLAGES_RESERVATIONS_DEFAUT.delai;
  const acceptation = MODES_ACCEPTATION_RESERVATION.includes(r.acceptation as ModeAcceptationReservation) ? (r.acceptation as ModeAcceptationReservation) : "manuelle";
  for (const essai of [{ services: r.services, acceptation, delai }, { services: r.services, acceptation: "manuelle", delai }]) {
    const lu = validerReglagesReservations(essai);
    if (lu.ok) return { ...lu.reglages, joursFermes };
  }
  return { services: [], acceptation: "manuelle", delai, joursFermes };
}
