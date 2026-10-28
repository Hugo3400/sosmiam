import { useMemo, type ReactNode } from "react";

import { lireBlocagesPhotos } from "~/fonctions/communaute/lire-blocages-photos";
import { ContexteBlocagesPhotos } from "~/hooks/utiliser-blocages-photos";
import { ContexteCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserCommunauteCompte } from "~/hooks/utiliser-communaute-compte";
import { utiliserCommunauteLocale } from "~/hooks/utiliser-communaute-locale";
import { utiliserSourceSociale } from "~/hooks/utiliser-source-sociale";

/**
 * La communauté de l'app (potes, sorties, listes, activité, lieux envoyés, commentaires), lue par utiliserCommunaute.
 * Visite : le téléphone. Compte connecté : la bande vient du serveur, le reste du téléphone en attendant les lots suivants.
 * Les deux hooks sont toujours appelés et un seul Provider est rendu : passer de la visite au compte ne remonte jamais les
 * écrans (on garde « le retour sur l'écran d'où l'on est parti » après une inscription).
 */
export function FournisseurCommunaute({ children }: { children: ReactNode }) {
  const source = utiliserSourceSociale();
  const locale = utiliserCommunauteLocale();
  const compte = utiliserCommunauteCompte(source === "compte", locale);
  // Le temps de relire la session : rien n'est encore prêt
  const valeur = source === "compte" ? compte : source === "attente" ? { ...locale, source, pret: false } : locale;
  const pret = source === "compte" ? compte.bloquesLus : source !== "attente";
  const empreinte = JSON.stringify({ pret, bloques: valeur.bloques.map((p) => [p.id, p.avatar]) });
  const blocages = useMemo(() => lireBlocagesPhotos(empreinte), [empreinte]);
  return (
    <ContexteCommunaute.Provider value={valeur}>
      <ContexteBlocagesPhotos.Provider value={blocages}>{children}</ContexteBlocagesPhotos.Provider>
    </ContexteCommunaute.Provider>
  );
}
