import { Fragment } from "react";

import { calculerMinutesLecture } from "../../../../../packages/commun/src/fonctions/actus/calculer-minutes-lecture.ts";
import { TEXTES_ACTUS_PAR_LANGUE } from "~/contenus/actus";
import { ecrireDateAParisLangue } from "~/fonctions/dates/ecrire-date-a-paris-langue";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { ArticleActusSite } from "~/types/actus";

export function InfosArticleActus({ article }: { article: Pick<ArticleActusSite, "lieux" | "publieLe" | "paragraphes"> }) {
  const T = utiliserTextes(TEXTES_ACTUS_PAR_LANGUE);
  const langue = utiliserLangue();
  const infos = [article.lieux[0]?.ville, ecrireDateAParisLangue(article.publieLe, langue), T.lecture(calculerMinutesLecture(article.paragraphes))].filter(Boolean);
  return (
    <p className="text-sm text-gris">
      {infos.map((info, rang) => (
        <Fragment key={rang}>
          {rang > 0 && " · "}
          <span className="whitespace-nowrap">{info}</span>
        </Fragment>
      ))}
    </p>
  );
}
