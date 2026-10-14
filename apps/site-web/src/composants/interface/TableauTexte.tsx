import { TexteRiche } from "~/composants/interface/TexteRiche";
import type { TableauTexte as Tableau } from "~/contenus/type-bloc-texte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/**
 * Un tableau de texte (par exemple la liste des cookies). Sur ordinateur, un vrai tableau ; sur téléphone, chaque ligne
 * devient une petite fiche où chaque case rappelle le nom de sa colonne (pas de défilement de côté). La première case
 * de chaque ligne en est l'en-tête, pour les lecteurs d'écran.
 */
export function TableauTexte({ tableau }: { tableau: Tableau }) {
  return (
    <div className="rounded-carte border-2 border-encre bg-white md:overflow-hidden">
      <table className="w-full border-collapse text-left text-base max-md:block">
        <caption className="sr-only">{lierPonctuation(tableau.legende)}</caption>
        <thead className="bg-jaune-clair text-encre max-md:hidden">
          <tr>
            {tableau.colonnes.map((colonne) => <th key={colonne} scope="col" className="p-3 font-titre font-extrabold">{lierPonctuation(colonne)}</th>)}
          </tr>
        </thead>
        <tbody className="max-md:block">
          {tableau.lignes.map((ligne) => (
            <tr key={ligne[0]} className="border-t border-ligne first:border-t-0 md:first:border-t max-md:block max-md:p-4">
              {ligne.map((cellule, i) => {
                const Case = i === 0 ? "th" : "td";
                return (
                  <Case
                    key={tableau.colonnes[i]}
                    scope={i === 0 ? "row" : undefined}
                    data-colonne={tableau.colonnes[i]}
                    className={`p-3 align-top max-md:block max-md:px-0 max-md:py-1 ${i === 0 ? "font-semibold text-encre max-md:[overflow-wrap:anywhere] md:w-44" : ""} max-md:before:block max-md:before:text-xs max-md:before:font-bold max-md:before:uppercase max-md:before:tracking-wide max-md:before:text-gris max-md:before:content-[attr(data-colonne)]`}
                  >
                    <TexteRiche texte={cellule} />
                  </Case>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
