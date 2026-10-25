import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AppState } from "react-native";

import { LANGUES_OUVERTES_APP } from "@sos-miam/commun/regles/langues";
import type { ReglageLangue } from "~/contenus/type-langue";
import { choisirLangueApp } from "~/fonctions/langue/choisir-langue-app";
import { ContexteLangue, type EtatLangue } from "~/hooks/utiliser-langue";
import { DEMO_POSSIBLE } from "~/services/demo/demo-visites-active";
import { poserLangueActuelle } from "~/services/langue-actuelle";
import { lireLanguesTelephone } from "~/services/langues-telephone";
import { enregistrerReglageLangue, lireReglageLangue } from "~/stockage/langue";

const lireCodesTelephone = () => lireLanguesTelephone().join(",");

export function FournisseurLangue({ children }: { children: ReactNode }) {
  const [reglage, setReglage] = useState<ReglageLangue | null>(null);
  const [codesTelephone, setCodesTelephone] = useState(lireCodesTelephone);

  useEffect(() => {
    let actif = true;
    void lireReglageLangue().then((lu) => {
      if (actif) setReglage(lu);
    });
    const abonnement = AppState.addEventListener("change", (etat) => {
      if (etat === "active") setCodesTelephone(lireCodesTelephone());
    });
    return () => {
      actif = false;
      abonnement.remove();
    };
  }, []);

  const changerReglage = useCallback((nouveau: ReglageLangue) => {
    setReglage(nouveau);
    void enregistrerReglageLangue(nouveau);
  }, []);

  const langue = choisirLangueApp(reglage ?? "automatique", codesTelephone.split(","), LANGUES_OUVERTES_APP, DEMO_POSSIBLE);
  poserLangueActuelle(langue);

  const valeur = useMemo<EtatLangue>(() => ({ langue, reglage: reglage ?? "automatique", changerReglage }), [langue, reglage, changerReglage]);

  if (reglage === null) return null;
  return <ContexteLangue.Provider value={valeur}>{children}</ContexteLangue.Provider>;
}
