import { useCallback } from "react";

import { ID_MOI } from "@sos-miam/commun/regles/potes";
import { utiliserSuivisPersonnes } from "~/hooks/utiliser-suivis-personnes";

/**
 * Peux-tu voir l'activité de cette personne (points et rescousses du classement, ce qu'elle fait dans ta bande, ses listes) ?
 * La même règle que son profil : seulement s'il t'est ouvert en entier (calculerVisibiliteProfil, « complet »). Sans elle, un
 * compte privé ajouté à ta bande par son pseudo (sans son accord), ou un 15-17 ans vu par un adulte, montreraient là ce que
 * leur profil cache. Toi : toujours. null tant que les suivis ne sont pas relus (rien à montrer d'ici là).
 */
export function utiliserVoitEnEntier(): ((id: string) => boolean) | null {
  const { pret, relationAvec } = utiliserSuivisPersonnes();
  const voitEnEntier = useCallback((id: string) => id === ID_MOI || relationAvec(id)?.visibilite === "complet", [relationAvec]);
  return pret ? voitEnEntier : null;
}
