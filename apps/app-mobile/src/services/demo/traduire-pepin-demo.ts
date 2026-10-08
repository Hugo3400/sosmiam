import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";

import type { PepinDemo } from "./types-demo";

type Echec = Extract<ReponseApi, { ok: false }>;

/**
 * L'échec simulé par un pépin des Coulisses (« environ 1,2 km », « à 800 m près », pas de réseau, QR déjà changé).
 * null pour « refus-lieu » (la demande est créée, puis refusée) ou sans pépin.
 */
export function traduirePepinDemo(pepin: PepinDemo | null, lieuNom: string): Echec | null {
  switch (pepin) {
    case "hors-zone":
      return { ok: false, erreur: "hors-zone", details: { distanceM: 1200, lieu: lieuNom } };
    case "position-imprecise":
      return { ok: false, erreur: "position-imprecise", details: { precisionM: 800 } };
    case "hors-ligne":
      return { ok: false, erreur: "hors-ligne" };
    case "qr-expire":
      return { ok: false, erreur: "qr-expire" };
    default:
      return null;
  }
}
