import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import type { ServiceCommunaute } from "@sos-miam/commun/client-api/contrat-communaute";
import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { utiliserServiceCommunaute } from "~/hooks/utiliser-service-communaute";
import { utiliserSourceSociale } from "~/hooks/utiliser-source-sociale";

export type LectureCommunaute<T> = {
  donnees: T | null;
  chargement: boolean;
  erreur: ErreurService | null;
  relire: () => Promise<void>;
  remplacer: (changer: (donnees: T) => T) => void;
};

const HORS_LIGNE = { ok: false, erreur: "hors-ligne" } as const;

export function utiliserLectureCommunaute<T extends object>(lire: (service: ServiceCommunaute) => Promise<ReponseApi<T>>): LectureCommunaute<T> {
  const service = utiliserServiceCommunaute();
  const actif = utiliserSourceSociale() === "compte";
  const [donnees, setDonnees] = useState<T | null>(null);
  const [chargement, setChargement] = useState(actif);
  const [erreur, setErreur] = useState<ErreurService | null>(null);
  const generation = useRef(0);
  const lecture = useRef(lire);

  useEffect(() => {
    lecture.current = lire;
  });

  const relire = useCallback(async () => {
    if (!actif) return;
    const g = ++generation.current;
    setChargement(true);
    const reponse = await lecture.current(service).catch(() => HORS_LIGNE);
    if (g !== generation.current) return;
    setChargement(false);
    if (reponse.ok) {
      setDonnees(reponse);
      setErreur(null);
    } else setErreur(reponse.erreur);
  }, [service, actif]);

  useFocusEffect(
    useCallback(() => {
      void relire();
    }, [relire]),
  );

  const remplacer = useCallback((changer: (d: T) => T) => {
    generation.current++;
    setDonnees((d) => (d ? changer(d) : d));
  }, []);

  return { donnees, chargement, erreur, relire, remplacer };
}
