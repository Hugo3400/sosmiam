import { RUBRIQUES_ACTUS_GESTION, TEXTES_ACTUS as T } from "~/contenus/actus.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import type { ArticleARelire } from "~/services/actus.ts";

type Props = { articles: ArticleARelire[]; choisi: number; onChoisir: (id: number) => void };

export function ListeArticlesActus({ articles, choisi, onChoisir }: Props) {
  return (
    <nav aria-label={T.liste} className="grid content-start gap-2.5">
      {articles.map((article) => {
        const actif = article.id === choisi;
        const rubrique = RUBRIQUES_ACTUS_GESTION[article.rubrique];
        return (
          <button
            key={article.id}
            type="button"
            aria-current={actif || undefined}
            onClick={() => onChoisir(article.id)}
            className={`grid gap-1 rounded-2xl border-2 bg-white p-3 text-left transition-shadow ${actif ? "border-encre shadow-brut" : "border-ligne hover:border-encre"}`}
          >
            <span className="text-[11px] font-extrabold tracking-wide text-gris uppercase">
              {rubrique.emoji} {rubrique.libelle}{article.renvoye ? ` · ${T.renvoye}` : ""}
            </span>
            <span className="text-[15px] leading-snug font-extrabold">{article.titre}</span>
            <span className="text-xs text-gris">
              {article.auteur.prenom}{article.auteur.ambassadeur ? ` · ${T.ambassadeur}` : ""} · {article.auteur.ville} · {formaterDate(article.envoyeLe, true)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
