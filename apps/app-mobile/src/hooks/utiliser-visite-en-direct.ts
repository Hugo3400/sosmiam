import { useIsFocused } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import { INTERVALLE_SUIVI_DEMANDE_MS } from "@sos-miam/commun/regles/visites";
import type { ResultatValidation } from "@sos-miam/commun/types/visite";
import type { EchecVisite } from "~/composants/visites/FeuilleEchecVisite";
import { utiliserRetoursPremierPlan } from "~/hooks/utiliser-retours-premier-plan";
import { utiliserServices } from "~/hooks/utiliser-services";

export type EtatVisiteEnDirect = {
  /** Faux jusqu'à la première réponse */
  pret: boolean;
  /** La visite, sa carte de fidélité chez ce lieu et si la carte vient de se remplir ; null si elle n'a pas pu être lue */
  resultat: ResultatValidation | null;
  /** Pourquoi la visite n'a pas pu être lue (introuvable, pas de réseau…) ; null quand elle est là */
  echec: EchecVisite | null;
  relire: () => Promise<void>;
};

// Une addition expire pile à l'heure : on relit juste après, pour afficher « Ta demande s'est endormie »
const MARGE_EXPIRATION_MS = 500;

/**
 * Une visite suivie en direct pendant que son écran est ouvert : relue à l'ouverture, à chaque changement prévenu par les
 * services (démo : le lieu qui répond), au retour au premier plan, à l'heure où l'addition expire, et, avec l'API, toutes
 * les 4 s tant que l'addition attend et que l'écran est affiché. Une relecture ratée garde la visite déjà affichée.
 */
export function utiliserVisiteEnDirect(id: number | null): EtatVisiteEnDirect {
  const services = utiliserServices();
  const focus = useIsFocused();
  const retours = utiliserRetoursPremierPlan();
  const [etat, setEtat] = useState<Omit<EtatVisiteEnDirect, "relire">>({ pret: false, resultat: null, echec: null });
  // Numéro de la dernière lecture lancée : une réponse plus ancienne qu'une autre déjà partie est ignorée
  const derniereLecture = useRef(0);

  const relire = useCallback(async () => {
    const numero = ++derniereLecture.current;
    if (id === null) {
      setEtat({ pret: true, resultat: null, echec: { erreur: "introuvable" } });
      return;
    }
    let reponse: ReponseApi<ResultatValidation>;
    try {
      reponse = await services.visites.lireVisite(id);
    } catch {
      reponse = { ok: false, erreur: "hors-ligne" };
    }
    if (numero !== derniereLecture.current) return;
    if (reponse.ok) {
      const { visite, carte, recompenseGagnee, dejaValidee } = reponse;
      setEtat({ pret: true, resultat: { visite, carte, recompenseGagnee, dejaValidee }, echec: null });
      return;
    }
    const echec: EchecVisite = { erreur: reponse.erreur, details: reponse.details };
    // Pas de réseau un instant : on garde ce qu'on montrait ; une visite qui n'existe plus, elle, disparaît
    setEtat((avant) => (avant.resultat && reponse.erreur !== "introuvable" ? avant : { pret: true, resultat: null, echec }));
  }, [id, services]);

  // À l'ouverture, et chaque fois que l'écran revient au premier plan de la pile (retour du mode pro…)
  useEffect(() => {
    if (focus) void relire();
  }, [focus, relire]);

  useEffect(() => services.visites.ecouter(() => void relire()), [services, relire]);

  useEffect(() => {
    if (retours > 0) void relire();
  }, [retours, relire]);

  const visite = etat.resultat?.visite ?? null;
  const enAttente = visite?.statut === "demandee";
  const expireLe = enAttente ? visite.expireLe : null;

  useEffect(() => {
    if (!expireLe) return;
    const dans = Math.max(0, Date.parse(expireLe) - Date.now()) + MARGE_EXPIRATION_MS;
    // Au-delà, setTimeout déborde : la relecture au premier plan suffira
    if (!Number.isFinite(dans) || dans > 2_000_000_000) return;
    const minuterie = setTimeout(() => void relire(), dans);
    return () => clearTimeout(minuterie);
  }, [expireLe, relire]);

  // Avec l'API, personne ne prévient : on relit tant que l'addition attend et que l'écran est affiché
  const sonder = services.source === "api" && enAttente && focus;
  useEffect(() => {
    if (!sonder) return;
    const intervalle = setInterval(() => void relire(), INTERVALLE_SUIVI_DEMANDE_MS);
    return () => clearInterval(intervalle);
  }, [sonder, relire]);

  return { ...etat, relire };
}
