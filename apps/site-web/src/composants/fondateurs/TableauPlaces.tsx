import { placesFondateurs, totalPlacesFondateurs } from "~/contenus/programme-ambassadeur";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  /** Sur fond sombre */
  clair?: boolean;
};

/** Les places de fondateur selon la taille de la ville (contenus/programme-ambassadeur.ts), et leur total en France. */
export function TableauPlaces({ clair = false }: Props) {
  const ligne = clair ? "border-creme/25" : "border-encre/15";
  const discret = clair ? "text-creme/75" : "text-gris";
  return (
    <table className="w-full border-collapse text-left">
      <caption className={`mb-3 text-left text-sm ${discret}`}>{lierPonctuation("Places de fondateur selon la taille de ta ville (population INSEE)")}</caption>
      <thead>
        <tr className={`border-b-2 ${clair ? "border-creme/50" : "border-encre"}`}>
          <th scope="col" className="py-2 pr-4 text-sm font-semibold">Ta ville</th>
          <th scope="col" className="py-2 text-right text-sm font-semibold">Places</th>
        </tr>
      </thead>
      <tbody>
        {placesFondateurs.map((rangee) => (
          <tr key={rangee.taille} className={`border-b ${ligne}`}>
            <th scope="row" className="py-3 pr-4 align-top font-normal">
              <span className="block font-semibold">{rangee.taille}</span>
              <span className={`block text-sm ${discret}`}>{lierPonctuation(rangee.villes)}</span>
            </th>
            <td className="py-3 text-right align-top font-titre text-2xl font-extrabold">{rangee.places}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <th scope="row" className="pt-3 pr-4 font-semibold">En tout, partout en France</th>
          <td className={`pt-3 text-right font-titre text-2xl font-extrabold ${clair ? "text-jaune" : ""}`}>{totalPlacesFondateurs}</td>
        </tr>
      </tfoot>
    </table>
  );
}
