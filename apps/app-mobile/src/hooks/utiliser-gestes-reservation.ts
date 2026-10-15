import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { AccessibilityInfo } from "react-native";

import type { DetailsErreur } from "@sos-miam/commun/client-api/reponse-api";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { Reservation } from "@sos-miam/commun/types/reservation";
import { TEXTES_MES_RESERVATIONS } from "~/contenus/textes-mes-reservations";
import { utiliserLieux } from "~/hooks/utiliser-lieux";
import { utiliserPositionExpliquee } from "~/hooks/utiliser-position-expliquee";
import { utiliserServices } from "~/hooks/utiliser-services";

export type EchecGesteReservation = { erreur: ErreurService; details?: DetailsErreur; reservation: Reservation; geste: "annuler" | "presence" };

export type PresenceEnCours = { reservationId: number; texte: string };

const HORS_LIGNE = { ok: false as const, erreur: "hors-ligne" as const };
const A_RELIRE: readonly ErreurService[] = ["transition-interdite", "delai-depasse", "introuvable", "hors-fenetre-presence"];

export function utiliserGestesReservation(o: { remplacer: (reservation: Reservation) => void; actualiser: () => Promise<void> }) {
  const router = useRouter();
  const services = utiliserServices();
  const { trouverLieu } = utiliserLieux();
  const position = utiliserPositionExpliquee();
  const [presence, setPresence] = useState<PresenceEnCours | null>(null);
  const [echec, setEchec] = useState<EchecGesteReservation | null>(null);
  const occupe = useRef(false);
  const { remplacer, actualiser } = o;

  const echouer = useCallback(
    (e: EchecGesteReservation) => {
      setEchec(e);
      if (A_RELIRE.includes(e.erreur)) void actualiser();
    },
    [actualiser],
  );

  const annuler = useCallback(
    async (reservation: Reservation): Promise<boolean> => {
      const reponse = await services.reservations.annulerReservation(reservation.id).catch(() => HORS_LIGNE);
      if (reponse.ok) {
        remplacer(reponse.reservation);
        return true;
      }
      echouer({ erreur: reponse.erreur, details: reponse.details, reservation, geste: "annuler" });
      return false;
    },
    [services, remplacer, echouer],
  );

  const { lire } = position;
  const signalerPresence = useCallback(
    async (reservation: Reservation) => {
      if (occupe.current) return;
      occupe.current = true;
      try {
        setPresence({ reservationId: reservation.id, texte: TEXTES_MES_RESERVATIONS.positionEnCours });
        const lecture = await lire(trouverLieu(reservation.lieu.id)?.position ?? null, reservation.lieu.nom);
        if (!lecture.ok) {
          if (lecture.erreur !== "annulee") echouer({ erreur: lecture.erreur, reservation, geste: "presence" });
          return;
        }
        setPresence({ reservationId: reservation.id, texte: TEXTES_MES_RESERVATIONS.envoiPresence });
        const reponse = await services.reservations.signalerPresence(reservation.id, lecture.position).catch(() => HORS_LIGNE);
        if (!reponse.ok) return echouer({ erreur: reponse.erreur, details: reponse.details, reservation, geste: "presence" });
        remplacer(reponse.reservation);
        if (reponse.validation) router.push({ pathname: "/visite/[id]", params: { id: String(reponse.validation.visite.id), celebrer: "1" } });
        else AccessibilityInfo.announceForAccessibility(TEXTES_MES_RESERVATIONS.presenceNotee);
      } finally {
        occupe.current = false;
        setPresence(null);
      }
    },
    [lire, trouverLieu, services, remplacer, echouer, router],
  );

  return { annuler, signalerPresence, presence, echec, fermerEchec: () => setEchec(null), propsFeuillePosition: position.propsFeuille };
}
