import type { ReactNode } from "react";

import { utiliserSourceSociale } from "~/hooks/utiliser-source-sociale";
import { ContexteSuivisPersonnes } from "~/hooks/utiliser-suivis-personnes";
import { utiliserSuivisPersonnesCompte } from "~/hooks/utiliser-suivis-personnes-compte";
import { utiliserSuivisPersonnesLocaux } from "~/hooks/utiliser-suivis-personnes-locaux";

/**
 * Abonnés, abonnements et demandes entre personnes, lus par utiliserSuivisPersonnes. Démo et visite : le téléphone. Compte
 * connecté : le serveur. Les deux hooks sont toujours appelés et un seul Provider est rendu : passer de la visite au compte
 * ne remonte jamais les écrans.
 */
export function FournisseurSuivisPersonnes({ children }: { children: ReactNode }) {
  const source = utiliserSourceSociale();
  const locaux = utiliserSuivisPersonnesLocaux();
  const compte = utiliserSuivisPersonnesCompte(source === "compte");
  const valeur = source === "compte" ? compte : source === "attente" ? { ...locaux, source, pret: false } : locaux;
  return <ContexteSuivisPersonnes.Provider value={valeur}>{children}</ContexteSuivisPersonnes.Provider>;
}
