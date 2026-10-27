import { VignetteImageLieu } from "~/composants/lieux/VignetteImageLieu";
import { TEXTES_SIGNALER_IMAGE } from "~/contenus/signaler-image";
import type { ImageSignalable } from "~/fonctions/lieux/lister-images-signalables";

type Props = {
  sources: Record<ImageSignalable, string | null | undefined>;
  images: readonly ImageSignalable[];
  choisie?: string;
  erreur?: string;
};

const ID_ERREUR = "signaler-quelle-erreur";

export function ChoixQuelleImage({ sources, images, choisie, erreur }: Props) {
  const T = TEXTES_SIGNALER_IMAGE.quelle;
  const [seule] = images;
  if (images.length === 1 && seule) {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border-2 border-encre bg-creme p-3">
        <input type="hidden" name="quelle" value={seule} />
        <VignetteImageLieu quelle={seule} source={sources[seule]} />
        <p className="flex min-w-0 flex-col">
          <strong>{T.seule[seule]}</strong>
          <span className="text-sm text-gris">{T.detail[seule]}</span>
        </p>
      </div>
    );
  }
  return (
    <fieldset>
      <legend className="mb-2.5 font-titre text-xl font-extrabold">{T.legende}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {images.map((quelle) => (
          <label
            key={quelle}
            className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-encre bg-white p-3 has-checked:bg-jaune-clair has-checked:shadow-brut-petit"
          >
            <input type="radio" name="quelle" value={quelle} defaultChecked={choisie === quelle} aria-describedby={erreur ? ID_ERREUR : undefined} className="size-5 shrink-0 accent-encre focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre" />
            <VignetteImageLieu quelle={quelle} source={sources[quelle]} />
            <span className="flex min-w-0 flex-col">
              <strong>{T[quelle]}</strong>
              <span className="text-sm text-gris">{T.detail[quelle]}</span>
            </span>
          </label>
        ))}
      </div>
      {erreur && <p id={ID_ERREUR} className="mt-1.5 text-sm font-semibold text-rouge-texte">{erreur}</p>}
    </fieldset>
  );
}
