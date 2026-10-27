import { LienSignalerActus } from "~/composants/actus/LienSignalerActus";
import { TEXTES_ACTUS_PAR_LANGUE } from "~/contenus/actus";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function LienSignalerArticleActus({ articleId }: { articleId: number }) {
  const A = utiliserTextes(TEXTES_ACTUS_PAR_LANGUE).article;
  return <LienSignalerActus vers={`/actus/${articleId}/signaler`}>{A.signaler.article}</LienSignalerActus>;
}
