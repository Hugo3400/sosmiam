import { useState } from "react";

import { ApercuFicheImages } from "~/composants/pro/ApercuFicheImages";
import { EditeurImageLieu } from "~/composants/pro/EditeurImageLieu";
import { TEXTES_IMAGES_LIEU_PAR_LANGUE } from "~/contenus/pro-images-lieu";
import { calculerCadreRecadrage } from "~/fonctions/pro/calculer-cadre-recadrage";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserJavascriptActif } from "~/hooks/utiliser-javascript-actif";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { BrouillonImageLieu, ImagesDuLieu, LieuApercuImages, VisuelImageLieu } from "~/types/images-lieu";
import { IMAGES_LIEU, REGLES_IMAGES_LIEU, type ImageLieu } from "../../../../../packages/commun/src/regles/images-lieu.ts";

type Props = {
  lieuId: number;
  lieu: LieuApercuImages;
  images: ImagesDuLieu | null;
  modifiable: boolean;
};

const AUCUNE: ImagesDuLieu = { banniere: null, logo: null };
const SANS_BROUILLON: Record<ImageLieu, BrouillonImageLieu | null> = { banniere: null, logo: null };

export function GestionImagesLieu({ lieuId, lieu, images, modifiable }: Props) {
  const javascript = utiliserJavascriptActif();
  const [actuelles, setActuelles] = useState<ImagesDuLieu>(images ?? AUCUNE);
  const [connues, setConnues] = useState<Record<ImageLieu, boolean>>({ banniere: images !== null, logo: images !== null });
  const [brouillons, setBrouillons] = useState(SANS_BROUILLON);
  const T = utiliserTextes(TEXTES_IMAGES_LIEU_PAR_LANGUE).etats.sansJavascript;

  const visuel = (quelle: ImageLieu): VisuelImageLieu => {
    const brouillon = brouillons[quelle];
    if (brouillon) {
      const dimensions = { largeur: brouillon.source.width, hauteur: brouillon.source.height };
      return { genre: "toile", source: brouillon.source, cadre: calculerCadreRecadrage(dimensions, REGLES_IMAGES_LIEU[quelle], brouillon.reglage) };
    }
    const adresse = actuelles[quelle];
    return adresse ? { genre: "adresse", adresse } : null;
  };

  const enregistrer = (quelle: ImageLieu) => (adresse: string | null, connue: boolean) => {
    setActuelles((avant) => ({ ...avant, [quelle]: adresse }));
    setConnues((avant) => ({ ...avant, [quelle]: connue }));
  };

  return (
    <div className={`grid gap-8 ${modifiable ? "lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start" : ""}`}>
      <div className={modifiable ? "lg:sticky lg:top-6 lg:order-2" : ""}>
        <ApercuFicheImages lieu={lieu} banniere={visuel("banniere")} logo={visuel("logo")} emplacementLogo={modifiable} />
      </div>
      {modifiable && (
        <div className="grid min-w-0 gap-8 lg:order-1">
          <noscript>
            <div role="note" className="rounded-2xl border-2 border-dashed border-encre bg-white px-5 py-4">
              <p className="font-bold">{lierPonctuation(T.titre)}</p>
              <p className="mt-1 text-gris">{lierPonctuation(T.texte)}</p>
            </div>
          </noscript>
          {javascript &&
            IMAGES_LIEU.map((quelle) => (
              <EditeurImageLieu
                key={quelle}
                lieuId={lieuId}
                quelle={quelle}
                actuelle={actuelles[quelle]}
                connue={connues[quelle]}
                brouillon={brouillons[quelle]}
                onBrouillon={(brouillon) => setBrouillons((avant) => ({ ...avant, [quelle]: brouillon }))}
                onEnregistree={enregistrer(quelle)}
              />
            ))}
        </div>
      )}
    </div>
  );
}
