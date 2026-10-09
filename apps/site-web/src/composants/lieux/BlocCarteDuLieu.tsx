import { carteContientAlcool } from "../../../../../packages/commun/src/fonctions/prevention/carte-contient-alcool.ts";
import { BlocPrevention } from "~/composants/lieux/BlocPrevention";
import { ElementCarteDuLieu } from "~/composants/lieux/ElementCarteDuLieu";
import { formaterJourEnLettres } from "~/fonctions/dates/formater-jour-en-lettres";
import type { CarteLieu } from "~/types/carte";

type Props = {
  carte: CarteLieu;
  /** « sortie » : « Les formules » au lieu de « La carte » */
  type: string;
  /** Id du titre (unique sur la page) */
  id?: string;
  niveau?: 2 | 3;
};

/**
 * La carte d'un lieu, telle que le lieu l'a remplie (fiche publique, aperçu et lecture de l'espace pro) : ses sections
 * (une section vide n'est pas montrée), puis « Carte mise à jour par le lieu le … ». Si un plat contient de l'alcool,
 * le message sanitaire de la loi Évin, mot pour mot, et l'aide (BlocPrevention) suivent. Rien à montrer : rien du tout.
 * Le site ne connaît pas l'âge du visiteur : il montre l'alcool, toujours avec le message (l'app le cache aux moins de 18 ans).
 */
export function BlocCarteDuLieu({ carte, type, id = "fiche-carte", niveau = 2 }: Props) {
  const sections = carte.sections.filter((section) => section.elements.length > 0);
  if (sections.length === 0) return null;
  const Titre = niveau === 2 ? "h2" : "h3";
  const SousTitre = niveau === 2 ? "h3" : "h4";
  const date = carte.majLe ? formaterJourEnLettres(carte.majLe) : null;
  return (
    <section aria-labelledby={id} className="grid gap-4">
      <div className="rounded-carte border-2 border-encre bg-white p-5 shadow-brut md:p-6">
        <Titre id={id} className="font-titre text-2xl font-extrabold">
          <span aria-hidden="true">{type === "sortie" ? "🎟️ " : "🍽️ "}</span>{type === "sortie" ? "Les formules" : "La carte"}
        </Titre>
        <div className="mt-2 grid gap-6">
          {sections.map((section, i) => (
            <div key={`${i}-${section.titre}`}>
              <SousTitre className="border-b-2 border-encre pb-1 font-titre text-lg font-extrabold [overflow-wrap:anywhere]">{section.titre}</SousTitre>
              <ul>
                {section.elements.map((element, j) => <ElementCarteDuLieu key={`${j}-${element.nom}`} element={element} />)}
              </ul>
            </div>
          ))}
        </div>
        {date && <p className="mt-5 text-sm text-gris">{`Carte mise à jour par le lieu le ${date}.`}</p>}
      </div>
      {carteContientAlcool(carte) && <BlocPrevention />}
    </section>
  );
}
