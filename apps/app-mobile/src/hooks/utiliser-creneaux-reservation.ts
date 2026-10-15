import { useEffect, useState } from "react";

import type { DetailsErreur } from "@sos-miam/commun/client-api/reponse-api";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { utiliserServices } from "~/hooks/utiliser-services";

export type RefusLectureCreneaux = { erreur: ErreurService; details?: DetailsErreur };

const REFUS_DU_LIEU: readonly ErreurService[] = ["lieu-non-reservable", "membre-du-lieu", "introuvable"];

export function utiliserCreneauxReservation(lieuId: number, jour: string): { creneauxLus: Readonly<Record<string, readonly string[]>>; refusLieu: RefusLectureCreneaux | null } {
  const services = utiliserServices();
  const [creneauxLus, setCreneauxLus] = useState<Record<string, readonly string[]>>({});
  const [refusLieu, setRefusLieu] = useState<RefusLectureCreneaux | null>(null);

  useEffect(() => {
    let actuel = true;
    services.reservations.listerCreneaux(lieuId, jour).then(
      (reponse) => {
        if (!actuel) return;
        if (reponse.ok) setCreneauxLus((avant) => ({ ...avant, [jour]: reponse.creneaux }));
        else if (REFUS_DU_LIEU.includes(reponse.erreur)) setRefusLieu({ erreur: reponse.erreur, details: reponse.details });
      },
      () => {},
    );
    return () => {
      actuel = false;
    };
  }, [services, lieuId, jour]);

  return { creneauxLus, refusLieu };
}
