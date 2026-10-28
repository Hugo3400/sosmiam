import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { AccessibilityInfo, Linking } from "react-native";

import type { DetailsErreur, ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { Reservation } from "@sos-miam/commun/types/reservation";
import { TEXTES_MES_RESERVATIONS } from "~/contenus/textes-mes-reservations";
import { listerActionsEchecReservation } from "~/fonctions/reservations/lister-actions-echec-reservation";
import { utiliserPositionExpliquee } from "~/hooks/utiliser-position-expliquee";
import { utiliserServices } from "~/hooks/utiliser-services";

export type EchecGesteReservation = { erreur: ErreurService; details?: DetailsErreur; reservation: Reservation; geste: "annuler" | "presence" };

export type PresenceEnCours = { reservationId: number; texte: string };

const HORS_LIGNE: Extract<ReponseApi, { ok: false }> = { ok: false, erreur: "hors-ligne" };
const A_RELIRE: readonly ErreurService[] = ["transition-interdite", "delai-depasse", "introuvable", "hors-fenetre-presence"];

export function utiliserGestesReservation(o: { remplacer: (reservation: Reservation) => void; actualiser: () => Promise<void> }) {
  const router = useRouter();
  const services = utiliserServices();
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
        const lecture = await lire(reservation.lieu.nom);
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
    [lire, services, remplacer, echouer, router],
  );

  const actionsEchec = echec
    ? listerActionsEchecReservation(echec.erreur, {
        reessayer: () => void (echec.geste === "annuler" ? annuler(echec.reservation) : signalerPresence(echec.reservation)),
        ouvrirReglages: () => void Linking.openSettings().catch(() => {}),
      })
    : [];

  return { annuler, signalerPresence, presence, echec, actionsEchec, fermerEchec: () => setEchec(null), propsFeuillePosition: position.propsFeuille };
}
