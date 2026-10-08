import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { utiliserModes } from "~/hooks/utiliser-modes";
import { utiliserProfil } from "~/hooks/utiliser-profil";

/**
 * Pile d'écrans de l'app. Pas encore inscrit : seulement l'inscription. Inscrit : les onglets et tout le reste.
 * En visite sans compte : les onglets, les fiches des lieux (et leur carte) et les pages des créateurs, pour regarder ;
 * l'inscription reste ouverte par-dessus (« Je m'inscris »), et une fois le compte créé, on revient où l'on était.
 * Les modes pro et ambassadeur sont des piles posées par-dessus les onglets perso (qui restent montés dessous), ouvertes
 * seulement à qui a le rôle (18 ans et plus) : un rôle retiré ferme ses écrans et ramène au mode perso.
 * Toute nouvelle route doit être rangée sous une garde : une route oubliée ici serait ouverte à tout le monde.
 * L'écran de démarrage reste affiché tant que les polices, le profil et les modes ne sont pas prêts.
 */
export function PileRacine({ policesChargees }: { policesChargees: boolean }) {
  const { profil, invite, chargement } = utiliserProfil();
  const modes = utiliserModes();
  const pret = policesChargees && !chargement && modes.pret;
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
          <Stack.Screen name="notifications" />
          <Stack.Screen name="reglages" />
          <Stack.Screen name="potes" />
          {/* Visites : réserver, scanner le QR du comptoir, une visite, Mes visites, fidélité, réservations, avis */}
          <Stack.Screen name="lieu/[id]/reserver" />
          <Stack.Screen name="scan" options={{ presentation: "fullScreenModal" }} />
          <Stack.Screen name="visite/[id]" options={{ presentation: "modal" }} />
          <Stack.Screen name="visites" />
          <Stack.Screen name="fidelite" />
          <Stack.Screen name="reservations" />
          <Stack.Screen name="avis/[visiteId]" />
        </Stack.Protected>
        {/* Modes : pas de geste de retour, on en sort par « Revenir à mon SOS Miam » */}
        <Stack.Protected guard={inscrit && modes.modesOuverts.includes("pro")}>
          <Stack.Screen name="pro" options={{ gestureEnabled: false, animation: "fade" }} />
        </Stack.Protected>
        <Stack.Protected guard={inscrit && modes.modesOuverts.includes("ambassadeur")}>
          <Stack.Screen name="ambassadeur" options={{ gestureEnabled: false, animation: "fade" }} />
        </Stack.Protected>
        <Stack.Protected guard={!inscrit}>
          <Stack.Screen name="(inscription)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}
