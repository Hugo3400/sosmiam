import { CLASSE_BLOC, CLASSE_TITRE_BLOC } from "~/composants/lieux/classes-fiche-lieu";
import { TEXTES_FICHE_LIEU } from "~/contenus/fiche-lieu";
import { listerSpecialitesCarte } from "~/fonctions/carte/lister-specialites-carte";
import { formaterPrix } from "~/fonctions/prix/formater-prix";
import type { CarteLieu } from "~/types/carte";

const SPECIALITES_MAX = 4;

export function BlocSpecialites({ carte }: { carte: CarteLieu | null | undefined }) {
  const specialites = listerSpecialitesCarte(carte, SPECIALITES_MAX);
  if (specialites.length === 0) return null;
  return (
    <section aria-labelledby="fiche-specialites" className={`flex flex-col gap-3 ${CLASSE_BLOC}`}>
      <h2 id="fiche-specialites" className={CLASSE_TITRE_BLOC}>{TEXTES_FICHE_LIEU.specialites}</h2>
      <ul lang="fr" className="grid grid-cols-2 gap-2.5">
        {specialites.map((specialite, rang) => (
          <li key={`${rang}-${specialite.nom}`} className="flex flex-col gap-1 rounded-[14px] bg-creme p-3">
            <span className="text-[15px] font-bold [overflow-wrap:anywhere]">{specialite.nom}</span>
            <span className="text-[13px] text-gris">{formaterPrix(specialite.prix)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
