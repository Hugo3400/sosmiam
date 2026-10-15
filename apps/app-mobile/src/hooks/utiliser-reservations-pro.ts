import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { MotifRefusReservation, ReservationPro } from "@sos-miam/commun/types/reservation";
import { utiliserServices } from "~/hooks/utiliser-services";

export type LectureReservationsPro = { etat: "attente" } | { etat: "lu"; reservations: ReservationPro[] } | { etat: "erreur"; erreur: ErreurService };

type ReponseGeste = ReponseApi<{ reservation: ReservationPro }>;

const HORS_LIGNE: Extract<ReponseApi, { ok: false }> = { ok: false, erreur: "hors-ligne" };
const RELECTURE_MS = 30_000;

export function utiliserReservationsPro(lieuId: number | null) {
  const { comptoir } = utiliserServices();
  const [lecture, setLecture] = useState<LectureReservationsPro>({ etat: "attente" });
  const [enCours, setEnCours] = useState<number | null>(null);
  const monte = useRef(true);

  useEffect(
    () => () => {
      monte.current = false;
    },
    [],
  );

  const relire = useCallback(async () => {
    if (lieuId === null) return;
    const reponse = await comptoir.listerReservations(lieuId).catch(() => HORS_LIGNE);
    if (!monte.current) return;
    setLecture((avant) => {
      if (reponse.ok) return { etat: "lu", reservations: reponse.reservations };
      return avant.etat === "lu" ? avant : { etat: "erreur", erreur: reponse.erreur };
    });
  }, [comptoir, lieuId]);

  useFocusEffect(
    useCallback(() => {
      void relire();
      const desabonner = comptoir.ecouter(() => void relire());
      const minuterie = setInterval(() => void relire(), RELECTURE_MS);
      return () => {
        desabonner();
        clearInterval(minuterie);
      };
    }, [comptoir, relire]),
  );

  const agir = useCallback(
    async (id: number, geste: () => Promise<ReponseGeste>): Promise<ReponseGeste> => {
      setEnCours(id);
      try {
        const reponse = await geste().catch(() => HORS_LIGNE);
        if (reponse.ok && monte.current) {
          setLecture((avant) => (avant.etat === "lu" ? { etat: "lu", reservations: avant.reservations.map((r) => (r.id === id ? reponse.reservation : r)) } : avant));
        }
        void relire();
        return reponse;
      } finally {
        if (monte.current) setEnCours(null);
      }
    },
    [relire],
  );

  return {
    lecture,
    enCours,
    relire,
    accepter: (id: number) => agir(id, () => comptoir.repondreReservation(id, { accepter: true })),
    refuser: (id: number, motif: MotifRefusReservation) => agir(id, () => comptoir.repondreReservation(id, { accepter: false, motif })),
    marquerArrivee: (id: number, venu: boolean) => agir(id, () => comptoir.marquerArrivee(id, venu)),
  };
}
