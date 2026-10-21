import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { MotifRefusReservation, ReservationPro } from "@sos-miam/commun/types/reservation";
import { utiliserServices } from "~/hooks/utiliser-services";

export type LectureReservationsPro = { etat: "attente" } | { etat: "lu"; reservations: ReservationPro[] } | { etat: "erreur"; erreur: ErreurService };

export type SuiviReservationsPro = {
  lieuId: number | null;
  lecture: LectureReservationsPro;
  relire: () => Promise<void>;
  remplacer: (reservation: ReservationPro) => void;
};

export type ReponseGesteReservationPro = ReponseApi<{ reservation: ReservationPro }>;

export const ContexteReservationsPro = createContext<SuiviReservationsPro | null>(null);

const HORS_LIGNE: Extract<ReponseApi, { ok: false }> = { ok: false, erreur: "hors-ligne" };

export function utiliserReservationsPro() {
  const suivi = useContext(ContexteReservationsPro);
  if (!suivi) throw new Error("utiliserReservationsPro doit être appelé sous <FournisseurReservationsPro>.");
  const { comptoir } = utiliserServices();
  const { relire, remplacer } = suivi;
  const [enCours, setEnCours] = useState<number | null>(null);
  const monte = useRef(true);

  useEffect(
    () => () => {
      monte.current = false;
    },
    [],
  );

  const agir = useCallback(
    async (id: number, geste: () => Promise<ReponseGesteReservationPro>): Promise<ReponseGesteReservationPro> => {
      setEnCours(id);
      try {
        const reponse = await geste().catch(() => HORS_LIGNE);
        if (reponse.ok) remplacer(reponse.reservation);
        void relire();
        return reponse;
      } finally {
        if (monte.current) setEnCours(null);
      }
    },
    [relire, remplacer],
  );

  return {
    lecture: suivi.lecture,
    relire,
    enCours,
    accepter: (id: number, choix: { creneau: string | null; depasser: boolean }) =>
      agir(id, () => comptoir.repondreReservation(id, { accepter: true, creneau: choix.creneau, depasser: choix.depasser })),
    refuser: (id: number, motif: MotifRefusReservation) => agir(id, () => comptoir.repondreReservation(id, { accepter: false, motif })),
    annuler: (id: number, motif: MotifRefusReservation) => agir(id, () => comptoir.annulerReservation(id, motif)),
    marquerArrivee: (id: number, venu: boolean) => agir(id, () => comptoir.marquerArrivee(id, venu)),
  };
}
