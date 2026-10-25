import { CarteLieuAutour } from "~/composants/lieux/CarteLieuAutour";
import { TEXTES_FICHE_LIEU } from "~/contenus/fiche-lieu";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { CategorieLieu, LieuListe } from "~/types/lieux";

export function AutourDuLieu({ lieux, type }: { lieux: LieuListe[]; type: CategorieLieu }) {
  const T = TEXTES_FICHE_LIEU.autour;
  if (lieux.length === 0) return null;
  return (
    <section aria-labelledby="fiche-autour" className="flex flex-col gap-4">
      <h2 id="fiche-autour" className="text-[26px] font-extrabold md:text-[30px]">{lierPonctuation(type === "sortie" ? T.titreSortie : T.titre)}</h2>
      <ul className="grid gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-4">
        {lieux.map((lieu) => (
          <li key={lieu.id}>
            <CarteLieuAutour lieu={lieu} sansVisuel={type === "bar"} />
          </li>
        ))}
      </ul>
    </section>
  );
}
