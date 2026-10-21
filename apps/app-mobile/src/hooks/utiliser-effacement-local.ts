import { useRef, useState } from "react";

import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserAppareilPush } from "~/hooks/utiliser-appareil-push";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserConversations } from "~/hooks/utiliser-conversations";
import { utiliserNotifications } from "~/hooks/utiliser-notifications";
import { utiliserPositionActuelle } from "~/hooks/utiliser-position-actuelle";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserOutilsDemo } from "~/hooks/utiliser-services";
import { utiliserSuivisPersonnes } from "~/hooks/utiliser-suivis-personnes";
import { oublierReglagesDemo } from "~/services/demo/reglages-demo-vivants";
import { effacerEnviesMiamis } from "~/stockage/envies-miamis";
import { effacerModeApp } from "~/stockage/mode-app";
import { effacerRolesDemo } from "~/stockage/roles-demo";
import { effacerSignalementsLocaux } from "~/stockage/signalements-locaux";

/**
 * Efface tout ce que l'app garde sur ce téléphone (profil, activité, potes, messages, abonnés, notifications, signalements,
 * démo des visites, mode) : « Effacer mes données », la déconnexion et la suppression du compte. L'app repart alors toute
 * seule à la bienvenue. Rend vrai si tout est effacé.
 */
export function utiliserEffacementLocal() {
  const { effacer } = utiliserProfil();
  const activite = utiliserActivite();
  const communaute = utiliserCommunaute();
  const conversations = utiliserConversations();
  const suivisPersonnes = utiliserSuivisPersonnes();
  const notifications = utiliserNotifications();
  const telephone = utiliserAppareilPush();
  const { oublier: oublierPosition } = utiliserPositionActuelle();
  // Les outils de la démo des visites (en développement seulement) ; null dans une version publiée
  const outilsDemo = utiliserOutilsDemo();
  const [enCours, setEnCours] = useState(false);
  const occupe = useRef(false);

  async function toutEffacer(): Promise<boolean> {
    if (occupe.current) return false;
    occupe.current = true;
    setEnCours(true);
    oublierPosition();
    try {
      await activite.effacer();
      await communaute.effacer();
      await conversations.effacer();
      // Avant le profil : sans lui, la démo des abonnés et des notifications ne se recrée pas
      await suivisPersonnes.effacer();
      await notifications.effacer();
      await effacerSignalementsLocaux();
      await effacerEnviesMiamis();
      await telephone.effacerReglages();
      // La démo des visites : visites, tampons, réservations et avis de démo, rôles joués, réglages des Coulisses
      if (outilsDemo) {
        await outilsDemo.remettreAZero();
        await oublierReglagesDemo();
        await effacerRolesDemo();
      }
      await effacerModeApp();
      // En dernier : sans profil, l'app repart toute seule à la bienvenue
      await effacer();
      return true;
    } catch {
      return false;
    } finally {
      occupe.current = false;
      setEnCours(false);
    }
  }

  return { toutEffacer, enCours, avecDemo: outilsDemo !== null };
}
