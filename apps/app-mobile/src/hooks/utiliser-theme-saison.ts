import { useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";

import { choisirThemeDuJour } from "@sos-miam/commun/fonctions/themes-saison/choisir-theme-du-jour";
import { preparerThemeSaisonApi } from "@sos-miam/commun/fonctions/themes-saison/preparer-theme-saison-api";
import { calculerJourParis } from "@sos-miam/commun/fonctions/temps/calculer-jour-paris";
import type { ThemeSaisonApi } from "@sos-miam/commun/types/theme-saison";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserThemesSaisonActifs } from "~/hooks/utiliser-themes-saison-actifs";

const lireJour = () => calculerJourParis(Date.now());

export function utiliserThemeSaison(): ThemeSaisonApi | null {
  const [actifs] = utiliserThemesSaisonActifs();
  const { langue } = utiliserLangue();
  const ville = utiliserProfil().profil?.ville ?? null;
  const [jour, setJour] = useState(lireJour);

  useEffect(() => {
    const abonnement = AppState.addEventListener("change", (etat) => {
      if (etat === "active") setJour(lireJour());
    });
    return () => abonnement.remove();
  }, []);

  return useMemo(() => {
    if (!actifs) return null;
    const duJour = choisirThemeDuJour(jour, ville);
    return duJour ? preparerThemeSaisonApi(duJour, langue) : null;
  }, [actifs, jour, ville, langue]);
}
