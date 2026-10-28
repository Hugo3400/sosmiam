import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState, Platform, type AppStateStatus } from "react-native";

import { creerEcouteReguliere } from "@sos-miam/commun/client-api/api/creer-ecoute-reguliere";
import type { PoulsSocial } from "@sos-miam/commun/types/social";
import { ContextePoulsSocial, type ValeurPoulsSocial } from "~/hooks/utiliser-pouls-social";
import { utiliserSession } from "~/hooks/utiliser-session";
import { utiliserSourceSociale } from "~/hooks/utiliser-source-sociale";

/** Un pouls toutes les 30 secondes, app au premier plan (spécification sociale, C.3) */
const INTERVALLE_POULS_MS = 30_000;

const estAuPremierPlan = (etat: AppStateStatus) => etat === "active";
/** Deux pouls identiques : on garde l'ancien objet, pour ne rien faire redessiner (300 octets, comparés tels quels) */
const estMemePouls = (avant: PoulsSocial | null, apres: PoulsSocial) => avant !== null && JSON.stringify(avant) === JSON.stringify(apres);

/**
 * Le pouls de la partie sociale (GET /app/social/pouls) : quelques compteurs et signatures qui disent aux fournisseurs du
 * compte quoi relire. Seulement avec un compte connecté et app au premier plan : tout de suite à l'ouverture, à la
 * connexion et au retour dans l'app, puis toutes les 30 secondes, et à chaque notification reçue app ouverte (le
 * message arrive aussitôt dans la discussion ouverte). En arrière-plan, rien ne tourne (les notifications prennent le
 * relais). Une lecture à la fois ; hors ligne, on garde le dernier pouls et le tour suivant
 * réessaie. Le pouls ne crée jamais le profil social. Déconnecté : il est oublié, et une réponse partie avant ne compte plus.
 */
export function FournisseurPoulsSocial({ children }: { children: ReactNode }) {
  const source = utiliserSourceSociale();
  const { sociaux } = utiliserSession();
  const [auPremierPlan, setAuPremierPlan] = useState(() => estAuPremierPlan(AppState.currentState));
  const [pouls, setPouls] = useState<PoulsSocial | null>(null);
  const [sourceVue, setSourceVue] = useState(source);
  const ecouter = useMemo(() => creerEcouteReguliere(INTERVALLE_POULS_MS), []);
  const actif = source === "compte" && auPremierPlan;

  // Nouvelle source (connexion, déconnexion, session expirée) : le pouls d'avant ne vaut plus rien, oublié dès ce rendu
  if (sourceVue !== source) {
    setSourceVue(source);
    setPouls(null);
  }

  const actifCourant = useRef(actif);
  // Change à chaque changement de source (connexion, déconnexion) : une réponse d'une période passée est ignorée
  const periode = useRef(0);
  const lecture = useRef({ enCours: false, encore: false });

  const relire = useCallback(() => {
    if (!actifCourant.current) return;
    const l = lecture.current;
    // Une lecture en cours : une seule autre partira juste après (la plus récente compte)
    if (l.enCours) {
      l.encore = true;
      return;
    }
    l.enCours = true;
    void (async () => {
      try {
        do {
          l.encore = false;
          const pour = periode.current;
          const r = await sociaux.social.lirePouls();
          if (r.ok && periode.current === pour) setPouls((avant) => (estMemePouls(avant, r.pouls) ? avant : r.pouls));
          // Hors ligne ou serveur indisponible : on garde le dernier ; session expirée : FournisseurSession a déjà tout oublié
        } while (l.encore && actifCourant.current);
      } catch {
        // Le client rend toujours une réponse ; par prudence, un pouls raté ne casse rien
      } finally {
        l.enCours = false;
      }
    })();
  }, [sociaux]);

  useEffect(() => {
    const abonnement = AppState.addEventListener("change", (etat) => setAuPremierPlan(estAuPremierPlan(etat)));
    return () => abonnement.remove();
  }, []);

  // Nouvelle source : nouvelle période (une réponse partie avant ne sera pas retenue)
  useEffect(() => {
    periode.current += 1;
  }, [source]);

  // Au premier plan avec un compte : tout de suite, puis toutes les 30 secondes ; rien en arrière-plan
  useEffect(() => {
    actifCourant.current = actif;
    if (!actif) return;
    relire();
    return ecouter(relire);
  }, [actif, relire, ecouter]);

  // Une notification reçue app ouverte (un message, une invitation) : on relit tout de suite, sans attendre le tour suivant.
  // Hors compte ou en arrière-plan, relire ne fait rien ; une rafale ne lance qu'une lecture à la fois, plus une en attente
  useEffect(() => {
    if (Platform.OS === "web") return;
    const abonnement = Notifications.addNotificationReceivedListener(() => relire());
    return () => abonnement.remove();
  }, [relire]);

  const valeur = useMemo<ValeurPoulsSocial>(() => ({ pouls, relire }), [pouls, relire]);
  return <ContextePoulsSocial.Provider value={valeur}>{children}</ContextePoulsSocial.Provider>;
}
