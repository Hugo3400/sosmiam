import type { ReactNode } from "react";

import { ContexteNotifications } from "~/hooks/utiliser-notifications";
import { utiliserNotificationsCompte } from "~/hooks/utiliser-notifications-compte";
import { utiliserNotificationsLocales } from "~/hooks/utiliser-notifications-locales";
import { utiliserSourceSociale } from "~/hooks/utiliser-source-sociale";

/**
 * Les notifications de l'app (la cloche), lues par utiliserNotifications. Démo et visite : le téléphone. Compte connecté :
 * la cloche du serveur, plus les « a posté » calculés sur le téléphone. Les deux hooks sont toujours appelés et un seul
 * Provider est rendu : passer de la visite au compte ne remonte jamais les écrans.
 */
export function FournisseurNotifications({ children }: { children: ReactNode }) {
  const source = utiliserSourceSociale();
  const locales = utiliserNotificationsLocales();
  const compte = utiliserNotificationsCompte(source === "compte");
  const valeur = source === "compte" ? compte : source === "attente" ? { ...locales, pret: false } : locales;
  return <ContexteNotifications.Provider value={valeur}>{children}</ContexteNotifications.Provider>;
}
