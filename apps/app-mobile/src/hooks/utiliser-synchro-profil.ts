import { useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";

import type { Profil } from "@sos-miam/commun/types/profil";
import { utiliserSession } from "~/hooks/utiliser-session";
import { creerMoteurSynchroProfil, type VueSynchro } from "~/services/synchro-profil";

type Options = {
  /** Compte connecté hors démo, avec un profil (sinon : aucune demande, tout reste sur le téléphone) */
  actif: boolean;
  /** Met le profil à l'écran : le moteur garde la copie à jour et l'écrit sur le téléphone */
  afficherProfil: (profil: Profil | null) => void;
};

/**
 * La synchro du profil d'un compte connecté (appelée par FournisseurProfil ; le moteur est dans services/synchro-profil.ts,
 * il garde la copie à jour du profil et l'écrit sur le téléphone) : le serveur fait foi, le téléphone garde une
 * copie pour s'ouvrir hors ligne et ne gagne que pour un champ changé ici, pas encore parti. Relu au lancement et au retour
 * dans l'app (plus d'une minute après), envoyé après chaque changement, réessayé sans réseau (30 s, 2 min, 10 min). Le
 * pseudo neutre posé par la modération arrive avec une annonce douce, une seule fois. Démo et visite : rien ne part.
 */
export function utiliserSynchroProfil({ actif, afficherProfil }: Options) {
  const { comptes, sociaux, rafraichir } = utiliserSession();
  const [vue, setVue] = useState<VueSynchro>({ annonce: null, pseudoMisDeCote: null });
  const [moteur] = useState(() =>
    creerMoteurSynchroProfil({
      comptes,
      moderation: sociaux.moderation,
      rafraichirCompte: rafraichir,
      afficherProfil,
      montrer: (v) => setVue((avant) => (JSON.stringify(avant) === JSON.stringify(v) ? avant : v)),
    }),
  );

  useEffect(() => {
    moteur.charger();
    return () => moteur.arreter();
  }, [moteur]);

  useEffect(() => moteur.activer(actif), [moteur, actif]);

  useEffect(() => {
    const abonnement = AppState.addEventListener("change", (etat) => {
      if (etat === "active") moteur.auPremierPlan();
    });
    return () => abonnement.remove();
  }, [moteur]);

  return useMemo(
    () => ({
      ...vue,
      poserProfil: moteur.poserProfil,
      installer: moteur.installer,
      oublier: moteur.oublier,
      modifierInfos: moteur.modifierInfos,
      modifierEnvies: moteur.modifierEnvies,
      fermerAnnonce: moteur.fermerAnnonce,
    }),
    [vue, moteur],
  );
}
