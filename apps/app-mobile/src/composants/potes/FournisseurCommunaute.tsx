import type { ReactNode } from "react";

import { ContexteCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserCommunauteCompte } from "~/hooks/utiliser-communaute-compte";
import { utiliserCommunauteLocale } from "~/hooks/utiliser-communaute-locale";
import { utiliserSourceSociale } from "~/hooks/utiliser-source-sociale";

/**
 * La communauté de l'app (potes, sorties, listes, activité, lieux envoyés, commentaires), lue par utiliserCommunaute. Démo et
 * visite : le téléphone. Compte connecté : la bande vient du serveur, le reste du téléphone en attendant les lots suivants.
 * Les deux hooks sont toujours appelés et un seul Provider est rendu : passer de la visite au compte ne remonte jamais les
 * écrans (on garde « le retour sur l'écran d'où l'on est parti » après une inscription).
 */
export function FournisseurCommunaute({ children }: { children: ReactNode }) {
  const source = utiliserSourceSociale();
  const locale = utiliserCommunauteLocale();
  const compte = utiliserCommunauteCompte(source === "compte", locale);
  // Le temps de relire la session : rien n'est encore prêt
  const valeur = source === "compte" ? compte : source === "attente" ? { ...locale, source, pret: false } : locale;
  return <ContexteCommunaute.Provider value={valeur}>{children}</ContexteCommunaute.Provider>;
}
