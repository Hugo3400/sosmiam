// Assemble les services de la démo (source « demo »). Ce qui n'est pas encore construit répond comme les services
// indisponibles (listes vides, actions « service-indisponible »), mais s'abonne déjà au magasin.
// Lot 2 : comptoir = { ...creerComptoirDemo(ctx) }. Lot 3 : reservations = creerReservationsDemo(ctx), et
// ...creerReservationsProDemo(ctx) dans le comptoir. Lot 4 : avis = creerAvisDemo(ctx), ...creerAvisProDemo(ctx) dans le
// comptoir, ambassadeur = creerEspaceAmbassadeurDemo(ctx).
import type { Services } from "@sos-miam/commun/client-api/services";

import { creerServicesIndisponibles } from "../creer-services-indisponibles";
import { creerFideliteDemo } from "./fidelite-demo";
import type { ContexteDemo } from "./types-demo";
import { creerVisitesDemo } from "./visites-demo";

/** Les services joués sur le téléphone (démo des visites, en développement seulement). */
export function creerServicesDemo(ctx: ContexteDemo): Services {
  const enAttente = creerServicesIndisponibles();
  const ecouter = (rappel: () => void) => ctx.magasin.ecouter(rappel);
  return {
    source: "demo",
    visites: creerVisitesDemo(ctx),
    fidelite: creerFideliteDemo(ctx),
    reservations: { ...enAttente.reservations },
    avis: { ...enAttente.avis },
    comptoir: { ...enAttente.comptoir, ecouter },
    ambassadeur: { ...enAttente.ambassadeur, ecouter },
  };
}
