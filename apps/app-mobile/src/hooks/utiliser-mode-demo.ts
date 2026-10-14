import { useEffect, useState } from "react";

import { basculerModeDemo } from "~/fonctions/demo/basculer-mode-demo";
import { utiliserEffacementLocal } from "~/hooks/utiliser-effacement-local";
import { utiliserSession } from "~/hooks/utiliser-session";
import { DEMO_POSSIBLE, DEMO_VISITES_ACTIVE } from "~/services/demo/demo-visites-active";
import { effacerCompteDeCote, garderCompteDeCote, lireCompteDeCote, poserRepriseCompte } from "~/stockage/compte-de-cote";
import { enregistrerJetonSession, lireJetonSession } from "~/stockage/session-compte";

/**
 * Le bouton « Démo » (développement seulement) : entrer dans la démo ou en sortir. Les deux mondes ne se mélangent jamais :
 * ce que le téléphone gardait est effacé, puis l'app se relance dans l'autre mode. Ton compte, lui, n'est pas déconnecté :
 * sa session est mise de côté pendant la démo, et « Quitter la démo » te remet dessus directement (reconnexion rapide).
 */
export function utiliserModeDemo() {
  const { connecte, compte, fermer } = utiliserSession();
  const effacement = utiliserEffacementLocal();
  const [enCours, setEnCours] = useState(false);
  // En démo : l'e-mail du compte qui attend (null : aucun)
  const [compteDeCote, setCompteDeCote] = useState<string | null>(null);

  useEffect(() => {
    if (!DEMO_VISITES_ACTIVE) return;
    lireCompteDeCote().then((c) => setCompteDeCote(c?.email ?? null));
  }, []);

  async function entrer() {
    if (enCours) return;
    setEnCours(true);
    const jeton = connecte ? await lireJetonSession() : null;
    if (jeton && compte) {
      await garderCompteDeCote({ jeton, email: compte.email });
      // Fermée sur ce téléphone seulement : le serveur garde la session, qu'on reprendra en quittant la démo
      await fermer({ prevenirServeur: false });
    } else if (connecte) await fermer();
    await effacement.toutEffacer();
    basculerModeDemo(true);
  }

  async function sortir() {
    if (enCours) return;
    setEnCours(true);
    await effacement.toutEffacer();
    const deCote = await lireCompteDeCote();
    if (deCote) {
      await enregistrerJetonSession(deCote.jeton);
      await effacerCompteDeCote();
      await poserRepriseCompte();
    }
    basculerModeDemo(false);
  }

  return { possible: DEMO_POSSIBLE, actif: DEMO_VISITES_ACTIVE, enCours, compteDeCote, entrer: () => void entrer(), sortir: () => void sortir() };
}
