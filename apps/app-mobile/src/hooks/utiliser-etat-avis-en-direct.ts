import { useEffect, useState } from "react";
import { AppState } from "react-native";

import { decrireEtatAvis } from "@sos-miam/commun/fonctions/visites/decrire-etat-avis";
import type { Visite } from "@sos-miam/commun/types/visite";

type EtatAvis = ReturnType<typeof decrireEtatAvis>;

const RELECTURE_MS = 30_000;
const MARGE_MS = 500;
const DELAI_MAX_MS = 2_000_000_000;

function lireProchainChangement(avis: Visite["avis"], etat: EtatAvis): number | null {
  if (!avis || (etat !== "a-venir" && etat !== "ouvert")) return null;
  return Date.parse(etat === "a-venir" ? avis.ouvertLe : avis.fermeLe);
}

export function utiliserEtatAvisEnDirect(avis: Visite["avis"]): { etat: EtatAvis; maintenant: Date } {
  const [maintenantMs, setMaintenantMs] = useState(() => Date.now());
  const etat = decrireEtatAvis(avis, maintenantMs);
  const prochain = lireProchainChangement(avis, etat);
  const aVenir = etat === "a-venir";

  useEffect(() => {
    if (prochain === null || Number.isNaN(prochain)) return;
    const jusquauChangement = Math.max(0, prochain - Date.now()) + MARGE_MS;
    const delai = aVenir ? Math.min(RELECTURE_MS, jusquauChangement) : jusquauChangement;
    if (delai > DELAI_MAX_MS) return;
    const minuterie = setTimeout(() => setMaintenantMs(Date.now()), delai);
    return () => clearTimeout(minuterie);
  }, [prochain, aVenir, maintenantMs]);

  useEffect(() => {
    const abonnement = AppState.addEventListener("change", (suivant) => {
      if (suivant === "active") setMaintenantMs(Date.now());
    });
    return () => abonnement.remove();
  }, []);

  return { etat, maintenant: new Date(maintenantMs) };
}
