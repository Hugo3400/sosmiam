import type { ListeApi, ListeResumeApi } from "@sos-miam/commun/types/listes";
import type { ListePartagee } from "@sos-miam/commun/types/potes";

type MoiListe = NonNullable<ListePartagee["serveur"]>["moi"];

/**
 * Une liste telle que l'API la rend, au format des écrans. Lue en entier (ListeApi) : ses lieux, ses co-auteurs et ce que
 * tu peux y faire. En résumé seulement (ListeResumeApi) : pas de lieux (serveur.nombreLieux dit combien), et `moi` vient
 * de là où on l'a trouvée (tes listes, celles que tu suis, celles qu'on t'invite à remplir…).
 */
export function convertirListeApi(l: ListeResumeApi | ListeApi, moiDuResume: MoiListe): ListePartagee {
  const complete = "lieux" in l;
  return {
    id: l.id,
    titre: l.titre,
    emoji: l.emoji,
    description: l.description,
    auteur: l.auteur.id,
    lieux: complete ? l.lieux : [],
    abonnes: [],
    visibilite: l.visibilite,
    ...(complete ? { coAuteurs: l.coAuteurs.map((c) => ({ id: c.personne.id, statut: c.statut })) } : {}),
    serveur: {
      nombreLieux: l.nombreLieux,
      nombreAbonnes: l.abonnes,
      complete,
      moi: complete ? l.moi : moiDuResume,
      modifieLe: l.modifieLe,
      enModeration: l.enModeration === true,
    },
  };
}
