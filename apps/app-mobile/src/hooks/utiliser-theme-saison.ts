import { useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";

import { choisirThemeDuJour } from "@sos-miam/commun/fonctions/themes-saison/choisir-theme-du-jour";
import { lireThemeSaisonApi } from "@sos-miam/commun/fonctions/themes-saison/lire-theme-saison-api";
import { preparerThemeSaisonApi } from "@sos-miam/commun/fonctions/themes-saison/preparer-theme-saison-api";
import { calculerJourParis } from "@sos-miam/commun/fonctions/temps/calculer-jour-paris";
import type { ThemeSaisonApi } from "@sos-miam/commun/types/theme-saison";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserThemesSaisonActifs } from "~/hooks/utiliser-themes-saison-actifs";
import { clientApiPublic } from "~/services/client-api-public";

type ThemeDuServeur = { cle: string; theme: ThemeSaisonApi | null };

const lireJour = () => calculerJourParis(Date.now());

async function demanderThemeDuServeur(ville: string | null): Promise<ThemeSaisonApi | null | undefined> {
  const reponse = await clientApiPublic.demander<{ themes?: unknown }>("GET", `/app/themes${ville ? `?ville=${encodeURIComponent(ville)}` : ""}`);
  if (!reponse.ok || !Array.isArray(reponse.themes)) return undefined;
  if (reponse.themes.length === 0) return null;
  return lireThemeSaisonApi(reponse.themes[0]) ?? undefined;
}

export function utiliserThemeSaison(): ThemeSaisonApi | null {
  const [actifs] = utiliserThemesSaisonActifs();
  const { langue } = utiliserLangue();
  const ville = utiliserProfil().profil?.ville ?? null;
  const [jour, setJour] = useState(lireJour);
  const [duServeur, setDuServeur] = useState<ThemeDuServeur | null>(null);
  const cle = `${jour}|${ville ?? ""}|${langue}`;

  useEffect(() => {
    const abonnement = AppState.addEventListener("change", (etat) => {
      if (etat === "active") setJour(lireJour());
    });
    return () => abonnement.remove();
  }, []);

  useEffect(() => {
    if (!actifs) return;
    let actif = true;
    demanderThemeDuServeur(ville)
      .then((theme) => {
        if (actif && theme !== undefined) setDuServeur({ cle, theme });
      })
      .catch(() => {});
    return () => {
      actif = false;
    };
  }, [actifs, cle, ville]);

  return useMemo(() => {
    if (!actifs) return null;
    if (duServeur?.cle === cle) return duServeur.theme;
    const duJour = choisirThemeDuJour(jour, ville);
    return duJour ? preparerThemeSaisonApi(duJour, langue) : null;
  }, [actifs, duServeur, cle, jour, ville, langue]);
}
