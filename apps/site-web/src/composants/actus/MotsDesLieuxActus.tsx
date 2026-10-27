import { MotDuLieuActus } from "~/composants/actus/MotDuLieuActus";
import { trierReponsesLieux } from "~/fonctions/actus/trier-reponses-lieux";
import type { ArticleActusSite } from "~/types/actus";

export function MotsDesLieuxActus({ article }: { article: Pick<ArticleActusSite, "id" | "reponsesLieux" | "lieux"> }) {
  return (
    <>
      {trierReponsesLieux(article.reponsesLieux, article.lieux).map((reponse, rang) => (
        <MotDuLieuActus key={`${rang}-${reponse.lieuId}`} articleId={article.id} reponse={reponse} />
      ))}
    </>
  );
}
