import { useRef, useState } from "react";

import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserAppareilPush } from "~/hooks/utiliser-appareil-push";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserConversations } from "~/hooks/utiliser-conversations";
import { utiliserNotifications } from "~/hooks/utiliser-notifications";
import { utiliserPositionActuelle } from "~/hooks/utiliser-position-actuelle";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserSuivisPersonnes } from "~/hooks/utiliser-suivis-personnes";
import { effacerBrouillonActus } from "~/stockage/brouillon-actus";
import { effacerBrouillonsChat } from "~/stockage/brouillons-chat";
import { effacerEnviesMiamis } from "~/stockage/envies-miamis";
import { effacerModeApp } from "~/stockage/mode-app";
import { effacerSectionsDepliees } from "~/stockage/sections-depliees";

/**
 * Efface tout ce que l'app garde sur ce téléphone (profil, activité, potes, messages, abonnés, notifications, signalements,
 * mode) : « Effacer mes données », la déconnexion et la suppression du compte. L'app repart alors toute
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
  const [enCours, setEnCours] = useState(false);
  const occupe = useRef(false);

  async function toutEffacer(fermerSession?: () => Promise<boolean>): Promise<boolean> {
    if (occupe.current) return false;
    occupe.current = true;
    setEnCours(true);
    oublierPosition();
    try {
      if (fermerSession && !(await fermerSession())) return false;
      await activite.effacer();
      await communaute.effacer();
      await conversations.effacer();
      await effacerBrouillonsChat();
      await effacerBrouillonActus();
      await suivisPersonnes.effacer();
      await notifications.effacer();
      await effacerEnviesMiamis();
      await telephone.effacerReglages();
      await effacerModeApp();
      await effacerSectionsDepliees();
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

  return { toutEffacer, enCours };
}
