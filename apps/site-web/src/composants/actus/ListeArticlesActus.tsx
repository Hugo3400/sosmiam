import { ActusIndisponibles } from "~/composants/actus/ActusIndisponibles";
import { AucunArticleActus } from "~/composants/actus/AucunArticleActus";
import { CarteArticleActus } from "~/composants/actus/CarteArticleActus";
import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_ACTUS_PAR_LANGUE } from "~/contenus/actus";
import { ecrireAdresseActus } from "~/fonctions/actus/ecrire-adresse-actus";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { ArticleActusSite, FiltresActus } from "~/types/actus";

type Props = { filtres: FiltresActus; articles: readonly ArticleActusSite[]; suivant: string | null; indisponible: boolean };

export function ListeArticlesActus({ filtres, articles, suivant, indisponible }: Props) {
  const T = utiliserTextes(TEXTES_ACTUS_PAR_LANGUE);
  const lienLangue = utiliserLienLangue();
  const complete = !suivant && !filtres.curseur;
  return (
    <section aria-labelledby="titre-liste-actus" className="flex flex-col gap-4">
      <h2 id="titre-liste-actus" className="sr-only">{T.liste}</h2>
      <p aria-live="polite" className="text-sm font-semibold text-gris">{!indisponible && complete ? T.compte(articles.length) : ""}</p>
      {indisponible ? (
        <ActusIndisponibles reessayer={lienLangue(ecrireAdresseActus(filtres))} />
      ) : articles.length > 0 ? (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <li key={article.id}>
              <CarteArticleActus article={article} />
            </li>
          ))}
        </ul>
      ) : (
        <AucunArticleActus />
      )}
      {!indisponible && (suivant || filtres.curseur) && (
        <nav aria-label={T.liste} className="mt-2 flex flex-wrap items-center justify-center gap-4">
          {filtres.curseur && (
            <Bouton vers={lienLangue(ecrireAdresseActus({ ...filtres, curseur: null }))} variante="blanc" petit>{T.plusRecents}</Bouton>
          )}
          {suivant && <Bouton vers={lienLangue(ecrireAdresseActus({ ...filtres, curseur: suivant }))}>{T.voirPlus}</Bouton>}
        </nav>
      )}
    </section>
  );
}
