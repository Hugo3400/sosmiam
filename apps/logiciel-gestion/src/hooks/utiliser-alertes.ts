import { useCallback, useEffect, useRef, useState } from "react";

import { NOUVEAUTES_ALERTES, TEXTES_ALERTES_WINDOWS } from "~/contenus/alertes-windows.ts";
import { calculerPastilles } from "~/fonctions/alertes/calculer-pastilles.ts";
import { lireAlertes, type Alertes } from "~/services/alertes.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { lireCompteurs } from "~/services/compteurs.ts";
import { notifier } from "~/services/systeme.ts";

const CLE_BIG_SOS = "sosmiam-gestion:big-sos-annonces";
const lireAnnonces = (): number[] => {
  try {
    return JSON.parse(localStorage.getItem(CLE_BIG_SOS) ?? "[]") as number[];
  } catch {
    return [];
  }
};
const garderAnnonces = (ids: number[]) => {
  try {
    localStorage.setItem(CLE_BIG_SOS, JSON.stringify(ids.slice(-50)));
  } catch {
    return;
  }
};
const compterEnAttente = (alertes: Alertes) =>
  Object.values(calculerPastilles(alertes, 0)).reduce((somme, pastille) => somme + (pastille?.nombre ?? 0), 0);

export function utiliserAlertes(connecte: boolean, jeton: string | null, onJetonRefuse: () => void) {
  const [alertes, setAlertes] = useState<Alertes | null>(null);
  const precedentes = useRef<Alertes | null>(null);
  const verifierMaintenant = useRef<(() => Promise<void>) | null>(null);
  const surRefus = useRef(onJetonRefuse);
  surRefus.current = onJetonRefuse;

  useEffect(() => {
    if (!connecte && jeton === null) return;
    let annule = false;
    const verifier = async () => {
      try {
        const nouvelles = connecte ? await lireAlertes() : await lireCompteurs(jeton!);
        if (annule) return;
        const avant = precedentes.current;
        if (avant) {
          for (const nouveaute of NOUVEAUTES_ALERTES) if (nouveaute.lire(nouvelles) > nouveaute.lire(avant)) void notifier(nouveaute.titre, nouveaute.texte);
        } else if (document.visibilityState === "hidden") {
          const total = compterEnAttente(nouvelles);
          if (total > 0) void notifier(TEXTES_ALERTES_WINDOWS.enAttente.titre, TEXTES_ALERTES_WINDOWS.enAttente.texte(total));
        }
        const annonces = lireAnnonces();
        for (const bigSos of nouvelles.bigSos.demarrentBientot.filter((b) => !annonces.includes(b.id))) {
          void notifier(TEXTES_ALERTES_WINDOWS.bigSosDemain.titre, TEXTES_ALERTES_WINDOWS.bigSosDemain.texte(bigSos.lieu));
          annonces.push(bigSos.id);
        }
        garderAnnonces(annonces);
        precedentes.current = nouvelles;
        setAlertes(nouvelles);
      } catch (probleme) {
        if (!connecte && probleme instanceof ErreurApi && probleme.code === "non-autorise") surRefus.current();
      }
    };
    verifierMaintenant.current = verifier;
    void verifier();
    const minuteur = setInterval(verifier, 60_000);
    return () => {
      annule = true;
      verifierMaintenant.current = null;
      clearInterval(minuteur);
    };
  }, [connecte, jeton]);

  const actualiser = useCallback(() => void verifierMaintenant.current?.(), []);
  return { alertes, actualiser };
}
