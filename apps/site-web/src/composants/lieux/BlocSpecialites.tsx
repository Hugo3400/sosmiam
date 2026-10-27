import { CLASSE_BLOC, CLASSE_TITRE_BLOC } from "~/composants/lieux/classes-fiche-lieu";
import { formaterPrixLangue } from "../../../../../packages/commun/src/fonctions/langue/formater-prix-langue.ts";
import { TEXTES_FICHE_LIEU_PAR_LANGUE } from "~/contenus/fiche-lieu";
import { listerSpecialitesCarte } from "~/fonctions/carte/lister-specialites-carte";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { CarteLieu } from "~/types/carte";

const SPECIALITES_MAX = 4;

export function BlocSpecialites({ carte }: { carte: CarteLieu | null | undefined }) {
  const T = utiliserTextes(TEXTES_FICHE_LIEU_PAR_LANGUE);
  const langue = utiliserLangue();
  const specialites = listerSpecialitesCarte(carte, SPECIALITES_MAX);
  if (specialites.length === 0) return null;
  return (
    <section aria-labelledby="fiche-specialites" className={`flex flex-col gap-3 ${CLASSE_BLOC}`}>
      <h2 id="fiche-specialites" className={CLASSE_TITRE_BLOC}>{T.specialites}</h2>
      <ul lang="fr" className="grid grid-cols-2 gap-2.5">
        {specialites.map((specialite, rang) => (
          <li key={`${rang}-${specialite.nom}`} className="flex flex-col gap-1 rounded-[14px] bg-creme p-3">
            <span className="text-[15px] font-bold [overflow-wrap:anywhere]">{specialite.nom}</span>
            <span className="text-[13px] text-gris">{formaterPrixLangue(specialite.prix, langue)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
