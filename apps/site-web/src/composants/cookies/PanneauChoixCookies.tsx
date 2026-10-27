import { Bouton } from "~/composants/interface/Bouton";
import { CategorieCookies } from "~/composants/cookies/CategorieCookies";
import { TEXTES_CONSENTEMENT_PAR_LANGUE } from "~/contenus/cookies-consentement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserConsentement } from "~/hooks/utiliser-consentement";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  /** « bandeau » (le panneau « Choisir ») ou « page » (le formulaire de /cookies#mes-choix) : préfixe des id */
  prefixe: "bandeau" | "page";
  /** Le titre du panneau : h2 dans le bandeau, h4 dans la page /cookies (sous « Gérer mes cookies ») */
  Titre: "h2" | "h4";
};

/**
 * Le détail des choix, à placer dans un <form> de choix : un interrupteur par catégorie à choisir (décochés sans choix,
 * le choix actuel sinon), les cookies nécessaires « Toujours actifs », puis trois boutons de même poids.
 */
export function PanneauChoixCookies({ prefixe, Titre }: Props) {
  const { categories, aChoisir, choix } = utiliserConsentement();
  const T = utiliserTextes(TEXTES_CONSENTEMENT_PAR_LANGUE);
  const necessaires = categories.find((categorie) => categorie.id === "necessaires");
  return (
    <div>
      <Titre id={`${prefixe}-cookies-titre-panneau`} tabIndex={-1} className="pr-10 font-titre text-lg font-extrabold sm:text-xl">
        {T.titrePanneau}
      </Titre>
      <p id={`${prefixe}-cookies-intro-panneau`} className="mt-1.5 text-[.95rem] text-gris">{lierPonctuation(choix ? T.introGestion : T.introPanneau)}</p>
      <ul className="mt-4 grid gap-3">
        {aChoisir.map((categorie) => (
          <li key={categorie.id}>
            <CategorieCookies categorie={categorie} prefixe={prefixe} coche={choix?.reponses[categorie.id] === true} />
          </li>
        ))}
        {necessaires && <li><CategorieCookies categorie={necessaires} prefixe={prefixe} coche /></li>}
      </ul>
      {/* Dans le bandeau, les boutons restent visibles en bas pendant qu'on fait défiler les catégories */}
      <div
        className={`mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 ${
          prefixe === "bandeau" ? "sticky -bottom-4 -mx-4 -mb-4 border-t-2 border-encre/10 bg-white px-4 pt-3 pb-4 sm:-bottom-6 sm:-mx-6 sm:-mb-6 sm:px-6 sm:pb-6" : ""
        }`}
      >
        <Bouton type="submit" name="geste" value="enregistrer" petit className="col-span-2 w-full sm:col-span-1">{T.enregistrer}</Bouton>
        <Bouton type="submit" name="geste" value="tout-refuser" petit className="w-full">{T.toutRefuser}</Bouton>
        <Bouton type="submit" name="geste" value="tout-accepter" petit className="w-full">{T.toutAccepter}</Bouton>
      </div>
    </div>
  );
}
