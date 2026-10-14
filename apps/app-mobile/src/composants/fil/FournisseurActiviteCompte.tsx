import { useCallback, useEffect, useMemo, type ReactNode } from "react";

import { creerActiviteApiVide } from "@sos-miam/commun/fonctions/activite/creer-activite-api-vide";
import { estLieuVerifie } from "@sos-miam/commun/fonctions/lieux/est-lieu-verifie";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import { lireCleSuivi } from "~/fonctions/suivi/lire-cle-suivi";
import { ContexteActivite, type EtatActivite, type FinRescousse, type ResultatRescousse } from "~/hooks/utiliser-activite";
import { utiliserFileActivite } from "~/hooks/utiliser-file-activite";
import { utiliserSession } from "~/hooks/utiliser-session";
import { effacerActiviteCompte } from "~/stockage/activite-compte";
import { effacerActiviteLocale } from "~/stockage/activite-locale";

/** Sans compte : 3 rescousses (pas affichées), aucune liste */
const ACTIVITE_VIDE = creerActiviteApiVide();
const AUCUN_JAIME: readonly string[] = [];

/**
 * Hors démo, l'activité vient de l'API : celle du compte connecté (utiliserFileActivite : affichée tout de suite, confirmée
 * ensuite, gestes rejouables gardés hors ligne). Sans session (visite sans compte, ou session expirée) : une activité vide,
 * rien n'est lu ni écrit, et chaque geste demande d'abord un compte. Tant que le jeton n'est pas relu : vide, pas encore
 * chargée (le fil attend tes suivis pour se trier). Un seul composant pour les trois cas : se connecter ou se déconnecter
 * ne remonte jamais l'app. Rien n'est repris du téléphone : un compte part de son activité sur le serveur.
 */
export function FournisseurActiviteCompte({ children }: { children: ReactNode }) {
  const { pret, connecte, activite: service, rafraichir } = utiliserSession();
  const source = !pret ? "attente" : connecte ? "compte" : "vide";
  const compte = source === "compte";
  // Rescousse donnée ou reprise : points, palier et badges du compte ont changé
  const surRescousseConfirmee = useCallback(() => void rafraichir(), [rafraichir]);
  const file = utiliserFileActivite({ actif: compte, service, surRescousseConfirmee });
  const { ajouter, lireAffichee, effacer } = file;

  // L'activité gardée sur le téléphone avant l'API (sosmiam.activite) n'est jamais relue hors démo
  useEffect(() => {
    effacerActiviteLocale().catch(() => {});
  }, []);
  // Plus de compte connecté (déconnexion, session expirée) : sa copie s'en va avec lui
  useEffect(() => {
    if (source === "vide") effacerActiviteCompte().catch(() => {});
  }, [source]);

  const basculerRescousse = useCallback(
    (lieu: Lieu, surFin?: (fin: FinRescousse) => void): ResultatRescousse => {
      if (!compte) return "sans-session";
      // L'activité affichée à l'instant de l'appui (deux appuis rapides ne donnent pas deux rescousses)
      const a = lireAffichee();
      if (a.rescoussesSemaine.includes(lieu.id)) {
        ajouter({ quoi: "rescousse", lieuId: lieu.id, oui: false }, surFin);
        return "annulee";
      }
      // Une rescousse déjà donnée se reprend toujours ; une nouvelle, seulement chez un lieu vérifié (avec un compte SOS Miam)
      if (!estLieuVerifie(lieu)) return "non-verifie";
      if (a.restantes <= 0) return "epuisee";
      ajouter({ quoi: "rescousse", lieuId: lieu.id, oui: true }, surFin);
      return "donnee";
    },
    [compte, ajouter, lireAffichee],
  );

  const basculerGarde = useCallback(
    (lieuId: number) => {
      if (!compte) return false;
      const oui = !lireAffichee().gardes.includes(lieuId);
      ajouter({ quoi: "garde", lieuId, oui });
      return oui;
    },
    [compte, ajouter, lireAffichee],
  );

  const basculerJaime = useCallback(
    (publicationId: string) => {
      if (!compte) return false;
      const oui = !lireAffichee().jaimes.includes(publicationId);
      ajouter({ quoi: "jaime", publicationId, oui });
      return oui;
    },
    [compte, ajouter, lireAffichee],
  );

  const aimer = useCallback(
    (publicationId: string) => {
      if (compte && !lireAffichee().jaimes.includes(publicationId)) ajouter({ quoi: "jaime", publicationId, oui: true });
    },
    [compte, ajouter, lireAffichee],
  );

  const masquer = useCallback(
    (publicationId: string) => {
      if (compte && !lireAffichee().masques.includes(publicationId)) ajouter({ quoi: "masque", publicationId, oui: true });
    },
    [compte, ajouter, lireAffichee],
  );

  const basculerSuivi = useCallback(
    (cle: string) => {
      const suivis = compte ? lireAffichee().suivis : ACTIVITE_VIDE.suivis;
      // Seulement les lieux et les créateurs : les personnes se suivent dans FournisseurSuivisPersonnes (rien ne change ici)
      const type = lireCleSuivi(cle)?.type;
      if (!compte || (type !== "lieu" && type !== "createur")) return suivis.includes(cle);
      const oui = !suivis.includes(cle);
      ajouter({ quoi: "suivi", cle, oui });
      return oui;
    },
    [compte, ajouter, lireAffichee],
  );

  const a = compte ? file.activite : ACTIVITE_VIDE;
  const chargee = source === "vide" || (compte && file.chargee);
  const horsLigne = compte && file.horsLigne;
  // Les compteurs de J'aime de l'API comptent déjà le tien : ceux de sa dernière réponse (sans compte : aucun)
  const jaimesServeur = source === "vide" ? AUCUN_JAIME : compte ? (file.serveur?.jaimes ?? null) : null;

  const valeur = useMemo(
    (): EtatActivite => ({
      restantes: a.restantes,
      rescoussesDonnees: a.rescoussesDonnees,
      rescoussesDuMois: a.rescoussesDuMois,
      lieuxSauves: a.lieuxSauves,
      premiersSauvetages: a.premiersSauvetages,
      gardes: a.gardes,
      jaimes: a.jaimes,
      suivis: a.suivis,
      chargee,
      horsLigne,
      jaimesServeur,
      aSauve: (lieuId) => a.rescoussesSemaine.includes(lieuId),
      estGarde: (lieuId) => a.gardes.includes(lieuId),
      basculerRescousse,
      basculerGarde,
      aime: (publicationId) => a.jaimes.includes(publicationId),
      basculerJaime,
      aimer,
      estMasquee: (publicationId) => a.masques.includes(publicationId),
      masquer,
      estSuivi: (cle) => a.suivis.includes(cle),
      basculerSuivi,
      effacer,
    }),
    [a, chargee, horsLigne, jaimesServeur, basculerRescousse, basculerGarde, basculerJaime, aimer, masquer, basculerSuivi, effacer],
  );
  return <ContexteActivite.Provider value={valeur}>{children}</ContexteActivite.Provider>;
}
