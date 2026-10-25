import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_IMAGES_LIEU } from "~/contenus/pro-images-lieu";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

export function EncartImagesLieu({ lieuId, gerant }: { lieuId: number; gerant: boolean }) {
  const T = TEXTES_IMAGES_LIEU.encartFiche;
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-2xl border-2 border-encre bg-white px-5 py-4 shadow-brut-petit">
      <div className="flex min-w-0 items-start gap-3">
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-encre bg-jaune text-lg">🖼️</span>
        <div className="min-w-0">
          <p className="font-bold">{T.titre}</p>
          <p className="text-sm text-gris">{lierPonctuation(T.texte)}</p>
        </div>
      </div>
      <Bouton vers={`/lieu/${lieuId}/images`} petit>{gerant ? T.lienGerant : T.lienEquipe}</Bouton>
    </div>
  );
}
