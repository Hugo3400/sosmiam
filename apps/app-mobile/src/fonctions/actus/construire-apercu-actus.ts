import type { AuteurActus, LieuCiteActus } from "@sos-miam/commun/types/actus";
import type { BrouillonActusSaisi } from "~/contenus/type-brouillon-actus";
import type { ArticleActusAffiche } from "~/contenus/type-article-actus";
import { lireDateSaisie } from "~/fonctions/dates/lire-date-saisie";

export function construireApercuActus(brouillon: BrouillonActusSaisi, lieux: LieuCiteActus[], auteur: AuteurActus, maintenant: Date = new Date()): ArticleActusAffiche {
  return {
    id: 0,
    rubrique: brouillon.rubrique,
    titre: brouillon.titre.trim(),
    accroche: brouillon.accroche.trim(),
    paragraphes: brouillon.texte.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean),
    citation: brouillon.citation.trim() || null,
    couverture: brouillon.couverture ? { uri: brouillon.couverture } : 0,
    photos: brouillon.photos.map((uri) => ({ uri })),
    lieux,
    auteur,
    collaboration: brouillon.collaboration === true,
    alcool: false,
    finLe: brouillon.rubrique === "bon-plan" ? lireDateSaisie(brouillon.finSaisie) : null,
    publieLe: maintenant.toISOString(),
    aLaUne: false,
    jaime: 0,
    commentaires: 0,
    reponseLieu: null,
  };
}
