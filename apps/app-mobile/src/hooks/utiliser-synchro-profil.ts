import { useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";

import type { Profil } from "@sos-miam/commun/types/profil";
import { utiliserSession } from "~/hooks/utiliser-session";
import { creerMoteurSynchroProfil, type VueSynchro } from "~/services/synchro-profil";

type Options = {
  /** Compte connecté hors démo, avec un profil (sinon : aucune demande, tout reste sur le téléphone) */
  actif: boolean;
  /** Le pseudo affiché : une annonce de pseudo le suit */
  pseudo: string | undefined;
  lireProfil: () => Profil | null;
  ecrireProfil: (profil: Profil) => Promise<void>;
};

/**
 * La synchro du profil d'un compte connecté (appelée par FournisseurProfil) : le serveur fait foi, le téléphone garde une
 * copie pour s'ouvrir hors ligne et ne gagne que pour un champ changé ici, pas encore parti. Relu au lancement et au retour
 * dans l'app (plus d'une minute après), envoyé après chaque changement, réessayé sans réseau (30 s, 2 min, 10 min). Le
 * pseudo neutre posé par la modération arrive avec une annonce douce, une seule fois. Démo et visite : rien ne part.
 */
export function utiliserSynchroProfil({ actif, pseudo, lireProfil, ecrireProfil }: Options) {
  const { comptes, sociaux, rafraichir } = utiliserSession();
  const [vue, setVue] = useState<VueSynchro>({ annonce: null, pseudoMisDeCote: null });
  const [moteur] = useState(() =>
    creerMoteurSynchroProfil({
      comptes,
      moderation: sociaux.moderation,
      rafraichirCompte: rafraichir,
      lireProfil,
      ecrireProfil,
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

  useEffect(() => moteur.suivrePseudo(pseudo), [moteur, pseudo]);

  return useMemo(
    () => ({
      ...vue,
      installer: moteur.installer,
      oublier: moteur.oublier,
      modifierInfos: moteur.modifierInfos,
      modifierEnvies: moteur.modifierEnvies,
      fermerAnnonce: moteur.fermerAnnonce,
    }),
    [vue, moteur],
  );
}
