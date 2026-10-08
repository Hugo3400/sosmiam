import { ImageOff, LoaderCircle } from "lucide-react";

import { utiliserMedia } from "~/hooks/utiliser-media.ts";

type Props = { fichier: string | null; video?: boolean; className?: string; controles?: boolean; alt?: string };

/** Une image ou une vidéo de publication, téléchargée par une demande signée. */
export function VignetteMedia({ fichier, video, className = "", controles, alt = "" }: Props) {
  const adresse = utiliserMedia(fichier);
  if (!fichier) return <div className={`grid place-items-center bg-creme text-gris ${className}`}><ImageOff className="size-5" aria-hidden /></div>;
  if (!adresse) return <div className={`grid place-items-center bg-creme text-gris ${className}`}><LoaderCircle className="size-5 animate-spin" aria-hidden /></div>;
  return video ? (
    <video src={adresse} className={`object-cover ${className}`} controls={controles} muted loop playsInline />
  ) : (
    <img src={adresse} alt={alt} className={`object-cover ${className}`} />
  );
}
