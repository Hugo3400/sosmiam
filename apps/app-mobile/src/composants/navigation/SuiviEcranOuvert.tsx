import { usePathname } from "expo-router";
import { useEffect } from "react";

import { noterEcranOuvert } from "~/services/ecran-ouvert";

/**
 * Note l'écran ouvert (services/ecran-ouvert.ts), pour les notifications. Monté une fois, avec la pile d'écrans : un petit
 * composant à part, pour que la pile entière ne se redessine pas à chaque navigation. Démonté (écran de démarrage) : plus
 * aucun écran n'est noté.
 */
export function SuiviEcranOuvert() {
  const chemin = usePathname();

  useEffect(() => {
    noterEcranOuvert(chemin);
  }, [chemin]);

  useEffect(() => () => noterEcranOuvert(null), []);

  return null;
}
