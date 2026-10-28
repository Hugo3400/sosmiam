import type { ServiceCompte } from "@sos-miam/commun/client-api/contrat-compte";
import { utiliserSession } from "~/hooks/utiliser-session";

/** Les 4 gestes de la connexion par QR code (contrat de la session Site : /comptes/qr, /comptes/qr/attente, /app/qr/…) */
export type ServiceConnexionQr = Pick<ServiceCompte, "demanderConnexionQr" | "attendreConnexionQr" | "scannerConnexionQr" | "repondreConnexionQr">;

export function utiliserServiceConnexionQr(): { service: ServiceConnexionQr } {
  const { comptes } = utiliserSession();
  return { service: comptes };
}
