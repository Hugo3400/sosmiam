import { useEffect, useSyncExternalStore } from "react";

import { changerThemesSaisonActifs, chargerThemesSaisonActifs, ecouterThemesSaisonActifs, lireThemesSaisonActifsEnMemoire } from "~/services/themes-saison-actifs";

export function utiliserThemesSaisonActifs(): [boolean, (valeur: boolean) => void] {
  const actifs = useSyncExternalStore(ecouterThemesSaisonActifs, lireThemesSaisonActifsEnMemoire);
  useEffect(() => {
    void chargerThemesSaisonActifs();
  }, []);
  return [actifs, changerThemesSaisonActifs];
}
