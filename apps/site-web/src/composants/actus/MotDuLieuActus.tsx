import type { ReponseLieuActus } from "../../../../../packages/commun/src/types/actus.ts";
import { TEXTES_ACTUS_PAR_LANGUE } from "~/contenus/actus";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function MotDuLieuActus({ reponse }: { reponse: ReponseLieuActus }) {
  const A = utiliserTextes(TEXTES_ACTUS_PAR_LANGUE).article;
  return (
    <section aria-labelledby="mot-du-lieu" className="flex flex-col gap-2 rounded-carte border-2 border-dashed border-encre bg-white p-5">
      <h2 id="mot-du-lieu" className="text-lg font-extrabold">{A.motDuLieu}</h2>
      <p lang="fr" className="font-bold">{reponse.nomLieu}</p>
      <p lang="fr" className="leading-relaxed">{lierPonctuation(reponse.texte)}</p>
      <p className="text-sm text-gris">{A.reponseRelue}</p>
    </section>
  );
}
