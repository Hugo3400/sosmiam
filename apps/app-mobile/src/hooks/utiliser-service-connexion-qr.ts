import type { ServiceCompte } from "@sos-miam/commun/client-api/contrat-compte";
import { utiliserSession } from "~/hooks/utiliser-session";
import { connexionQrDemo } from "~/services/demo/connexion-qr-demo";
import { DEMO_VISITES_ACTIVE } from "~/services/demo/demo-visites-active";

/** Les 4 gestes de la connexion par QR code (contrat de la session Site : /comptes/qr, /comptes/qr/attente, /app/qr/…) */
export type ServiceConnexionQr = Pick<ServiceCompte, "demanderConnexionQr" | "attendreConnexionQr" | "scannerConnexionQr" | "repondreConnexionQr">;

/**
 * Le service de la connexion par QR code : celui du compte (l'API), sauf en mode démo, où tout est simulé sur le téléphone
 * (rien ne part sur le réseau, aucune vraie session n'est ouverte).
 */
export function utiliserServiceConnexionQr(): {
  service: ServiceConnexionQr;
  demo: boolean;
} {
  const { comptes } = utiliserSession();
  return DEMO_VISITES_ACTIVE ? { service: connexionQrDemo, demo: true } : { service: comptes, demo: false };
}
