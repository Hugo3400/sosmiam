import { useEffect, useState } from "react";

import { lireFichierMedia } from "~/services/publications.ts";

// Les médias ne sont servis qu'aux demandes signées : on les télécharge une fois, puis on garde leur adresse locale (blob:).
const cache = new Map<string, Promise<string>>();

/** Adresse locale d'un média de publication, ou null tant qu'il charge (ou s'il est illisible). */
export function utiliserMedia(fichier: string | null): string | null {
  const [adresse, setAdresse] = useState<string | null>(null);
  useEffect(() => {
    if (!fichier) return setAdresse(null);
    let actif = true;
    let promesse = cache.get(fichier);
    if (!promesse) {
      promesse = lireFichierMedia(fichier).then((blob) => URL.createObjectURL(blob));
      promesse.catch(() => cache.delete(fichier));
      cache.set(fichier, promesse);
    }
    promesse.then((url) => actif && setAdresse(url), () => actif && setAdresse(null));
    return () => {
      actif = false;
    };
  }, [fichier]);
  return adresse;
}
