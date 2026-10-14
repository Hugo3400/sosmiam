import { Bouton } from "~/composants/interface/Bouton";
import { CategorieCookies } from "~/composants/cookies/CategorieCookies";
import { textesConsentement } from "~/contenus/cookies-consentement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserConsentement } from "~/hooks/utiliser-consentement";

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
  const necessaires = categories.find((categorie) => categorie.id === "necessaires");
  return (
    <div>
      <Titre id={`${prefixe}-cookies-titre-panneau`} tabIndex={-1} className="pr-10 font-titre text-xl font-extrabold">
        {textesConsentement.titrePanneau}
      </Titre>
      <p id={`${prefixe}-cookies-intro-panneau`} className="mt-1.5 text-[.95rem] text-gris">{lierPonctuation(textesConsentement.introPanneau)}</p>
      <ul className="mt-4 grid gap-3">
        {aChoisir.map((categorie) => (
          <li key={categorie.id}>
            <CategorieCookies categorie={categorie} prefixe={prefixe} coche={choix?.reponses[categorie.id] === true} />
          </li>
        ))}
        {necessaires && <li><CategorieCookies categorie={necessaires} prefixe={prefixe} coche /></li>}
      </ul>
      <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
        <Bouton type="submit" name="geste" value="enregistrer" petit className="w-full">{textesConsentement.enregistrer}</Bouton>
        <Bouton type="submit" name="geste" value="tout-refuser" petit className="w-full">{textesConsentement.toutRefuser}</Bouton>
        <Bouton type="submit" name="geste" value="tout-accepter" petit className="w-full">{textesConsentement.toutAccepter}</Bouton>
      </div>
    </div>
  );
}
