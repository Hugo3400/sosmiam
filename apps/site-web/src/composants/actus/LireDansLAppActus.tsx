import { TEXTES_ACTUS_PAR_LANGUE } from "~/contenus/actus";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { ArticleActusSite } from "~/types/actus";

export function LireDansLAppActus({ article }: { article: Pick<ArticleActusSite, "jaime" | "commentaires"> }) {
  const T = utiliserTextes(TEXTES_ACTUS_PAR_LANGUE).article.app;
  return (
    <section aria-labelledby="actus-app" className="flex flex-col gap-3 rounded-carte bg-encre p-5 text-creme md:px-[26px] md:py-6">
      <h2 id="actus-app" className="text-xl font-extrabold text-jaune">{T.titre}</h2>
      <p className="leading-relaxed">{T.texte}</p>
      {article.jaime + article.commentaires > 0 && <p className="text-sm font-semibold text-creme/90">{T.compteurs(article.jaime, article.commentaires)}</p>}
      <p className="text-sm text-creme/80">{lierPonctuation(T.bientot)}</p>
    </section>
  );
}
