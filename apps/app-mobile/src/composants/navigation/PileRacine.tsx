import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { AnnonceCompteLimite } from "~/composants/compte/AnnonceCompteLimite";
import { utiliserModes } from "~/hooks/utiliser-modes";
import { renvoyerSignalementsEnAttente } from "~/fonctions/signalement/renvoyer-signalements-en-attente";
import { utiliserFinDeSession } from "~/hooks/utiliser-fin-de-session";
import { utiliserInvitationEnAttente } from "~/hooks/utiliser-invitation-en-attente";
import { utiliserInscriptionTelephone } from "~/hooks/utiliser-inscription-telephone";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserRepriseCompte } from "~/hooks/utiliser-reprise-compte";
import { SuiviEcranOuvert } from "~/composants/navigation/SuiviEcranOuvert";

/**
 * Pile d'écrans de l'app. Pas encore inscrit : seulement l'inscription. Inscrit : les onglets et tout le reste.
 * En visite sans compte : les onglets, les fiches des lieux (et leur carte) et les pages des créateurs, pour regarder ;
 * l'inscription reste ouverte par-dessus (« Je m'inscris »), et une fois le compte créé, on revient où l'on était.
 * Les modes pro et ambassadeur sont des piles posées par-dessus les onglets perso (qui restent montés dessous), ouvertes
 * seulement à qui a le rôle : un rôle retiré ferme ses écrans et ramène au mode perso.
 * Toute nouvelle route doit être rangée sous une garde : une route oubliée ici serait ouverte à tout le monde.
 * L'écran de démarrage reste affiché tant que les polices, le profil et les modes ne sont pas prêts (et, après « Quitter la
 * démo », tant que le compte mis de côté n'est pas rouvert).
 */
export function PileRacine({ policesChargees }: { policesChargees: boolean }) {
  const { profil, invite, chargement } = utiliserProfil();
  const modes = utiliserModes();
  // Après « Quitter la démo » : le compte mis de côté se rouvre avant d'afficher quoi que ce soit
  const reprise = utiliserRepriseCompte();
  const pret = policesChargees && !chargement && modes.pret && !reprise;
  // Notifications : le téléphone s'inscrit sur le serveur, et toucher une notification ouvre son écran (une fois la pile affichée)
  utiliserInscriptionTelephone(pret);
  // Session expirée côté serveur (ou profil sans session) : retour à l'accueil, où « Me connecter » t'attend
  utiliserFinDeSession();
  // Un lien d'invitation ouvert avant d'avoir un compte : rouvert une fois le compte créé
  utiliserInvitationEnAttente();
  // Les signalements restés sur le téléphone faute de réseau repartent à la modération
  useEffect(() => {
    void renvoyerSignalementsEnAttente();
  }, []);
  const inscrit = profil !== null;

  useEffect(() => {
    if (pret) SplashScreen.hideAsync();
  }, [pret]);

  if (!pret) return null;

  return (
    <>
      <StatusBar style="dark" />
      {/* L'écran ouvert, pour les notifications (pas de bannière pour la discussion que tu as sous les yeux) */}
      <SuiviEcranOuvert />
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
          {/* Proposer une modification d'une fiche (en visite, le lien de la fiche demande d'abord un compte) */}
          <Stack.Screen name="lieu/[id]/proposer" />
          {/* Visites : réserver, scanner le QR du comptoir, une visite, Mes visites, fidélité, réservations, avis */}
          <Stack.Screen name="lieu/[id]/reserver" />
          <Stack.Screen name="scan" options={{ presentation: "fullScreenModal" }} />
          <Stack.Screen name="visite/[id]" options={{ presentation: "modal" }} />
          <Stack.Screen name="visites" />
          <Stack.Screen name="fidelite" />
          <Stack.Screen name="reservations" />
          <Stack.Screen name="avis/[visiteId]" />
          {/* Miam Safe : l'écran discret à montrer au comptoir */}
          <Stack.Screen name="miam-safe/comptoir" options={{ presentation: "fullScreenModal", animation: "fade" }} />
          {/* « Prévenir un pote » : l'écran d'un partage de position (celui qui partage, ou le pote prévenu) */}
          <Stack.Screen name="miam-safe/partage/[id]" />
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
        {/* Liens ouverts depuis le site ou un QR (sosmiam.fr/invitation/…, /l/…, /lieux/…, /q/…) : ouverts à tous, ils renvoient
            aussitôt au bon écran (en entrant en visite si besoin) */}
        <Stack.Protected guard>
          <Stack.Screen name="invitation/[pseudo]" />
          <Stack.Screen name="l/[code]" />
          <Stack.Screen name="lieux/[id]" />
          <Stack.Screen name="q/[code]" />
        </Stack.Protected>
      </Stack>
      {/* Une écriture refusée parce que le compte est limité, n'importe où : une seule annonce douce, au-dessus de tout */}
      <AnnonceCompteLimite />
    </>
  );
}
