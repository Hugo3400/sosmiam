import { PLACES_PAR_TAILLE_DE_VILLE, TEXTES_PROGRAMME_AMBASSADEUR_PAR_LANGUE, TOTAL_PLACES_FONDATEURS } from "~/contenus/programme-ambassadeur";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  /** Sur fond sombre */
  clair?: boolean;
};

/** Les places de fondateur selon la taille de la ville (contenus/programme-ambassadeur.ts), et leur total en France. */
export function TableauPlaces({ clair = false }: Props) {
  const T = utiliserTextes(TEXTES_PROGRAMME_AMBASSADEUR_PAR_LANGUE).tableau;
  const ligne = clair ? "border-creme/25" : "border-encre/15";
  const discret = clair ? "text-creme/75" : "text-gris";
  return (
    <table className="w-full border-collapse text-left">
      <caption className={`mb-3 text-left text-sm ${discret}`}>{lierPonctuation(T.legende)}</caption>
      <thead>
        <tr className={`border-b-2 ${clair ? "border-creme/50" : "border-encre"}`}>
          <th scope="col" className="py-2 pr-4 text-sm font-semibold">{T.colonneVille}</th>
          <th scope="col" className="py-2 text-right text-sm font-semibold">{T.colonnePlaces}</th>
        </tr>
      </thead>
      <tbody>
        {T.tailles.map((rangee, i) => (
          <tr key={rangee.taille} className={`border-b ${ligne}`}>
            <th scope="row" className="py-3 pr-4 align-top font-normal">
              <span className="block font-semibold">{rangee.taille}</span>
              <span className={`block text-sm ${discret}`}>{lierPonctuation(rangee.villes)}</span>
            </th>
            <td className="py-3 text-right align-top font-titre text-2xl font-extrabold">{PLACES_PAR_TAILLE_DE_VILLE[i]}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <th scope="row" className="pt-3 pr-4 font-semibold">{T.total}</th>
          <td className={`pt-3 text-right font-titre text-2xl font-extrabold ${clair ? "text-jaune" : ""}`}>{TOTAL_PLACES_FONDATEURS}</td>
        </tr>
      </tfoot>
    </table>
  );
}
