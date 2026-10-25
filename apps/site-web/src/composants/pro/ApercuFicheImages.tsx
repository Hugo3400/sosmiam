import { useCallback, useState } from "react";

import { BadgeVerifie } from "~/composants/lieux/BadgeVerifie";
import { ImageLieuEnLigne } from "~/composants/pro/ImageLieuEnLigne";
import { ToileRecadrage } from "~/composants/pro/ToileRecadrage";
import { TEXTES_IMAGES_LIEU } from "~/contenus/pro-images-lieu";
import { choisirCouleursLieu } from "~/fonctions/lieux/choisir-couleurs-lieu";
import { choisirEmojiLieu } from "~/fonctions/lieux/choisir-emoji-lieu";
import { recentrerCadre } from "~/fonctions/pro/recentrer-cadre";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { LieuApercuImages, VisuelImageLieu } from "~/types/images-lieu";
import { BANNIERE_LIEU, LOGO_LIEU } from "../../../../../packages/commun/src/regles/images-lieu.ts";

type Props = { lieu: LieuApercuImages; banniere: VisuelImageLieu; logo: VisuelImageLieu; emplacementLogo: boolean };

const BANNIERE_TELEPHONE = { largeur: 780, hauteur: 352 };
const LOGO_APERCU = 256;
const RAPPORT_TELEPHONE = BANNIERE_TELEPHONE.largeur / BANNIERE_TELEPHONE.hauteur;

export function ApercuFicheImages({ lieu, banniere, logo, emplacementLogo }: Props) {
  const T = TEXTES_IMAGES_LIEU.apercu;
  const [panne, setPanne] = useState(false);
  const signalerPanne = useCallback(() => setPanne(true), []);
  const [debut, fin] = choisirCouleursLieu(lieu.couleurs);
  const nouveau = banniere?.genre === "toile" || logo?.genre === "toile";
  const ligne = [lieu.info, lieu.quartier || lieu.ville].filter(Boolean).join(" · ");

  const fondBanniere = (
    <div className="grid h-full w-full place-items-center text-5xl" style={{ background: `linear-gradient(135deg, ${debut}, ${fin})` }}>
      <span aria-hidden="true">{choisirEmojiLieu(lieu.emoji)}</span>
    </div>
  );
  const fondLogo = (
    <span className="grid h-full w-full place-items-center bg-creme p-1 text-center text-[10px] leading-tight font-semibold text-gris">{T.sansLogo}</span>
  );

  return (
    <section aria-labelledby="apercu-images-titre">
      <h2 id="apercu-images-titre" className="mb-3 text-2xl font-extrabold">{T.titre}</h2>
      <div className="mx-auto w-full max-w-[360px] overflow-hidden rounded-[28px] border-2 border-encre bg-creme shadow-brut">
        <div className="aspect-[390/176] w-full overflow-hidden bg-ligne">
          {banniere?.genre === "toile" ? (
            <ToileRecadrage
              source={banniere.source}
              cadre={recentrerCadre(banniere.cadre, RAPPORT_TELEPHONE)}
              largeur={BANNIERE_TELEPHONE.largeur}
              hauteur={BANNIERE_TELEPHONE.hauteur}
              opaque
              className="block h-full w-full"
            />
          ) : banniere?.genre === "adresse" ? (
            <ImageLieuEnLigne
              adresse={banniere.adresse}
              largeur={BANNIERE_LIEU.largeur}
              hauteur={BANNIERE_LIEU.hauteur}
              secours={fondBanniere}
              onPanne={signalerPanne}
              className="h-full w-full object-cover"
            />
          ) : fondBanniere}
        </div>
        <div className="relative mx-3 -mt-6 rounded-2xl border-2 border-encre bg-white p-3 shadow-brut-petit">
          <div className="flex items-start gap-3">
            {(logo || emplacementLogo) && (
              <div className={`-mt-9 size-16 shrink-0 overflow-hidden rounded-xl border-[3px] border-encre bg-white shadow-brut-petit ${logo ? "" : "border-dashed"}`}>
                {logo?.genre === "toile" ? (
                  <ToileRecadrage source={logo.source} cadre={logo.cadre} largeur={LOGO_APERCU} hauteur={LOGO_APERCU} opaque={false} className="block h-full w-full" />
                ) : logo?.genre === "adresse" ? (
                  <ImageLieuEnLigne
                    adresse={logo.adresse}
                    largeur={LOGO_LIEU.largeur}
                    hauteur={LOGO_LIEU.hauteur}
                    secours={fondLogo}
                    onPanne={signalerPanne}
                    className="h-full w-full object-cover"
                  />
                ) : fondLogo}
              </div>
            )}
            <div className="min-w-0">
              <BadgeVerifie verifie={lieu.estVerifie} petit />
              <p className="mt-1.5 text-lg leading-tight font-extrabold [overflow-wrap:anywhere]">{lieu.nom}</p>
              {ligne && <p className="mt-0.5 text-xs text-gris [overflow-wrap:anywhere]">{ligne}</p>}
            </div>
          </div>
        </div>
        <div aria-hidden="true" className="grid gap-2 p-4">
          <span className="h-3 w-2/3 rounded-full bg-ligne" />
          <span className="h-3 w-full rounded-full bg-ligne" />
          <span className="h-3 w-5/6 rounded-full bg-ligne" />
        </div>
      </div>
      <p className="mx-auto mt-3 max-w-[360px] text-sm text-gris">{lierPonctuation(T.legende)}</p>
      {nouveau && <p className="mx-auto mt-2 max-w-[360px] text-sm font-semibold">{lierPonctuation(T.nouveau)}</p>}
      {panne && <p className="mx-auto mt-2 max-w-[360px] text-sm text-gris">{lierPonctuation(T.indisponible)}</p>}
    </section>
  );
}
