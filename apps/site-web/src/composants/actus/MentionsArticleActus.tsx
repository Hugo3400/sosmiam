import { TEXTES_ACTUS_PAR_LANGUE } from "~/contenus/actus";
import { ecrireDateAParisLangue } from "~/fonctions/dates/ecrire-date-a-paris-langue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { ArticleActusSite } from "~/types/actus";

export function MentionsArticleActus({ article }: { article: Pick<ArticleActusSite, "publieLe" | "collaboration" | "auteur"> }) {
  const A = utiliserTextes(TEXTES_ACTUS_PAR_LANGUE).article;
  const date = ecrireDateAParisLangue(article.publieLe, utiliserLangue());
  const { prenom } = article.auteur;
  return (
    <div className="flex flex-col gap-1 border-t-2 border-encre pt-4 text-sm text-gris">
      {date && <p>{A.relu(date)}</p>}
      <p className={article.collaboration ? "font-bold text-encre" : ""}>{lierPonctuation(article.collaboration ? A.collaborationOui(prenom) : A.collaborationNon(prenom))}</p>
    </div>
  );
}
