import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import type { ReglagesReservationsLus, ReponseReglagesReservations } from "@sos-miam/commun/client-api/contrat-reglages-reservations";
import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { ReglagesServicesReservations } from "@sos-miam/commun/types/reglages-reservations";
import { lireReglagesLus } from "~/fonctions/reservations/lire-reglages-lus";
import { utiliserServices } from "~/hooks/utiliser-services";

export type LectureReglagesReservations = { etat: "attente" } | { etat: "lu"; lus: ReglagesReservationsLus } | { etat: "erreur"; erreur: ErreurService };

const HORS_LIGNE: Extract<ReponseApi, { ok: false }> = { ok: false, erreur: "hors-ligne" };
const SANS_LIEU: Extract<ReponseApi, { ok: false }> = { ok: false, erreur: "role-requis" };

export function utiliserReglagesReservations(lieuId: number | null) {
  const { reglagesReservations } = utiliserServices();
  const [lecture, setLecture] = useState<LectureReglagesReservations>({ etat: "attente" });
  const monte = useRef(true);

  useEffect(
    () => () => {
      monte.current = false;
    },
    [],
  );

  const appliquer = useCallback((reponse: ReponseReglagesReservations, garderSiEchec: boolean) => {
    if (!monte.current) return;
    setLecture((avant) => {
      if (reponse.ok) return { etat: "lu", lus: lireReglagesLus(reponse) };
      return garderSiEchec && avant.etat === "lu" ? avant : { etat: "erreur", erreur: reponse.erreur };
    });
  }, []);

  const relire = useCallback(async () => {
    if (lieuId === null) return;
    appliquer(await reglagesReservations.lireReglages(lieuId).catch(() => HORS_LIGNE), true);
  }, [reglagesReservations, lieuId, appliquer]);

  useFocusEffect(
    useCallback(() => {
      void relire();
    }, [relire]),
  );

  const fermerJour = useCallback(
    async (jour: string, ferme: boolean): Promise<ReponseReglagesReservations> => {
      if (lieuId === null) return SANS_LIEU;
      const reponse = await reglagesReservations.fermerJour(lieuId, jour, ferme).catch(() => HORS_LIGNE);
      if (reponse.ok) appliquer(reponse, true);
      return reponse;
    },
    [reglagesReservations, lieuId, appliquer],
  );

  const enregistrer = useCallback(
    async (reglages: ReglagesServicesReservations): Promise<ReponseReglagesReservations> => {
      if (lieuId === null) return SANS_LIEU;
      const reponse = await reglagesReservations.reglerReservations(lieuId, reglages).catch(() => HORS_LIGNE);
      if (reponse.ok) appliquer(reponse, true);
      return reponse;
    },
    [reglagesReservations, lieuId, appliquer],
  );

  return { lecture, relire, fermerJour, enregistrer };
}
