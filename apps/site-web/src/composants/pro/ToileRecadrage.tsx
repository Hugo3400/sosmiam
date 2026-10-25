import { useEffect, useRef } from "react";

import { dessinerRecadrage } from "~/fonctions/pro/dessiner-recadrage";
import type { Cadre } from "~/types/images-lieu";

type Props = {
  source: ImageBitmap;
  cadre: Cadre;
  largeur: number;
  hauteur: number;
  opaque: boolean;
  etiquette?: string;
  className?: string;
};

export function ToileRecadrage({ source, cadre, largeur, hauteur, opaque, etiquette, className = "" }: Props) {
  const toile = useRef<HTMLCanvasElement>(null);
  const { x, y, largeur: largeurCadre, hauteur: hauteurCadre } = cadre;

  useEffect(() => {
    if (!toile.current) return;
    try {
      dessinerRecadrage(toile.current, source, { x, y, largeur: largeurCadre, hauteur: hauteurCadre }, opaque);
    } catch {
      toile.current.getContext("2d")?.clearRect(0, 0, largeur, hauteur);
    }
  }, [source, x, y, largeurCadre, hauteurCadre, opaque, largeur, hauteur]);

  return (
    <canvas
      ref={toile}
      width={largeur}
      height={hauteur}
      role={etiquette ? "img" : undefined}
      aria-label={etiquette}
      aria-hidden={etiquette ? undefined : true}
      className={className}
    />
  );
}
