import type { ReglagesReservationsLus } from "@sos-miam/commun/client-api/contrat-reglages-reservations";
import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import type { Langue } from "@sos-miam/commun/regles/langues";

import { DELAIS_RESERVATION_TEXTES_PAR_LANGUE, MODES_ACCEPTATION_PAR_LANGUE, TEXTES_RESUME_REGLAGES_PAR_LANGUE } from "~/contenus/textes-reglages-reservations";
import { RESUMES_RESERVATIONS_PRO_PAR_LANGUE } from "~/contenus/textes-statut-reservation";

export function resumerReglagesReservations(lus: ReglagesReservationsLus | null, langue: Langue): string {
  const T = choisirTextes(TEXTES_RESUME_REGLAGES_PAR_LANGUE, langue);
  if (lus === null) return T.inconnu;
  if (!lus.reservable) return T.nonReservable;
  const { services, acceptation, delai, joursFermes } = lus.reglages;
  const valeurs = { delai: choisirTextes(DELAIS_RESERVATION_TEXTES_PAR_LANGUE, langue)[delai].court, mode: choisirTextes(MODES_ACCEPTATION_PAR_LANGUE, langue)[acceptation].court };
  const resume =
    services.length === 0
      ? remplirModele(T.tranquille, valeurs)
      : remplirModele(T.services, { ...valeurs, services: choisirTextes(RESUMES_RESERVATIONS_PRO_PAR_LANGUE, langue).services(services.length) });
  if (joursFermes.length === 0) return resume;
  const fermes = joursFermes.length === 1 ? T.joursFermes.un : remplirModele(T.joursFermes.plusieurs, { nombre: String(joursFermes.length) });
  return `${resume} · ${fermes}`;
}
