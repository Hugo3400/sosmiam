import { useCallback, useState } from "react";

import { REGLAGES_RESERVATIONS_DEFAUT } from "@sos-miam/commun/regles/reglages-reservations";
import type { DelaiReservation, ModeAcceptationReservation, ReglagesServicesReservations, ServiceReservation } from "@sos-miam/commun/types/reglages-reservations";
import { sontReglagesIdentiques } from "~/fonctions/reservations/sont-reglages-identiques";

const DEPART: ReglagesServicesReservations = {
  services: [],
  acceptation: REGLAGES_RESERVATIONS_DEFAUT.acceptation,
  delai: REGLAGES_RESERVATIONS_DEFAUT.delai,
};

export type BrouillonReglagesReservations = {
  brouillon: ReglagesServicesReservations;
  depart: ReglagesServicesReservations | null;
  modifie: boolean;
  repartirDe: (reglages: ReglagesServicesReservations) => void;
  toutAnnuler: () => void;
  changerMode: (acceptation: ModeAcceptationReservation) => void;
  changerDelai: (delai: DelaiReservation) => void;
  garderService: (index: number | null, service: ServiceReservation) => void;
  supprimerService: (index: number) => { repasseALaMain: boolean };
  remplacerServices: (services: ServiceReservation[]) => void;
};

export function utiliserBrouillonReglagesReservations(): BrouillonReglagesReservations {
  const [depart, setDepart] = useState<ReglagesServicesReservations | null>(null);
  const [brouillon, setBrouillon] = useState<ReglagesServicesReservations>(DEPART);

  const repartirDe = useCallback((reglages: ReglagesServicesReservations) => {
    const copie = { services: [...reglages.services], acceptation: reglages.acceptation, delai: reglages.delai };
    setDepart(copie);
    setBrouillon(copie);
  }, []);

  const toutAnnuler = useCallback(() => setBrouillon(depart ?? DEPART), [depart]);

  const changerMode = useCallback((acceptation: ModeAcceptationReservation) => setBrouillon((b) => ({ ...b, acceptation })), []);

  const changerDelai = useCallback((delai: DelaiReservation) => setBrouillon((b) => ({ ...b, delai })), []);

  const garderService = useCallback((index: number | null, service: ServiceReservation) => {
    setBrouillon((b) => ({ ...b, services: index === null ? [...b.services, service] : b.services.map((s, i) => (i === index ? service : s)) }));
  }, []);

  const supprimerService = useCallback(
    (index: number) => {
      const reste = brouillon.services.filter((_, i) => i !== index);
      const repasseALaMain = reste.length === 0 && brouillon.acceptation === "automatique";
      setBrouillon({ ...brouillon, services: reste, acceptation: repasseALaMain ? "manuelle" : brouillon.acceptation });
      return { repasseALaMain };
    },
    [brouillon],
  );

  const remplacerServices = useCallback((services: ServiceReservation[]) => {
    setBrouillon((b) => ({ ...b, services, acceptation: services.length === 0 ? "manuelle" : b.acceptation }));
  }, []);

  const modifie = depart !== null && !sontReglagesIdentiques(depart, brouillon);
  return { brouillon, depart, modifie, repartirDe, toutAnnuler, changerMode, changerDelai, garderService, supprimerService, remplacerServices };
}
