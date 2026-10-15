import { useCallback, useSyncExternalStore } from "react";

import { utiliserServices } from "~/hooks/utiliser-services";
import { lireEtatMiamSafeLieu, relireMiamSafeLieu, suivreMiamSafeLieu, type LectureMiamSafe } from "~/services/memoire-miam-safe-lieux";

export type EtatLectureMiamSafeLieu = { lecture: LectureMiamSafe; engage: boolean; repere: boolean; relire: () => void };

const sansAbonnement = () => () => {};

export function utiliserEtatMiamSafeLieu(lieuId: number): EtatLectureMiamSafeLieu {
  const services = utiliserServices();
  const valide = Number.isInteger(lieuId) && lieuId >= 0;
  const suivre = useCallback((prevenir: () => void) => suivreMiamSafeLieu(services, lieuId, prevenir), [services, lieuId]);
  const lire = useCallback(() => lireEtatMiamSafeLieu(services, lieuId), [services, lieuId]);
  const etat = useSyncExternalStore(valide ? suivre : sansAbonnement, lire, lire);
  const relire = useCallback(() => {
    if (valide) relireMiamSafeLieu(services, lieuId);
  }, [services, lieuId, valide]);
  if (!valide) return { lecture: "lue", engage: false, repere: false, relire };
  return { lecture: etat.lecture, engage: etat.valeur?.engage ?? false, repere: etat.valeur?.repere ?? false, relire };
}
