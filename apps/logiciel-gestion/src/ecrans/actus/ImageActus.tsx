import { ImageOff, LoaderCircle } from "lucide-react";

import { TEXTES_ACTUS } from "~/contenus/actus.ts";
import { utiliserImageActus } from "~/hooks/utiliser-image-actus.ts";

export function ImageActus({ adresse, alt, className = "" }: { adresse: string; alt: string; className?: string }) {
  const { source, illisible } = utiliserImageActus(adresse);
  if (illisible) {
    return (
      <div className={`grid place-items-center gap-1 bg-creme text-xs text-gris ${className}`}>
        <ImageOff className="size-5" aria-hidden />
        {TEXTES_ACTUS.imageIllisible}
      </div>
    );
  }
  if (!source) return <div className={`grid place-items-center bg-creme text-gris ${className}`}><LoaderCircle className="size-5 animate-spin" aria-hidden /></div>;
  return <img src={source} alt={alt} className={`object-cover ${className}`} />;
}
