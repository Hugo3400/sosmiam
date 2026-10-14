import { createContext, useContext } from "react";

import type { CibleCloche, TypeCloche } from "@sos-miam/commun/types/cloche";
import type { PersonneResume } from "@sos-miam/commun/types/social";
import type { NotificationSuivi, NouvelleNotificationSuivi } from "@sos-miam/commun/types/suivis";

/**
 * Une notification de la cloche du serveur (compte connecté) que la démo ne connaît pas : bande, sorties, groupes, listes,
 * commentaires et modération. « … te suit » et « demande acceptée » gardent la forme de la démo (NotificationSuivi).
 * Le texte est écrit par l'app (decrireNotificationSuivi).
 */
export type NotificationCloche = {
  type: "cloche";
  sorte: Exclude<TypeCloche, "nouvel-abonne" | "demande-acceptee">;
  id: string;
  date: string;
  /** null : personne en particulier (l'équipe SOS Miam, la fin d'un vote, un lien changé tout seul, un lieu) */
  acteur: PersonneResume | null;
  cible: { type: CibleCloche; id: string } | null;
  detail: string | null;
};

/** Ce que montre l'écran Notifications : la démo, plus les types de la cloche du serveur */
export type NotificationApp = NotificationSuivi | NotificationCloche;

export type EtatNotifications = {
  /** Faux tant que le stockage, l'activité et la communauté ne sont pas relus (ou sans profil : visite sans compte) */
  pret: boolean;
  /** Déjà filtrées (bloqués, âge, publication masquée), de la plus récente à la plus ancienne */
  notifications: NotificationApp[];
  /** Arrivées depuis ta dernière visite de l'écran Notifications (la pastille ajoute les demandes reçues) */
  nonVues: number;
  /** Date de la visite précédente : l'écran met en avant ce qui est plus récent */
  vuesLe: string | null;
  /** Stable (useCallback) : ne fait pas redessiner ceux qui l'appellent. Compte connecté : rien, c'est le serveur qui écrit */
  ajouter: (notification: NouvelleNotificationSuivi) => void;
  marquerToutVu: () => void;
  effacer: () => Promise<void>;
};

export const ContexteNotifications = createContext<EtatNotifications | null>(null);

/** Les notifications de l'app (« … te suit », demande acceptée, nouveauté d'un compte suivi, cloche du serveur), fournies par FournisseurNotifications. */
export function utiliserNotifications(): EtatNotifications {
  const etat = useContext(ContexteNotifications);
  if (!etat) throw new Error("utiliserNotifications doit être appelé sous <FournisseurNotifications>.");
  return etat;
}
