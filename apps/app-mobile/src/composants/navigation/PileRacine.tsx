import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { utiliserProfil } from "~/hooks/utiliser-profil";

/**
 * Pile d'écrans de l'app. Pas encore inscrit : seulement l'inscription. Inscrit : les onglets et tout le reste.
 * En visite sans compte : les onglets, les fiches des lieux (et leur carte) et les pages des créateurs, pour regarder ;
 * l'inscription reste ouverte par-dessus (« Je m'inscris »), et une fois le compte créé, on revient où l'on était.
 * Toute nouvelle route doit être rangée sous une garde : une route oubliée ici serait ouverte à tout le monde.
 * L'écran de démarrage reste affiché tant que les polices et le profil ne sont pas prêts.
 */
export function PileRacine({ policesChargees }: { policesChargees: boolean }) {
  const { profil, invite, chargement } = utiliserProfil();
  const pret = policesChargees && !chargement;
  const inscrit = profil !== null;

  useEffect(() => {
    if (pret) SplashScreen.hideAsync();
  }, [pret]);

  if (!pret) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        {/* Pour regarder : avec un compte, ou en visite sans compte (les onglets d'abord : c'est l'écran d'arrivée) */}
        <Stack.Protected guard={inscrit || invite}>
          <Stack.Screen name="(onglets)" />
          <Stack.Screen name="lieu/[id]/index" />
          <Stack.Screen name="lieu/[id]/carte" />
          <Stack.Screen name="createur/[pseudo]" />
        </Stack.Protected>
        {/* Réservé aux inscrits */}
        <Stack.Protected guard={inscrit}>
          <Stack.Screen name="suivis" />
          <Stack.Screen name="reglages" />
          <Stack.Screen name="potes" />
        </Stack.Protected>
        <Stack.Protected guard={!inscrit}>
          <Stack.Screen name="(inscription)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}
