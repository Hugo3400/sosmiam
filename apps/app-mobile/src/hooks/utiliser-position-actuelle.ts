import { createContext, useContext } from "react";

import type { PositionLieu } from "@sos-miam/commun/types/lieu";
import type { LecturePosition } from "~/fonctions/geo/lire-position-telephone";

export type { ErreurPosition } from "~/fonctions/geo/lire-position-telephone";

export type EtatPositionActuelle = {
  position: PositionLieu | null;
  approximative: boolean;
  recherche: boolean;
  oubliApresAbsence: number | null;
  chercher: () => Promise<LecturePosition | null>;
  oublier: () => void;
};

export const ContextePositionActuelle = createContext<EtatPositionActuelle | null>(null);

export function utiliserPositionActuelle(): EtatPositionActuelle {
  const valeur = useContext(ContextePositionActuelle);
  if (!valeur) throw new Error("utiliserPositionActuelle doit être appelé sous <FournisseurPositionActuelle>.");
  return valeur;
}
