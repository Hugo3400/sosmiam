import { useEffect, useState } from "react";

import { appeler } from "~/services/client-gestion.ts";

const PREFIXE = "/api-gestion/actus/medias/";
const cache = new Map<string, Promise<string>>();

function charger(adresse: string): Promise<string> {
  if (adresse.startsWith("data:image/")) return Promise.resolve(adresse);
  if (!adresse.startsWith(PREFIXE)) return Promise.reject(new Error("adresse-refusee"));
  let promesse = cache.get(adresse);
  if (!promesse) {
    promesse = appeler<Blob>("GET", adresse.slice("/api-gestion".length), { reponse: "blob" }).then((blob) => URL.createObjectURL(blob));
    promesse.catch(() => cache.delete(adresse));
    cache.set(adresse, promesse);
  }
  return promesse;
}

export function utiliserImageActus(adresse: string): { source: string | null; illisible: boolean } {
  const [etat, setEtat] = useState<{ source: string | null; illisible: boolean }>({ source: null, illisible: false });
  useEffect(() => {
    let actif = true;
    setEtat({ source: null, illisible: false });
    charger(adresse).then(
      (source) => actif && setEtat({ source, illisible: false }),
      () => actif && setEtat({ source: null, illisible: true }),
    );
    return () => {
      actif = false;
    };
  }, [adresse]);
  return etat;
}
