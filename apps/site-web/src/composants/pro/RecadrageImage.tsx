import { useId, useRef, type PointerEvent } from "react";

import { CurseurRecadrage } from "~/composants/pro/CurseurRecadrage";
import { ToileRecadrage } from "~/composants/pro/ToileRecadrage";
import { TEXTES_IMAGES_LIEU } from "~/contenus/pro-images-lieu";
import { calculerCadreRecadrage, ZOOM_MAX_RECADRAGE } from "~/fonctions/pro/calculer-cadre-recadrage";
import { deplacerReglageRecadrage } from "~/fonctions/pro/deplacer-reglage-recadrage";
import { detecterImageAgrandie } from "~/fonctions/pro/detecter-image-agrandie";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { ReglageRecadrage } from "~/types/images-lieu";
import { REGLES_IMAGES_LIEU, type ImageLieu } from "../../../../../packages/commun/src/regles/images-lieu.ts";

type Props = {
  quelle: ImageLieu;
  source: ImageBitmap;
  reglage: ReglageRecadrage;
  onReglage: (reglage: ReglageRecadrage) => void;
};

const PAS_ZOOM = 0.05;
const POURCENT = 100;
const MARGE_IMMOBILE = 0.5;
const DAMIER = {
  backgroundImage: "conic-gradient(#EDE6D3 25%, #FFFFFF 0 50%, #EDE6D3 0 75%, #FFFFFF 0)",
  backgroundSize: "20px 20px",
};
const formatZoom = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });

export function RecadrageImage({ quelle, source, reglage, onReglage }: Props) {
  const T = TEXTES_IMAGES_LIEU.recadrage;
  const regle = REGLES_IMAGES_LIEU[quelle];
  const dimensions = { largeur: source.width, hauteur: source.height };
  const cadre = calculerCadreRecadrage(dimensions, regle, reglage);
  const opaque = regle.type === "image/jpeg";
  const zone = useRef<HTMLDivElement>(null);
  const appui = useRef<{ id: number; x: number; y: number } | null>(null);
  const reglageCourant = useRef(reglage);
  reglageCourant.current = reglage;
  const idAide = useId();

  const commencer = (evenement: PointerEvent<HTMLDivElement>) => {
    evenement.currentTarget.setPointerCapture(evenement.pointerId);
    appui.current = { id: evenement.pointerId, x: evenement.clientX, y: evenement.clientY };
  };
  const glisser = (evenement: PointerEvent<HTMLDivElement>) => {
    const depart = appui.current;
    const largeurAffichee = zone.current?.clientWidth ?? 0;
    if (!depart || depart.id !== evenement.pointerId || largeurAffichee === 0) return;
    const echelle = calculerCadreRecadrage(dimensions, regle, reglageCourant.current).largeur / largeurAffichee;
    const decalage = { x: -(evenement.clientX - depart.x) * echelle, y: -(evenement.clientY - depart.y) * echelle };
    appui.current = { ...depart, x: evenement.clientX, y: evenement.clientY };
    reglageCourant.current = deplacerReglageRecadrage(dimensions, regle, reglageCourant.current, decalage);
    onReglage(reglageCourant.current);
  };
  const finir = () => {
    appui.current = null;
  };

  return (
    <div className="grid gap-4">
      <p id={idAide} className="text-sm text-gris">{lierPonctuation(T.aide)}</p>
      <div
        ref={zone}
        role="img"
        aria-label={TEXTES_IMAGES_LIEU.images[quelle].zone}
        aria-describedby={idAide}
        onPointerDown={commencer}
        onPointerMove={glisser}
        onPointerUp={finir}
        onPointerCancel={finir}
        className={`w-full cursor-grab touch-none overflow-hidden rounded-2xl border-2 border-encre select-none active:cursor-grabbing ${quelle === "logo" ? "mx-auto max-w-[320px]" : ""}`}
        style={{ aspectRatio: `${regle.largeur} / ${regle.hauteur}`, ...(opaque ? {} : DAMIER) }}
      >
        <ToileRecadrage source={source} cadre={cadre} largeur={regle.largeur} hauteur={regle.hauteur} opaque={opaque} className="pointer-events-none block h-full w-full" />
      </div>
      {detecterImageAgrandie(cadre, regle) && (
        <p className="rounded-xl border-2 border-dashed border-encre bg-jaune-clair px-4 py-3 text-sm font-semibold">{lierPonctuation(T.floue)}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <CurseurRecadrage
          etiquette={T.zoom}
          min={1}
          max={ZOOM_MAX_RECADRAGE}
          pas={PAS_ZOOM}
          valeur={reglage.zoom}
          valeurTexte={T.valeurZoom(formatZoom.format(reglage.zoom))}
          onChange={(zoom) => onReglage({ ...reglage, zoom })}
        />
        {dimensions.largeur - cadre.largeur > MARGE_IMMOBILE && (
          <CurseurRecadrage etiquette={T.horizontal} min={0} max={POURCENT} pas={1} valeur={Math.round(reglage.x * POURCENT)} onChange={(x) => onReglage({ ...reglage, x: x / POURCENT })} />
        )}
        {dimensions.hauteur - cadre.hauteur > MARGE_IMMOBILE && (
          <CurseurRecadrage etiquette={T.vertical} min={0} max={POURCENT} pas={1} valeur={Math.round(reglage.y * POURCENT)} onChange={(y) => onReglage({ ...reglage, y: y / POURCENT })} />
        )}
      </div>
    </div>
  );
}
