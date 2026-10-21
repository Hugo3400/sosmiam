import { useEffect, useMemo, useState } from "react";

import { listerJoursReservation } from "@sos-miam/commun/fonctions/reservations/lister-jours-reservation";
import { calculerJourParis } from "@sos-miam/commun/fonctions/temps/calculer-jour-paris";
import { PERSONNES_RESERVATION_MAX } from "@sos-miam/commun/regles/reservations";
import type { DetailsErreur } from "@sos-miam/commun/client-api/reponse-api";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { CreneauOuverture } from "@sos-miam/commun/types/lieu";
import type { DelaiReservation, JourReservation, ModeAcceptationReservation } from "@sos-miam/commun/types/reglages-reservations";
import { utiliserServices } from "~/hooks/utiliser-services";

export type RefusLectureReservation = { erreur: ErreurService; details?: DetailsErreur };

export type JoursReservationLus = {
  jours: JourReservation[];
  source: "api" | "local";
  horsLigne: boolean;
  acceptation: ModeAcceptationReservation | null;
  delai: DelaiReservation;
  personnesMax: number;
  refusLieu: RefusLectureReservation | null;
};

type Lu = { jours: JourReservation[]; acceptation: ModeAcceptationReservation; delai: DelaiReservation; personnesMax: number };

const REFUS_DU_LIEU: readonly ErreurService[] = ["lieu-non-reservable", "membre-du-lieu"];
const DELAI_SANS_REGLAGE: DelaiReservation = "1-h";

export function utiliserJoursReservation(lieu: { id: number; ouverture: readonly CreneauOuverture[] }, personnes: number, maintenantMs: number, relecture: number): JoursReservationLus {
  const { reservations } = utiliserServices();
  const [lu, setLu] = useState<Lu | null>(null);
  const [source, setSource] = useState<"api" | "local">("api");
  const [horsLigne, setHorsLigne] = useState(false);
  const [refusLieu, setRefusLieu] = useState<RefusLectureReservation | null>(null);
  const aujourdhui = calculerJourParis(maintenantMs);
  const heure = Math.floor(maintenantMs / 60_000);
  const locaux = useMemo(
    () => listerJoursReservation({ ouverture: lieu.ouverture, reglages: null, maintenant: new Date(heure * 60_000) }),
    [lieu.ouverture, heure],
  );

  useEffect(() => {
    let actuel = true;
    reservations.listerJours(lieu.id, personnes).then(
      (reponse) => {
        if (!actuel) return;
        if (reponse.ok) {
          setLu({ jours: reponse.jours, acceptation: reponse.acceptation, delai: reponse.delai, personnesMax: reponse.personnesMax });
          setSource("api");
          setHorsLigne(false);
          return;
        }
        if (REFUS_DU_LIEU.includes(reponse.erreur)) return setRefusLieu({ erreur: reponse.erreur, details: reponse.details });
        if (reponse.erreur === "hors-ligne") return setHorsLigne(true);
        setSource("local");
        setHorsLigne(false);
      },
      () => actuel && setHorsLigne(true),
    );
    return () => {
      actuel = false;
    };
  }, [reservations, lieu.id, personnes, relecture, aujourdhui]);

  const valables = lu !== null && lu.jours[0]?.jour === aujourdhui;
  return {
    jours: source === "api" && valables ? lu.jours : locaux,
    source: source === "api" && valables ? "api" : "local",
    horsLigne,
    acceptation: lu?.acceptation ?? null,
    delai: lu?.delai ?? DELAI_SANS_REGLAGE,
    personnesMax: lu?.personnesMax ?? PERSONNES_RESERVATION_MAX,
    refusLieu,
  };
}
