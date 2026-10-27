import { InfosArticleActus } from "~/composants/actus/InfosArticleActus";
import { PastilleAmbassadeurActus } from "~/composants/actus/PastilleAmbassadeurActus";
import type { ArticleActusSite } from "~/types/actus";

export function AuteurArticleActus({ article }: { article: Pick<ArticleActusSite, "auteur" | "lieux" | "publieLe" | "paragraphes"> }) {
  const { auteur } = article;
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
        <InfosArticleActus article={article} />
      </div>
    </div>
  );
}
