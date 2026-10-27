import { calculerMinutesLecture } from "../../../../../packages/commun/src/fonctions/actus/calculer-minutes-lecture.ts";
import { PastilleAmbassadeurActus } from "~/composants/actus/PastilleAmbassadeurActus";
import { TEXTES_ACTUS_PAR_LANGUE } from "~/contenus/actus";
import { ecrireDateAParisLangue } from "~/fonctions/dates/ecrire-date-a-paris-langue";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { ArticleActusSite } from "~/types/actus";

export function AuteurArticleActus({ article }: { article: Pick<ArticleActusSite, "auteur" | "lieux" | "publieLe" | "paragraphes"> }) {
  const T = utiliserTextes(TEXTES_ACTUS_PAR_LANGUE);
  const langue = utiliserLangue();
  const { auteur } = article;
  const infos = [article.lieux[0]?.ville, ecrireDateAParisLangue(article.publieLe, langue), T.lecture(calculerMinutesLecture(article.paragraphes))];
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-encre bg-jaune-clair font-titre text-xl font-extrabold">
        {auteur.prenom.charAt(0).toUpperCase()}
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="flex flex-wrap items-center gap-2 font-extrabold">
          <span className="break-all">{auteur.prenom}</span>
          {auteur.ambassadeur && <PastilleAmbassadeurActus />}
        </p>
        <p className="text-sm text-gris">{infos.filter(Boolean).join(" · ")}</p>
      </div>
    </div>
  );
}
