import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import { formaterHeureLangue } from "@sos-miam/commun/fonctions/langue/formater-heure-langue";
import { listerHeuresService } from "@sos-miam/commun/fonctions/reservations/lister-heures-service";
import { nommerServiceReservation } from "@sos-miam/commun/fonctions/reservations/nommer-service-reservation";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { ServiceReservation } from "@sos-miam/commun/types/reglages-reservations";

import { TEXTES_CARTE_SERVICE_PAR_LANGUE } from "~/contenus/textes-reglages-reservations";
import { ecrireNombreCouvertsLangue } from "~/fonctions/langue/ecrire-nombre-couverts-langue";
import { ecrireJoursSemaine } from "~/fonctions/reservations/ecrire-jours-semaine";
import { ecrireNomService } from "~/fonctions/reservations/ecrire-nom-service";

export type ServiceDecrit = { emoji: string; titre: string; jours: string; plage: string; rythme: string; capacite: string; lu: string };

const lireHeure = (heure: string, langue: Langue) => {
  const [h, m] = heure.split(":").map(Number);
  return formaterHeureLangue(h, m, langue);
};

export function decrireServiceReservation(service: ServiceReservation, services: readonly ServiceReservation[], langue: Langue): ServiceDecrit {
  const T = choisirTextes(TEXTES_CARTE_SERVICE_PAR_LANGUE, langue);
  const { emoji, titre } = ecrireNomService(nommerServiceReservation(service, services), langue);
  const nombre = listerHeuresService(service).length;
  const premier = lireHeure(service.premier, langue);
  const dernier = lireHeure(service.dernier, langue);
  const plusieurs = nombre > 1;
  const plage = plusieurs ? remplirModele(T.plage, { premier, dernier }) : premier;
  const rythme = plusieurs ? remplirModele(T.rythme, { pas: String(service.pas), nombre: String(nombre) }) : T.unCreneau;
  const couverts = remplirModele(T.couverts, { couverts: ecrireNombreCouvertsLangue(service.couvertsParService, langue) });
  const capacite =
    service.couvertsParCreneau < service.couvertsParService ? `${couverts} · ${remplirModele(T.arrivees, { arrivees: String(service.couvertsParCreneau) })}` : couverts;
  const jours = ecrireJoursSemaine(service.jours, langue);
  const valeurs = { titre, jours, premier, dernier, rythme, capacite: capacite.replace(" · ", ", ") };
  return { emoji, titre, jours, plage, rythme, capacite, lu: remplirModele(plusieurs ? T.lu : T.luUnCreneau, valeurs) };
}
