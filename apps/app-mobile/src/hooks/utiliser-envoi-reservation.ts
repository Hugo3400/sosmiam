import { useCallback, useEffect, useRef, useState } from "react";

import type { DetailsErreur, ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { DemandeReservation, Reservation } from "@sos-miam/commun/types/reservation";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserServices } from "~/hooks/utiliser-services";
import { utiliserVisites } from "~/hooks/utiliser-visites";

export type RefusReservation = { erreur: ErreurService; details?: DetailsErreur; numero: number };

type ReservationGardee = { reservation: Reservation; lecture: number };

const HORS_LIGNE: Extract<ReponseApi, { ok: false }> = { ok: false, erreur: "hors-ligne" };

export function utiliserEnvoiReservation() {
  const services = utiliserServices();
  const { reservations: luesPartout, lecturesReservations, rafraichir } = utiliserVisites();
  const [envoi, setEnvoi] = useState(false);
  const [refus, setRefus] = useState<RefusReservation | null>(null);
  const [gardee, setGardee] = useState<ReservationGardee | null>(null);
  const numero = useRef(0);
  const occupe = useRef(false);
  const lectures = useRef(lecturesReservations);

  useEffect(() => {
    lectures.current = lecturesReservations;
  }, [lecturesReservations]);

  const remplacer = useCallback(
    (reservation: Reservation) => {
      setGardee({ reservation, lecture: lectures.current });
      void rafraichir();
    },
    [rafraichir],
  );

  const envoyer = useCallback(
    async (demande: DemandeReservation) => {
      if (occupe.current) return false;
      occupe.current = true;
      setEnvoi(true);
      setRefus(null);
      try {
        const reponse = await services.reservations.reserver(demande).catch(() => HORS_LIGNE);
        if (!reponse.ok) {
          numero.current += 1;
          setRefus({ erreur: reponse.erreur, details: reponse.details, numero: numero.current });
          return false;
        }
        vibrerLegerement();
        remplacer(reponse.reservation);
        return true;
      } finally {
        occupe.current = false;
        setEnvoi(false);
      }
    },
    [services, remplacer],
  );

  const recommencer = useCallback(() => {
    setGardee(null);
    setRefus(null);
  }, []);

  const relue =
    gardee && lecturesReservations > gardee.lecture
      ? luesPartout.find((r) => r.id === gardee.reservation.id && r.creeLe === gardee.reservation.creeLe)
      : undefined;
  const reservation = relue ?? gardee?.reservation ?? null;

  return { envoi, refus, effacerRefus: () => setRefus(null), reservation, envoyer, remplacer, recommencer, relire: rafraichir };
}
