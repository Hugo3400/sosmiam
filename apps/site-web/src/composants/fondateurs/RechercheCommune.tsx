import { Form, Link, useNavigate } from "react-router";

import { ChampCommune } from "~/composants/fondateurs/ChampCommune";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { CommuneFondateurs } from "~/types/compte";

type Props = {
  /** Début des id (unique sur la page) */
  id: string;
  /** Adresse de la page, sans paramètres (« /programme ») */
  page: string;
  /** Section où revenir après l'envoi sans JavaScript (id, sans « # ») */
  ancre: string;
  libelle: string;
  /** Nom du champ dans l'adresse (« ville » sur /programme) */
  nomChamp?: string;
  aide?: string;
  /** Ce qui est écrit dans le champ : la recherche d'avant, ou la commune choisie */
  valeurInitiale?: string;
  /** Plusieurs communes correspondent à la recherche : la liste où choisir la sienne */
  choix?: CommuneFondateurs[] | null;
  /** La recherche n'a rien donné, ou l'API ne répond pas */
  message?: string | null;
  bouton?: string;
  /** Paramètres à garder dans l'adresse (« changer=1 ») */
  garder?: Record<string, string>;
  /** Sur fond sombre */
  clair?: boolean;
  autoFocus?: boolean;
};

const classeLien = "font-semibold underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-current";

/**
 * Recherche de commune qui marche sans JavaScript : un formulaire GET (?recherche=… ou ?ville=…) ; la page cherche côté serveur, puis
 * montre la zone (une seule commune trouvée) ou une liste de choix (des liens ?commune=CODE). Avec JavaScript, le champ
 * propose les communes au fil de la frappe et en choisir une ouvre directement ses places, sans recharger la page.
 */
export function RechercheCommune({ id, page, ancre, libelle, nomChamp = "recherche", aide, valeurInitiale = "", choix, message, bouton = "Chercher", garder = {}, clair = false, autoFocus = false }: Props) {
  const navigate = useNavigate();
  const adresseChoix = (code: string) => `${page}?${new URLSearchParams({ ...garder, commune: code })}`;
  const idChamp = `${id}-recherche`;
  const decrit = [aide ? `${id}-aide` : "", message ? `${id}-message` : ""].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <Form method="get" action={`${page}#${ancre}`} preventScrollReset role="search" aria-label={libelle}>
        {Object.entries(garder).map(([nom, valeur]) => <input key={nom} type="hidden" name={nom} value={valeur} />)}
        <label htmlFor={idChamp} className={`mb-1.5 block text-sm font-semibold ${clair ? "text-creme" : ""}`}>{libelle}</label>
        {aide && <p id={`${id}-aide`} className={`mb-2 text-sm ${clair ? "text-creme/80" : "text-gris"}`}>{lierPonctuation(aide)}</p>}
        <div className="flex flex-wrap gap-3">
          <ChampCommune
            id={idChamp}
            name={nomChamp}
            valeurInitiale={valeurInitiale}
            decritPar={decrit}
            invalide={Boolean(message)}
            autoFocus={autoFocus}
            onChoisir={(commune) => navigate(adresseChoix(commune.code), { preventScrollReset: true, replace: true })}
            className="min-w-0 flex-[1_1_14rem]"
          />
          <button
            type="submit"
            className={`rounded-full border-2 px-6 py-3 font-semibold transition-[translate,box-shadow] duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5
              focus-visible:outline-3 focus-visible:outline-offset-3 ${clair
                ? "border-creme bg-jaune text-encre shadow-[4px_4px_0_#fff] focus-visible:outline-jaune"
                : "border-encre bg-jaune text-encre shadow-brut focus-visible:outline-encre"}`}
          >
            {bouton}
          </button>
        </div>
      </Form>
      {message && <p id={`${id}-message`} className={`mt-3 font-semibold ${clair ? "text-jaune" : "text-rouge-texte"}`}>{lierPonctuation(message)}</p>}
      {choix && choix.length > 0 && (
        <div className="mt-5">
          <p id={`${id}-choix`} className="mb-2 font-semibold">{lierPonctuation("Plusieurs communes correspondent : choisis la tienne.")}</p>
          <ul aria-labelledby={`${id}-choix`} className="grid gap-2 sm:grid-cols-2">
            {choix.map((commune) => (
              <li key={commune.code}>
                <Link to={`${adresseChoix(commune.code)}#${ancre}`} preventScrollReset className={classeLien}>
                  {commune.nom}
                </Link>
                <span className={clair ? "text-creme/80" : "text-gris"}>{` (${commune.codePostal ? `${commune.codePostal}, ` : ""}${commune.nomDepartement})`}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
