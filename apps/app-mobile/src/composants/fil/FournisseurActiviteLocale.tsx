import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";

import { estLieuVerifie } from "@sos-miam/commun/fonctions/lieux/est-lieu-verifie";
import { RESCOUSSES_PAR_SEMAINE } from "@sos-miam/commun/regles/rescousses";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import { calculerCleSemaine } from "~/fonctions/dates/calculer-cle-semaine";
import { formaterDateIso } from "~/fonctions/dates/formater-date-iso";
import { estPremierSauvetagePossible } from "~/fonctions/lieux/est-premier-sauvetage-possible";
import { lireCleSuivi } from "~/fonctions/suivi/lire-cle-suivi";
import { ContexteActivite, type EtatActivite, type FinRescousse, type ResultatRescousse } from "~/hooks/utiliser-activite";
import { effacerActiviteCompte } from "~/stockage/activite-compte";
import { effacerActiviteLocale, enregistrerActiviteLocale, lireActiviteLocale, type ActiviteLocale } from "~/stockage/activite-locale";

const AUCUN_JAIME: readonly string[] = [];
const activiteVide = (): ActiviteLocale => ({ semaine: calculerCleSemaine(), rescousses: [], historique: [], premiersSauvetages: [], gardes: [], jaimes: [], masques: [], suivis: [] });

/** Nouvelle semaine : les rescousses reviennent ; l'historique, les lieux gardés, J'aime, masques et suivis restent. Même semaine : la même activité (pas de nouveau rendu). */
const mettreAJourSemaine = (a: ActiviteLocale): ActiviteLocale => {
  const semaine = calculerCleSemaine();
  return a.semaine === semaine ? a : { ...a, semaine, rescousses: [] };
};

/** La confirmation d'une rescousse, juste après l'appui (comme l'API, elle n'arrive jamais avant la réponse immédiate) */
const confirmer = (surFin: ((fin: FinRescousse) => void) | undefined, fin: FinRescousse) => {
  if (surFin) void Promise.resolve().then(() => surFin(fin));
};

/**
 * L'activité du MODE DÉMO, sur le téléphone seulement (sosmiam.activite) : rescousses de la semaine (remises à 3 chaque
 * lundi) et leur historique, lieux gardés, J'aime, masques et suivis, enregistrés à chaque changement. Le premier sauveteur
 * y est décidé sur place (estPremierSauvetagePossible). Hors démo, l'activité vient de l'API (FournisseurActiviteCompte).
 */
export function FournisseurActiviteLocale({ children }: { children: ReactNode }) {
  const [activite, setActivite] = useState<ActiviteLocale>(activiteVide);
  const chargee = useRef(false);
  // La même chose, pour les écrans qui attendent l'activité relue (l'ordre du fil tient compte de tes suivis)
  const [relue, setRelue] = useState(false);

  useEffect(() => {
    lireActiviteLocale().then((lue) => {
      chargee.current = true;
      if (lue) setActivite(mettreAJourSemaine(lue));
      setRelue(true);
    });
  }, []);

  // L'app peut dormir en arrière-plan d'une semaine à l'autre : on revérifie la semaine à chaque retour au premier plan
  useEffect(() => {
    const abonnement = AppState.addEventListener("change", (etat) => {
      if (etat === "active") setActivite(mettreAJourSemaine);
    });
    return () => abonnement.remove();
  }, []);

  useEffect(() => {
    if (chargee.current) enregistrerActiviteLocale(activite).catch(() => {});
  }, [activite]);

  const restantes = RESCOUSSES_PAR_SEMAINE - activite.rescousses.length;

  const basculerRescousse = useCallback(
    (lieu: Lieu, surFin?: (fin: FinRescousse) => void): ResultatRescousse => {
      const idLieu = lieu.id;
      // Semaine revérifiée au moment de donner (passage au lundi pendant que l'app est ouverte)
      const courante = mettreAJourSemaine(activite);
      if (courante.rescousses.includes(idLieu)) {
        setActivite((precedente) => {
          const a = mettreAJourSemaine(precedente);
          // La rescousse reprise sort aussi de l'historique ; sans autre rescousse, le lieu n'est plus « déniché » par la personne
          const historique = a.historique.filter((r) => !(r.lieu === idLieu && r.semaine === a.semaine));
          const encoreSauve = historique.some((r) => r.lieu === idLieu);
          return {
            ...a,
            rescousses: a.rescousses.filter((id) => id !== idLieu),
            historique,
            premiersSauvetages: encoreSauve ? a.premiersSauvetages : a.premiersSauvetages.filter((id) => id !== idLieu),
          };
        });
        confirmer(surFin, { ok: true, premierSauveteur: false });
        return "annulee";
      }
      // Une rescousse déjà donnée se reprend toujours ; une nouvelle, seulement chez un lieu vérifié (avec un compte SOS Miam)
      if (!estLieuVerifie(lieu)) return "non-verifie";
      if (RESCOUSSES_PAR_SEMAINE - courante.rescousses.length <= 0) return "epuisee";
      // activite est l'état d'avant l'appui : un lieu déjà compté ne refait pas « Premier sauveteur » les semaines suivantes
      const premierSauveteur = estPremierSauvetagePossible(lieu, activite.premiersSauvetages);
      setActivite((precedente) => {
        const a = mettreAJourSemaine(precedente);
        const premiers = premierSauveteur && !a.premiersSauvetages.includes(idLieu) ? [...a.premiersSauvetages, idLieu] : a.premiersSauvetages;
        return { ...a, rescousses: [...a.rescousses, idLieu], historique: [...a.historique, { lieu: idLieu, semaine: a.semaine }], premiersSauvetages: premiers };
      });
      confirmer(surFin, { ok: true, premierSauveteur });
      return "donnee";
    },
    [activite],
  );

  const basculerGarde = useCallback(
    (idLieu: number) => {
      const garde = !activite.gardes.includes(idLieu);
      setActivite((a) => ({ ...a, gardes: garde ? [...a.gardes, idLieu] : a.gardes.filter((id) => id !== idLieu) }));
      return garde;
    },
    [activite.gardes],
  );

  const basculerJaime = useCallback(
    (idPublication: string) => {
      const aime = !activite.jaimes.includes(idPublication);
      setActivite((a) => ({ ...a, jaimes: aime ? [...a.jaimes, idPublication] : a.jaimes.filter((id) => id !== idPublication) }));
      return aime;
    },
    [activite.jaimes],
  );

  const aimer = useCallback((idPublication: string) => {
    setActivite((a) => (a.jaimes.includes(idPublication) ? a : { ...a, jaimes: [...a.jaimes, idPublication] }));
  }, []);

  const masquer = useCallback((idPublication: string) => {
    setActivite((a) => (a.masques.includes(idPublication) ? a : { ...a, masques: [...a.masques, idPublication] }));
  }, []);

  const basculerSuivi = useCallback(
    (cle: string) => {
      // Seulement les lieux et les créateurs : les personnes se suivent dans FournisseurSuivisPersonnes (rien ne change ici)
      const type = lireCleSuivi(cle)?.type;
      if (type !== "lieu" && type !== "createur") return activite.suivis.includes(cle);
      const suivi = !activite.suivis.includes(cle);
      // Deux appuis avant le nouveau rendu n'ajoutent pas deux fois le même suivi
      setActivite((a) => ({ ...a, suivis: suivi ? (a.suivis.includes(cle) ? a.suivis : [...a.suivis, cle]) : a.suivis.filter((c) => c !== cle) }));
      return suivi;
    },
    [activite.suivis],
  );

  // La copie d'un compte aussi (aucune ne doit rester d'un monde à l'autre)
  const effacer = useCallback(async () => {
    await Promise.all([effacerActiviteLocale(), effacerActiviteCompte()]);
    setActivite(activiteVide());
  }, []);

  const valeur = useMemo((): EtatActivite => {
    // Listes du plus récent au plus ancien, pour le profil
    const lieuxSauves = [...new Set([...activite.historique].reverse().map((r) => r.lieu))];
    // Semaine rangée par la date de son lundi (AAAA-MM-JJ) : on compte celles commencées ce mois-ci
    const moisEnCours = formaterDateIso(new Date()).slice(0, 7);
    return {
      restantes,
      rescoussesDonnees: activite.historique.length,
      rescoussesDuMois: activite.historique.filter((r) => r.semaine.slice(0, 7) === moisEnCours).length,
      lieuxSauves,
      premiersSauvetages: activite.premiersSauvetages,
      gardes: [...activite.gardes].reverse(),
      jaimes: [...activite.jaimes].reverse(),
      suivis: [...activite.suivis].reverse(),
      chargee: relue,
      horsLigne: false,
      // Les compteurs de la démo ne comptent jamais ton J'aime
      jaimesServeur: AUCUN_JAIME,
      aSauve: (id: number) => activite.rescousses.includes(id),
      estGarde: (id: number) => activite.gardes.includes(id),
      basculerRescousse,
      basculerGarde,
      aime: (id: string) => activite.jaimes.includes(id),
      basculerJaime,
      aimer,
      estMasquee: (id: string) => activite.masques.includes(id),
      masquer,
      estSuivi: (cle: string) => activite.suivis.includes(cle),
      basculerSuivi,
      effacer,
    };
  }, [restantes, activite, relue, basculerRescousse, basculerGarde, basculerJaime, aimer, masquer, basculerSuivi, effacer]);
  return <ContexteActivite.Provider value={valeur}>{children}</ContexteActivite.Provider>;
}
