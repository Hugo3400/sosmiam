import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import type { ReservationPro } from "@sos-miam/commun/types/reservation";
import { ContexteReservationsPro, type LectureReservationsPro, type SuiviReservationsPro } from "~/hooks/utiliser-reservations-pro";
import { utiliserServices } from "~/hooks/utiliser-services";

type Props = { lieuId: number | null; children: ReactNode };

const RELECTURE_MS = 30_000;
const HORS_LIGNE: Extract<ReponseApi, { ok: false }> = { ok: false, erreur: "hors-ligne" };

export function FournisseurReservationsPro({ lieuId, children }: Props) {
  const { comptoir } = utiliserServices();
  const [lue, setLue] = useState<{ lieuId: number | null; lecture: LectureReservationsPro }>({ lieuId, lecture: { etat: "attente" } });
  const lecture = useMemo<LectureReservationsPro>(() => (lue.lieuId === lieuId ? lue.lecture : { etat: "attente" }), [lue, lieuId]);
  const lieuLu = useRef(lieuId);

  const relire = useCallback(async () => {
    if (lieuId === null) return;
    const reponse = await comptoir.listerReservations(lieuId).catch(() => HORS_LIGNE);
    if (lieuLu.current !== lieuId) return;
    setLue((avant) => {
      const garde = avant.lieuId === lieuId && avant.lecture.etat === "lu";
      if (reponse.ok) return { lieuId, lecture: { etat: "lu", reservations: reponse.reservations } };
      return garde ? avant : { lieuId, lecture: { etat: "erreur", erreur: reponse.erreur } };
    });
  }, [comptoir, lieuId]);

  useEffect(() => {
    lieuLu.current = lieuId;
    if (lieuId === null) return;
    void relire();
    const minuterie = setInterval(() => void relire(), RELECTURE_MS);
    return () => {
      clearInterval(minuterie);
      lieuLu.current = null;
    };
  }, [lieuId, relire]);

  const remplacer = useCallback((reservation: ReservationPro) => {
    setLue((avant) =>
      avant.lecture.etat === "lu"
        ? { ...avant, lecture: { etat: "lu", reservations: avant.lecture.reservations.map((r) => (r.id === reservation.id ? reservation : r)) } }
        : avant,
    );
  }, []);

  const valeur = useMemo<SuiviReservationsPro>(() => ({ lieuId, lecture, relire, remplacer }), [lieuId, lecture, relire, remplacer]);
  return <ContexteReservationsPro.Provider value={valeur}>{children}</ContexteReservationsPro.Provider>;
}
