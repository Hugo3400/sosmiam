import { useEffect, useState } from "react";

import type { CreneauxReservationLus } from "@sos-miam/commun/client-api/contrat-reservations";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { lireCreneauxLus } from "~/fonctions/reservations/lire-creneaux-lus";
import type { RefusLectureReservation } from "~/hooks/utiliser-jours-reservation";
import { utiliserServices } from "~/hooks/utiliser-services";

export type LectureCreneauxReservation = {
  lus: CreneauxReservationLus | null;
  frais: boolean;
  horsLigne: boolean;
  refusLieu: RefusLectureReservation | null;
};

type Lecture = { jour: string; personnes: number; relecture: number; lus: CreneauxReservationLus };

const REFUS_DU_LIEU: readonly ErreurService[] = ["lieu-non-reservable", "membre-du-lieu", "introuvable"];

export function utiliserCreneauxReservation(lieuId: number, jour: string, personnes: number, relecture: number): LectureCreneauxReservation {
  const { reservations } = utiliserServices();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [horsLigne, setHorsLigne] = useState(false);
  const [refusLieu, setRefusLieu] = useState<RefusLectureReservation | null>(null);

  useEffect(() => {
    let actuel = true;
    setHorsLigne(false);
    reservations.listerCreneaux(lieuId, jour, personnes).then(
      (reponse) => {
        if (!actuel) return;
        if (reponse.ok) {
          const lus = lireCreneauxLus(reponse);
          setLectures((avant) => [{ jour, personnes, relecture, lus }, ...avant.filter((l) => l.jour !== jour || l.personnes !== personnes)].slice(0, 12));
        } else if (REFUS_DU_LIEU.includes(reponse.erreur)) setRefusLieu({ erreur: reponse.erreur, details: reponse.details });
        else if (reponse.erreur === "hors-ligne") setHorsLigne(true);
      },
      () => actuel && setHorsLigne(true),
    );
    return () => {
      actuel = false;
    };
  }, [reservations, lieuId, jour, personnes, relecture]);

  const exacte = lectures.find((l) => l.jour === jour && l.personnes === personnes && l.relecture === relecture);
  const duJour = exacte ?? lectures.find((l) => l.jour === jour);
  return { lus: duJour?.lus ?? null, frais: exacte !== undefined, horsLigne: horsLigne && exacte === undefined, refusLieu };
}
