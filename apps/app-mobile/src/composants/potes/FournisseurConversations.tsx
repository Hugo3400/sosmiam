import type { ReactNode } from "react";

import { ContexteConversations } from "~/hooks/utiliser-conversations";
import { utiliserConversationsCompte } from "~/hooks/utiliser-conversations-compte";
import { utiliserConversationsLocales } from "~/hooks/utiliser-conversations-locales";
import { utiliserSourceSociale } from "~/hooks/utiliser-source-sociale";

/**
 * Le chat entre potes (messages privés et groupes), lu par utiliserConversations. Démo et visite : le téléphone. Compte
 * connecté : le serveur. Les deux hooks sont toujours appelés et un seul Provider est rendu : passer de la visite au compte
 * ne remonte jamais les écrans.
 */
export function FournisseurConversations({ children }: { children: ReactNode }) {
  const source = utiliserSourceSociale();
  const locales = utiliserConversationsLocales();
  const compte = utiliserConversationsCompte(source === "compte");
  const valeur = source === "compte" ? compte : source === "attente" ? { ...locales, source, pret: false } : locales;
  return <ContexteConversations.Provider value={valeur}>{children}</ContexteConversations.Provider>;
}
