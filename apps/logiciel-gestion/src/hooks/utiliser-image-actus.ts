import { useEffect, useState } from "react";

import { CHEMIN_MEDIAS_ACTUS_GESTION } from "../../../../packages/commun/src/regles/actus.ts";
import { appeler } from "~/services/client-gestion.ts";

const FORME_NOM = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/;
const cache = new Map<string, Promise<string>>();

function charger(adresse: string): Promise<string> {
  const nom = adresse.startsWith(`${CHEMIN_MEDIAS_ACTUS_GESTION}/`) ? adresse.slice(CHEMIN_MEDIAS_ACTUS_GESTION.length + 1) : "";
  if (!FORME_NOM.test(nom)) return Promise.reject(new Error("adresse-refusee"));
  let promesse = cache.get(nom);
  if (!promesse) {
    promesse = appeler<Blob>("GET", `/actus/medias/${nom}`, { reponse: "blob" }).then((blob) => URL.createObjectURL(blob));
    promesse.catch(() => cache.delete(nom));
    cache.set(nom, promesse);
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
