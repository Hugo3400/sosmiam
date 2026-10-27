import type { RubriqueActus } from "../../../../../packages/commun/src/regles/actus.ts";
import type { ArticleActus } from "../../../../../packages/commun/src/types/actus.ts";
import { ecrireAdresseImageActus } from "./ecrire-adresse-image-actus.ts";
import { lireAvatarAuteurActus } from "./lire-avatar-auteur-actus.ts";
import { listerLieuxCitesActus } from "./lister-lieux-cites-actus.ts";
import type { LigneArticleActus } from "../../services/actus-regles.ts";

export function presenterArticleActus(ligne: LigneArticleActus, jaime: number, aime?: boolean): ArticleActus {
  return {
    id: ligne.id,
    rubrique: ligne.rubrique as RubriqueActus,
    titre: ligne.titre,
    accroche: ligne.accroche,
    paragraphes: ligne.texte.split("\n\n"),
    citation: ligne.citation,
    couverture: ecrireAdresseImageActus(ligne.couverture),
    photos: ligne.photos.map(ecrireAdresseImageActus),
    lieux: listerLieuxCitesActus(ligne.lieux),
    auteur: {
      id: 0,
      prenom: ligne.auteur.prenom,
      avatar: lireAvatarAuteurActus(ligne.auteur.avatar),
      ambassadeur: ligne.auteur.ambassadeur?.statut === "actif",
    },
    collaboration: ligne.collaboration,
    alcool: ligne.alcool,
    finLe: ligne.finLe ? ligne.finLe.toISOString().slice(0, 10) : null,
    publieLe: (ligne.publieLe ?? new Date(0)).toISOString(),
    aLaUne: ligne.aLaUne,
    jaime,
    commentaires: ligne._count.commentaires,
    reponsesLieux: ligne.reponses.map((r) => ({ lieuId: r.lieuId, nomLieu: r.lieu.nom, texte: r.texte, repondueLe: (r.decideLe ?? new Date(0)).toISOString() })),
    ...(aime === undefined ? {} : { aime }),
  };
}
