import type { ReactNode } from "react";

import { ContexteConversations, type EtatConversations } from "~/hooks/utiliser-conversations";
import { utiliserConversationsCompte } from "~/hooks/utiliser-conversations-compte";
import { utiliserSourceSociale } from "~/hooks/utiliser-source-sociale";
import { CONVERSATIONS_SANS_COMPTE } from "~/services/conversations-sans-compte";

const EN_ATTENTE: EtatConversations = { ...CONVERSATIONS_SANS_COMPTE, source: "attente", pret: false };

/**
 * Le chat entre potes (messages privés et groupes), lu par utiliserConversations : le serveur avec un compte connecté, rien
 * sans compte. Le hook du compte est toujours appelé et un seul Provider est rendu : passer de la visite au compte ne remonte
 * jamais les écrans.
 */
export function FournisseurConversations({ children }: { children: ReactNode }) {
  const source = utiliserSourceSociale();
  const compte = utiliserConversationsCompte(source === "compte");
  const valeur = source === "compte" ? compte : source === "attente" ? EN_ATTENTE : CONVERSATIONS_SANS_COMPTE;
  return <ContexteConversations.Provider value={valeur}>{children}</ContexteConversations.Provider>;
}
