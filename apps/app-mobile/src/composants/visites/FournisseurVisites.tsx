import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";

import type { Services } from "@sos-miam/commun/client-api/services";
import { ContexteVisites, type EtatVisites, type LectureListe } from "~/hooks/utiliser-visites";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserRetoursPremierPlan } from "~/hooks/utiliser-retours-premier-plan";
import { utiliserServices } from "~/hooks/utiliser-services";

type Donnees = Pick<EtatVisites, "enCours" | "visites" | "aEcrire" | "cartes" | "reservations" | "points">;

type Lectures = { services: Services | null; visites: LectureListe; cartes: LectureListe };

const DONNEES_VIDES: Donnees = { enCours: null, visites: [], aEcrire: [], cartes: [], reservations: [], points: 0 };

const AUCUNE_LECTURE: Lectures = { services: null, visites: "attente", cartes: "attente" };

const suivreLecture = (avant: LectureListe, reussie: boolean): LectureListe => (reussie || avant === "lue" ? "lue" : "ratee");

/** Une lecture qui plante compte comme une lecture ratée : on garde ce qu'on avait. */
function sansPlantage<T>(promesse: Promise<T>): Promise<T | null> {
  return promesse.catch(() => null);
}

/**
 * Lit tes visites, ta demande en cours, tes avis à donner, tes cartes de fidélité et tes réservations, et les met
 * à disposition de toute l'app (voir utiliserVisites). Relu quand les services préviennent d'un changement (démo : à chaque
 * geste, du client comme du lieu) et à chaque retour au premier plan. Sans compte, rien n'est lu.
 */
export function FournisseurVisites({ children }: { children: ReactNode }) {
  const services = utiliserServices();
  const { profil, chargement } = utiliserProfil();
  const inscrit = profil !== null;
  const [donnees, setDonnees] = useState<Donnees>(DONNEES_VIDES);
  const [lu, setLu] = useState(false);
  const [lectures, setLectures] = useState<Lectures>(AUCUNE_LECTURE);
  const [lecturesReservations, setLecturesReservations] = useState(0);

  // Lu au moment de la lecture : une réponse arrivée après l'effacement du profil est ignorée
  const inscritActuel = useRef(inscrit);
  useLayoutEffect(() => {
    inscritActuel.current = inscrit;
  }, [inscrit]);
  // Numéro de la dernière lecture lancée : une réponse plus ancienne qu'une autre lecture déjà partie est ignorée
  const derniereLecture = useRef(0);

  const rafraichir = useCallback(async () => {
    if (!inscritActuel.current) return;
    const numero = ++derniereLecture.current;
    const [visites, avis, fidelite, reservations] = await Promise.all([
      sansPlantage(services.visites.listerVisites()),
      sansPlantage(services.avis.listerAvisAEcrire()),
      sansPlantage(services.fidelite.listerCartes()),
      sansPlantage(services.reservations.listerReservations()),
    ]);
    if (numero !== derniereLecture.current || !inscritActuel.current) return;
    setDonnees((avant) => ({
      enCours: visites?.ok ? visites.enCours : avant.enCours,
      visites: visites?.ok ? visites.visites : avant.visites,
      points: visites?.ok ? visites.points : avant.points,
      aEcrire: avis?.ok ? avis.visites : avant.aEcrire,
      cartes: fidelite?.ok ? fidelite.cartes : avant.cartes,
      reservations: reservations?.ok ? reservations.reservations : avant.reservations,
    }));
    setLu(true);
    setLectures((avant) => {
      const suivies = avant.services === services ? avant : AUCUNE_LECTURE;
      return { services, visites: suivreLecture(suivies.visites, visites?.ok === true), cartes: suivreLecture(suivies.cartes, fidelite?.ok === true) };
    });
    if (reservations?.ok) setLecturesReservations((n) => n + 1);
  }, [services]);

  // Inscription : première lecture ; profil effacé : on oublie tout
  useEffect(() => {
    if (chargement) return;
    if (inscrit) {
      rafraichir();
      return;
    }
    derniereLecture.current += 1;
    setDonnees(DONNEES_VIDES);
    setLu(false);
    setLectures(AUCUNE_LECTURE);
    setLecturesReservations(0);
  }, [inscrit, chargement, rafraichir]);

  // Les services préviennent à chaque changement (une addition réglée par le lieu, un tampon posé…)
  useEffect(
    () =>
      services.visites.ecouter(() => {
        rafraichir();
      }),
    [services, rafraichir],
  );

  // Retour au premier plan : la demande en cours a pu être réglée ou expirer pendant ce temps
  const retours = utiliserRetoursPremierPlan();
  useEffect(() => {
    if (retours > 0) rafraichir();
  }, [retours, rafraichir]);

  const lues = lectures.services === services ? lectures : AUCUNE_LECTURE;

  const valeur = useMemo<EtatVisites>(
    () => ({
      ...donnees,
      lecturesReservations,
      lectureVisites: lues.visites,
      lectureCartes: lues.cartes,
      pret: !chargement && (!inscrit || lu),
      source: services.source,
      rafraichir,
    }),
    [donnees, lecturesReservations, lues, chargement, inscrit, lu, services.source, rafraichir],
  );

  return <ContexteVisites.Provider value={valeur}>{children}</ContexteVisites.Provider>;
}
