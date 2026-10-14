import { useCallback, useSyncExternalStore } from "react";

import type { Publication } from "~/contenus/type-publication";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserSourceSociale } from "~/hooks/utiliser-source-sociale";
import { ecouterNombresCommentaires, lireNombreCommentaires, lireVersionNombresCommentaires } from "~/services/memoire-commentaires";

/**
 * Le nombre de commentaires sous chaque publication du fil. Démo : ceux du téléphone. Visite et compte : celui de la
 * publication lue sur le serveur, ou, pendant 60 s, celui que la feuille des commentaires vient de compter (ton commentaire
 * tout frais compte tout de suite, sans attendre la prochaine lecture du fil).
 */
export function utiliserNombresCommentaires(): (publication: Publication) => number {
  const source = utiliserSourceSociale();
  const { nombreCommentaires } = utiliserCommunaute();
  // Redessine le fil quand la feuille note un nouveau nombre
  const version = useSyncExternalStore(ecouterNombresCommentaires, lireVersionNombresCommentaires, lireVersionNombresCommentaires);
  return useCallback(
    (publication: Publication) => (source === "demo" ? nombreCommentaires(publication.id) : (lireNombreCommentaires(publication.id) ?? publication.commentaires)),
    // version : un nombre vient d'être noté
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [source, nombreCommentaires, version],
  );
}
