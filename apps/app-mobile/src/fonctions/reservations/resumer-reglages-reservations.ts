import type { ReglagesReservationsLus } from "@sos-miam/commun/client-api/contrat-reglages-reservations";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";

import { DELAIS_RESERVATION_TEXTES, MODES_ACCEPTATION, TEXTES_RESUME_REGLAGES as T } from "~/contenus/textes-reglages-reservations";

export function resumerReglagesReservations(lus: ReglagesReservationsLus | null): string {
  if (lus === null) return T.inconnu;
  if (!lus.reservable) return T.nonReservable;
  const { services, acceptation, delai, joursFermes } = lus.reglages;
  const valeurs = { delai: DELAIS_RESERVATION_TEXTES[delai].court, mode: MODES_ACCEPTATION[acceptation].court };
  const resume =
    services.length === 0
      ? remplirModele(T.tranquille, valeurs)
      : remplirModele(T.services, { ...valeurs, services: `${services.length} service${services.length > 1 ? "s" : ""}` });
  if (joursFermes.length === 0) return resume;
  const fermes = joursFermes.length === 1 ? T.joursFermes.un : remplirModele(T.joursFermes.plusieurs, { nombre: String(joursFermes.length) });
  return `${resume} · ${fermes}`;
}
