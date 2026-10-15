import { useCallback, useRef, useState } from "react";

import type { DetailsErreur } from "@sos-miam/commun/client-api/reponse-api";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { DemandeReservation, Reservation } from "@sos-miam/commun/types/reservation";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserServices } from "~/hooks/utiliser-services";
import { utiliserVisites } from "~/hooks/utiliser-visites";

export type RefusReservation = { erreur: ErreurService; details?: DetailsErreur; numero: number };

const HORS_LIGNE = { ok: false as const, erreur: "hors-ligne" as const };

export function utiliserEnvoiReservation() {
  const services = utiliserServices();
  const { reservations: luesPartout, rafraichir } = utiliserVisites();
  const [envoi, setEnvoi] = useState(false);
  const [refus, setRefus] = useState<RefusReservation | null>(null);
  const [envoyee, setEnvoyee] = useState<Reservation | null>(null);
  const numero = useRef(0);
  const occupe = useRef(false);

  const refuser = useCallback((erreur: ErreurService, details?: DetailsErreur) => {
    numero.current += 1;
    setRefus({ erreur, details, numero: numero.current });
  }, []);

  const lancer = useCallback(
    async (geste: () => Promise<{ ok: true; reservation: Reservation } | { ok: false; erreur: ErreurService; details?: DetailsErreur }>) => {
      if (occupe.current) return;
      occupe.current = true;
      setEnvoi(true);
      setRefus(null);
      try {
        const reponse = await geste().catch(() => HORS_LIGNE);
        if (!reponse.ok) return refuser(reponse.erreur, reponse.details);
        vibrerLegerement();
        setEnvoyee(reponse.reservation);
        void rafraichir();
      } finally {
        occupe.current = false;
        setEnvoi(false);
      }
    },
    [refuser, rafraichir],
  );

  const envoyer = useCallback((demande: DemandeReservation) => lancer(() => services.reservations.reserver(demande)), [lancer, services]);

  const annuler = useCallback(() => {
    if (!envoyee) return Promise.resolve();
    return lancer(() => services.reservations.annulerReservation(envoyee.id));
  }, [lancer, services, envoyee]);

  const recommencer = useCallback(() => {
    setEnvoyee(null);
    setRefus(null);
  }, []);

  const reponseDuLieu = envoyee?.statut === "demandee" ? luesPartout.find((r) => r.id === envoyee.id && r.creeLe === envoyee.creeLe) : undefined;
  const reservation = reponseDuLieu ?? envoyee;

  return { envoi, refus, effacerRefus: () => setRefus(null), reservation, envoyer, annuler, recommencer };
}
