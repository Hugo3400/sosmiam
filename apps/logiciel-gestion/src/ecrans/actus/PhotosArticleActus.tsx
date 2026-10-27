import { useState } from "react";

import { Modale } from "~/composants/interface/Modale.tsx";
import { TEXTES_ACTUS as T } from "~/contenus/actus.ts";
import { ImageActus } from "./ImageActus.tsx";

export function PhotosArticleActus({ photos }: { photos: string[] }) {
  const [agrandie, setAgrandie] = useState<number | null>(null);
  if (photos.length === 0) return null;

  return (
    <div className="grid gap-2">
      <p className="text-sm font-extrabold">{T.photosDuTexte}</p>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {photos.map((photo, rang) => (
          <li key={photo}>
            <button type="button" onClick={() => setAgrandie(rang)} aria-label={T.agrandir(rang + 1)} className="block w-full overflow-hidden rounded-xl border border-ligne hover:border-encre">
              <ImageActus adresse={photo} alt="" className="aspect-square w-full" />
            </button>
          </li>
        ))}
      </ul>
      <Modale titre={agrandie === null ? "" : T.photo(agrandie + 1, photos.length)} ouverte={agrandie !== null} onFermer={() => setAgrandie(null)} large>
        {agrandie !== null && <ImageActus adresse={photos[agrandie]!} alt={T.photo(agrandie + 1, photos.length)} className="max-h-[70vh] w-full object-contain" />}
      </Modale>
    </div>
  );
}
