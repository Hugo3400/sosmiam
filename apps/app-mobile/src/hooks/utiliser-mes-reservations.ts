import { useCallback, useEffect, useState } from "react";

import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import type { Reservation } from "@sos-miam/commun/types/reservation";
import { suivreLectureReservations, type EvenementLectureReservations, type LectureMesReservations } from "~/fonctions/reservations/suivre-lecture-reservations";
import { utiliserServices } from "~/hooks/utiliser-services";
import { utiliserVisites } from "~/hooks/utiliser-visites";

const HORS_LIGNE: Extract<ReponseApi, { ok: false }> = { ok: false, erreur: "hors-ligne" };

export function utiliserMesReservations(): {
  lecture: LectureMesReservations;
  actualiser: () => Promise<void>;
  remplacer: (reservation: Reservation) => void;
} {
  const services = utiliserServices();
  const { reservations: luesPartout, lecturesReservations, rafraichir } = utiliserVisites();
  const [lecture, setLecture] = useState<LectureMesReservations>({ etat: "attente" });
  const suivre = useCallback((evenement: EvenementLectureReservations) => setLecture((avant) => suivreLectureReservations(avant, evenement)), []);

  const relire = useCallback(async () => {
    const reponse = await services.reservations.listerReservations().catch(() => HORS_LIGNE);
    suivre(reponse.ok ? { type: "lue", reservations: reponse.reservations } : { type: "ratee", erreur: reponse.erreur });
  }, [services, suivre]);

  useEffect(() => {
    void relire();
  }, [relire]);

  useEffect(() => {
    if (lecturesReservations > 0) suivre({ type: "lue-ailleurs", reservations: luesPartout });
  }, [lecturesReservations, luesPartout, suivre]);

  const actualiser = useCallback(async () => {
    await Promise.all([relire(), rafraichir()]);
  }, [relire, rafraichir]);

  const remplacer = useCallback(
    (reservation: Reservation) => {
      suivre({ type: "remplacee", reservation });
      void rafraichir();
    },
    [suivre, rafraichir],
  );

  return { lecture, actualiser, remplacer };
}
