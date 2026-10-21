import { ecrireHeureMinutes } from "@sos-miam/commun/fonctions/temps/ecrire-heure-minutes";
import { lireMinutesHeure } from "@sos-miam/commun/fonctions/temps/lire-minutes-heure";
import { FIN_SERVICE_MAX_MIN } from "@sos-miam/commun/regles/reglages-reservations";
import type { PasCreneaux } from "@sos-miam/commun/types/reglages-reservations";

export function ajusterDerniereArrivee(premier: string, dernier: string, pas: PasCreneaux): string {
  const debut = lireMinutesHeure(premier);
  const fin = lireMinutesHeure(dernier);
  if (debut === null || fin === null) return dernier;
  const borne = Math.min(Math.max(fin, debut), FIN_SERVICE_MAX_MIN - pas);
  return ecrireHeureMinutes(Math.max(debut, debut + Math.floor((borne - debut) / pas) * pas));
}
