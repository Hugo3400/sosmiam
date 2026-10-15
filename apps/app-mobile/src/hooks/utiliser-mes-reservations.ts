import { useCallback, useEffect, useState } from "react";

import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { Reservation } from "@sos-miam/commun/types/reservation";
import { utiliserServices } from "~/hooks/utiliser-services";
import { utiliserVisites } from "~/hooks/utiliser-visites";

export type LectureMesReservations = { etat: "attente" } | { etat: "lu"; reservations: Reservation[] } | { etat: "erreur"; erreur: ErreurService };

const HORS_LIGNE: Extract<ReponseApi, { ok: false }> = { ok: false, erreur: "hors-ligne" };

export function utiliserMesReservations(): {
  lecture: LectureMesReservations;
  actualiser: () => Promise<void>;
  remplacer: (reservation: Reservation) => void;
} {
  const services = utiliserServices();
  const { reservations: luesPartout, rafraichir } = utiliserVisites();
  const [lecture, setLecture] = useState<LectureMesReservations>({ etat: "attente" });

  const relire = useCallback(async () => {
    const reponse = await services.reservations.listerReservations().catch(() => HORS_LIGNE);
    setLecture((avant) => {
      if (reponse.ok) return { etat: "lu", reservations: reponse.reservations };
      return avant.etat === "lu" ? avant : { etat: "erreur", erreur: reponse.erreur };
    });
  }, [services]);

  useEffect(() => {
    void relire();
  }, [relire]);

  useEffect(() => {
    setLecture((avant) => (avant.etat === "lu" ? { etat: "lu", reservations: luesPartout } : avant));
  }, [luesPartout]);

  const actualiser = useCallback(async () => {
    await Promise.all([relire(), rafraichir()]);
  }, [relire, rafraichir]);

  const remplacer = useCallback(
    (reservation: Reservation) => {
      setLecture((avant) => (avant.etat === "lu" ? { etat: "lu", reservations: avant.reservations.map((r) => (r.id === reservation.id ? reservation : r)) } : avant));
      void rafraichir();
    },
    [rafraichir],
  );

  return { lecture, actualiser, remplacer };
}
