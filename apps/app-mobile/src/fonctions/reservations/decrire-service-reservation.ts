import { listerHeuresService } from "@sos-miam/commun/fonctions/reservations/lister-heures-service";
import { nommerServiceReservation } from "@sos-miam/commun/fonctions/reservations/nommer-service-reservation";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import type { ServiceReservation } from "@sos-miam/commun/types/reglages-reservations";

import { TEXTES_CARTE_SERVICE as T } from "~/contenus/textes-reglages-reservations";
import { formaterHeure } from "~/fonctions/dates/formater-heure";
import { ecrireJoursSemaine } from "~/fonctions/reservations/ecrire-jours-semaine";
import { ecrireNombreCouverts } from "~/fonctions/reservations/ecrire-nombre-couverts";
import { ecrireNomService } from "~/fonctions/reservations/ecrire-nom-service";

export type ServiceDecrit = { emoji: string; titre: string; jours: string; plage: string; rythme: string; capacite: string; lu: string };

export function decrireServiceReservation(service: ServiceReservation, services: readonly ServiceReservation[]): ServiceDecrit {
  const { emoji, titre } = ecrireNomService(nommerServiceReservation(service, services));
  const nombre = listerHeuresService(service).length;
  const premier = formaterHeure(service.premier);
  const dernier = formaterHeure(service.dernier);
  const plusieurs = nombre > 1;
  const plage = plusieurs ? remplirModele(T.plage, { premier, dernier }) : premier;
  const rythme = plusieurs ? remplirModele(T.rythme, { pas: String(service.pas), nombre: String(nombre) }) : T.unCreneau;
  const couverts = remplirModele(T.couverts, { couverts: ecrireNombreCouverts(service.couvertsParService) });
  const capacite =
    service.couvertsParCreneau < service.couvertsParService ? `${couverts} · ${remplirModele(T.arrivees, { arrivees: String(service.couvertsParCreneau) })}` : couverts;
  const jours = ecrireJoursSemaine(service.jours);
  const valeurs = { titre, jours, premier, dernier, rythme, capacite: capacite.replace(" · ", ", ") };
  return { emoji, titre, jours, plage, rythme, capacite, lu: remplirModele(plusieurs ? T.lu : T.luUnCreneau, valeurs) };
}
