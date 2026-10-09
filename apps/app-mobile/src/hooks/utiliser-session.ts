import { createContext, useContext } from "react";

import type { ClientHttp } from "@sos-miam/commun/client-api/client-http";
import type { ServiceActivite } from "@sos-miam/commun/client-api/contrat-activite";
import type { ServiceCompte, SessionOuverte } from "@sos-miam/commun/client-api/contrat-compte";
import type { ServiceContenu } from "@sos-miam/commun/client-api/contrat-contenu";
import type { CompteApp } from "@sos-miam/commun/types/compte-app";

export type ValeurSession = {
  /** Faux tant que le jeton n'est pas relu dans le coffre-fort */
  pret: boolean;
  /** Un vrai compte est connecté (jeton gardé) */
  connecte: boolean;
  /** Le compte relu sur le serveur ; null tant qu'il n'est pas lu (ou hors ligne) */
  compte: CompteApp | null;
  /** Le client HTTP de l'API (session comprise) et les services qui ne passent pas par utiliserServices */
  client: ClientHttp;
  comptes: ServiceCompte;
  contenu: ServiceContenu;
  activite: ServiceActivite;
  /** Après une inscription ou une connexion réussie : garde le jeton et le compte */
  ouvrir: (session: SessionOuverte) => Promise<void>;
  /** Déconnexion (le serveur est prévenu s'il répond), session expirée ou compte supprimé : tout est oublié sur le téléphone */
  fermer: (o?: { prevenirServeur?: boolean }) => Promise<void>;
  /** Relit le compte (points, rôles, e-mail confirmé…) */
  rafraichir: () => Promise<void>;
};

export const ContexteSession = createContext<ValeurSession | null>(null);

/** La session du compte unique (jeton dans le coffre-fort, compte relu sur le serveur), fournie par FournisseurSession. */
export function utiliserSession(): ValeurSession {
  const valeur = useContext(ContexteSession);
  if (!valeur) throw new Error("utiliserSession doit être appelé sous <FournisseurSession>.");
  return valeur;
}
