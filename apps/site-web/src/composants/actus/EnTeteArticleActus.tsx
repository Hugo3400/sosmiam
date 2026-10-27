import { Link } from "react-router";

import { LIBELLES_ACTUS_PAR_LANGUE } from "../../../../../packages/commun/src/contenus/libelles-actus.ts";
import { AuteurArticleActus } from "~/composants/actus/AuteurArticleActus";
import { MentionCollaborationActus } from "~/composants/actus/MentionCollaborationActus";
import { PastilleArticleActus } from "~/composants/actus/PastilleArticleActus";
import { VisuelArticleActus } from "~/composants/actus/VisuelArticleActus";
import { TEXTES_ACTUS_PAR_LANGUE } from "~/contenus/actus";
import { ecrireDateAParisLangue } from "~/fonctions/dates/ecrire-date-a-paris-langue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { ArticleActusSite } from "~/types/actus";

export function EnTeteArticleActus({ article }: { article: ArticleActusSite }) {
  const A = utiliserTextes(TEXTES_ACTUS_PAR_LANGUE).article;
  const L = utiliserTextes(LIBELLES_ACTUS_PAR_LANGUE);
  const langue = utiliserLangue();
  const lienLangue = utiliserLienLangue();
  const finLe = article.finLe ? ecrireDateAParisLangue(article.finLe, langue) : null;
  return (
    <header className="flex flex-col gap-5">
      <Link
        to={lienLangue("/actus")}
        className="inline-flex items-center gap-2 self-start rounded-full border-2 border-encre bg-white px-4 py-2 text-sm font-bold hover:bg-jaune-clair focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        {A.retour}
      </Link>
      <VisuelArticleActus rubrique={article.rubrique} lieux={article.lieux} className="h-[200px] rounded-carte border-2 border-encre text-[64px] shadow-brut md:h-[280px] md:text-[88px]" />
      <div className="flex flex-wrap gap-2">
        <PastilleArticleActus>{L.rubriques[article.rubrique]}</PastilleArticleActus>
        {article.collaboration && <MentionCollaborationActus />}
        {finLe && <PastilleArticleActus variante="blanc">{A.finLe(finLe)}</PastilleArticleActus>}
      </div>
      <h1 lang="fr" className="text-[clamp(2rem,5vw,3rem)] leading-[1.05] font-extrabold tracking-tight text-balance">{lierPonctuation(article.titre)}</h1>
      <p lang="fr" className="text-lg leading-normal font-semibold text-gris">{lierPonctuation(article.accroche)}</p>
      <AuteurArticleActus article={article} />
    </header>
  );
}
