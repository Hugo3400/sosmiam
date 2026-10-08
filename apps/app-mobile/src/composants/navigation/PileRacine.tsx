import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { utiliserProfil } from "~/hooks/utiliser-profil";

/**
 * Pile d'écrans de l'app. Pas encore inscrit : seulement l'inscription. Inscrit : les onglets.
 * L'écran de démarrage reste affiché tant que les polices et le profil ne sont pas prêts.
 */
export function PileRacine({ policesChargees }: { policesChargees: boolean }) {
  const { profil, chargement } = utiliserProfil();
  const pret = policesChargees && !chargement;

  useEffect(() => {
    if (pret) SplashScreen.hideAsync();
  }, [pret]);

  if (!pret) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={profil !== null}>
          <Stack.Screen name="(onglets)" />
          <Stack.Screen name="lieu/[id]" />
          <Stack.Screen name="reglages" />
        </Stack.Protected>
        <Stack.Protected guard={profil === null}>
          <Stack.Screen name="(inscription)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}
