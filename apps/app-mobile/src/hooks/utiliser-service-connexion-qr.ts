import { connexionQrDemo, type ServiceConnexionQr } from "~/services/demo/connexion-qr-demo";

/**
 * Le service de la connexion par QR code : pour l'instant seulement dans l'aperçu de développement (démo, rien sur le
 * réseau), en attendant les routes de l'API de la session Site ; null ailleurs, et les entrées (Mon compte, Me connecter)
 * restent cachées. Quand l'API sera en ligne, c'est ici seulement qu'on passera au vrai client.
 */
export function utiliserServiceConnexionQr(): { service: ServiceConnexionQr | null; demo: boolean } {
  return __DEV__ ? { service: connexionQrDemo, demo: true } : { service: null, demo: false };
}
