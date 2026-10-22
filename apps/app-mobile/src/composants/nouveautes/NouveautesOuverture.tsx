import { router } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";

import { FenetreNouveautes } from "~/composants/nouveautes/FenetreNouveautes";
import { utiliserNouveautesVersion } from "~/hooks/utiliser-nouveautes-version";

const DUREE_FERMETURE = Platform.OS === "ios" ? 700 : 450;

export function NouveautesOuverture() {
  const { nouveautes, ouverte, fermer, marquerMontree } = utiliserNouveautesVersion();
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (minuterie.current) clearTimeout(minuterie.current);
    },
    [],
  );

  const voir = useCallback(() => {
    fermer();
    if (minuterie.current) clearTimeout(minuterie.current);
    minuterie.current = setTimeout(() => router.push("/reglages/nouveautes"), DUREE_FERMETURE);
  }, [fermer]);

  return <FenetreNouveautes nouveautes={nouveautes} visible={ouverte} onVoir={voir} onFermer={fermer} onMontree={marquerMontree} />;
}
