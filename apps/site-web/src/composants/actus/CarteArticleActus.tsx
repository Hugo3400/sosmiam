import { Link } from "react-router";

import { LIBELLES_ACTUS_PAR_LANGUE } from "../../../../../packages/commun/src/contenus/libelles-actus.ts";
import { calculerMinutesLecture } from "../../../../../packages/commun/src/fonctions/actus/calculer-minutes-lecture.ts";
import { PastilleAmbassadeurActus } from "~/composants/actus/PastilleAmbassadeurActus";
import { PastilleArticleActus } from "~/composants/actus/PastilleArticleActus";
import { VisuelArticleActus } from "~/composants/actus/VisuelArticleActus";
import { TEXTES_ACTUS_PAR_LANGUE } from "~/contenus/actus";
import { ecrireDateAParisLangue } from "~/fonctions/dates/ecrire-date-a-paris-langue";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { ArticleActusSite } from "~/types/actus";

export function CarteArticleActus({ article }: { article: ArticleActusSite }) {
  const T = utiliserTextes(TEXTES_ACTUS_PAR_LANGUE);
  const L = utiliserTextes(LIBELLES_ACTUS_PAR_LANGUE);
  const langue = utiliserLangue();
  const infos = [article.lieux[0]?.ville, ecrireDateAParisLangue(article.publieLe, langue), T.lecture(calculerMinutesLecture(article.paragraphes))];
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-carte border-2 border-encre bg-white shadow-brut-petit transition-transform focus-within:ring-4 focus-within:ring-encre hover:-translate-y-1 motion-reduce:hover:translate-y-0">
      <VisuelArticleActus rubrique={article.rubrique} lieux={article.lieux} className="h-[150px] border-b-2 border-encre text-[52px]">
        {article.aLaUne && (
          <span className="absolute top-3 left-3 rounded-full border-2 border-encre bg-white px-2.5 py-0.5 text-xs font-extrabold">{L.aLaUne}</span>
        )}
      </VisuelArticleActus>
      <div className="flex flex-1 flex-col gap-2 px-[18px] pt-4 pb-[18px]">
        <p className="text-xs font-extrabold tracking-[.06em] text-gris uppercase">{L.rubriques[article.rubrique]}</p>
        {article.collaboration && (
          <p>
            <PastilleArticleActus variante="blanc">{L.collaboration}</PastilleArticleActus>
          </p>
        )}
        <h3 lang="fr" className="text-xl leading-tight font-extrabold">
          <Link to={`/actus/${article.id}`} className="underline-offset-4 outline-none group-hover:underline after:absolute after:inset-0 after:content-['']">
            {article.titre}
          </Link>
        </h3>
        <p lang="fr" className="line-clamp-2 text-[.95rem] leading-snug text-gris">{article.accroche}</p>
        <div className="mt-auto flex flex-col gap-1 pt-2">
          <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
            {article.auteur.prenom}
            {article.auteur.ambassadeur && <PastilleAmbassadeurActus />}
          </p>
          <p className="text-sm text-gris">{infos.filter(Boolean).join(" · ")}</p>
        </div>
      </div>
    </article>
  );
}
