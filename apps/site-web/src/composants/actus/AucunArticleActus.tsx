import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_ACTUS_PAR_LANGUE } from "~/contenus/actus";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function AucunArticleActus({ filtre }: { filtre: boolean }) {
  const textes = utiliserTextes(TEXTES_ACTUS_PAR_LANGUE);
  const T = filtre ? textes.aucun : textes.aucunDuTout;
  const lienLangue = utiliserLienLangue();
  return (
    <div className="flex flex-col items-center gap-3 rounded-carte border-2 border-dashed border-encre bg-white px-5 py-10 text-center">
      <p aria-hidden="true" className="text-5xl">✍️</p>
      <h3 className="text-2xl font-extrabold">{lierPonctuation(T.titre)}</h3>
      <p className="max-w-md text-gris">{lierPonctuation(T.texte)}</p>
      {filtre && <Bouton vers={lienLangue("/actus")} petit className="mt-2">{textes.aucun.lien}</Bouton>}
    </div>
  );
}
