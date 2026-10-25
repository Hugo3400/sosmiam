import { useEffect, useState } from "react";

import { lireEpingle } from "~/fonctions/page-lieux/lire-epingle";
import type { CategorieLieu, EpingleLieu } from "~/types/lieux";

export type EtatEpingles = { etat: "chargement" | "pret" | "erreur"; epingles: EpingleLieu[] };

export function utiliserEpingles(ville: string | null, type: CategorieLieu | null): EtatEpingles {
  const [etat, setEtat] = useState<EtatEpingles>({ etat: "chargement", epingles: [] });

  useEffect(() => {
    const controle = new AbortController();
    const parametres = new URLSearchParams();
    if (ville) parametres.set("ville", ville);
    if (type) parametres.set("type", type);
    const requete = parametres.toString();
    setEtat((avant) => ({ etat: "chargement", epingles: avant.epingles }));
    fetch(requete ? `/lieux/epingles?${requete}` : "/lieux/epingles", { signal: controle.signal })
      .then((reponse) => reponse.json())
      .then((corps: unknown) => {
        const { ok, epingles } = typeof corps === "object" && corps !== null ? (corps as { ok?: unknown; epingles?: unknown }) : {};
        if (ok !== true || !Array.isArray(epingles)) return setEtat({ etat: "erreur", epingles: [] });
        setEtat({ etat: "pret", epingles: epingles.flatMap((epingle) => lireEpingle(epingle) ?? []) });
      })
      .catch(() => {
        if (!controle.signal.aborted) setEtat({ etat: "erreur", epingles: [] });
      });
    return () => controle.abort();
  }, [ville, type]);

  return etat;
}
