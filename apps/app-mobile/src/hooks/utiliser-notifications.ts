import { createContext, useContext } from "react";

import type { NotificationSuivi, NouvelleNotificationSuivi } from "@sos-miam/commun/types/suivis";

export type EtatNotifications = {
  /** Faux tant que le stockage, l'activité et la communauté ne sont pas relus (ou sans profil : visite sans compte) */
  pret: boolean;
  /** Déjà filtrées (bloqués, âge, publication masquée), de la plus récente à la plus ancienne */
  notifications: NotificationSuivi[];
  /** Arrivées depuis ta dernière visite de l'écran Notifications (la pastille ajoute les demandes reçues) */
  nonVues: number;
  /** Date de la visite précédente : l'écran met en avant ce qui est plus récent */
  vuesLe: string | null;
  /** Stable (useCallback) : ne fait pas redessiner ceux qui l'appellent */
  ajouter: (notification: NouvelleNotificationSuivi) => void;
  marquerToutVu: () => void;
  effacer: () => Promise<void>;
};

export const ContexteNotifications = createContext<EtatNotifications | null>(null);

/** Les notifications de l'app (« … te suit », demande acceptée, nouveauté d'un compte suivi), fournies par FournisseurNotifications. */
export function utiliserNotifications(): EtatNotifications {
  const etat = useContext(ContexteNotifications);
  if (!etat) throw new Error("utiliserNotifications doit être appelé sous <FournisseurNotifications>.");
  return etat;
}
