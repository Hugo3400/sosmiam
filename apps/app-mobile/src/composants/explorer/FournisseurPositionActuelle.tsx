import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";

import type { PositionLieu } from "@sos-miam/commun/types/lieu";
import { lirePositionTelephone } from "~/fonctions/geo/lire-position-telephone";
import { ContextePositionActuelle, type EtatPositionActuelle } from "~/hooks/utiliser-position-actuelle";

const ABSENCE_MAX_MS = 5 * 60_000;

type PositionGardee = { position: PositionLieu; approximative: boolean };

export function FournisseurPositionActuelle({ children }: { children: ReactNode }) {
  const [gardee, setGardee] = useState<PositionGardee | null>(null);
  const [recherche, setRecherche] = useState(false);
  const [oublisApresAbsence, setOublisApresAbsence] = useState(0);
  const demande = useRef(0);
  const aUnePosition = useRef(false);
  const enArrierePlanDepuis = useRef<number | null>(null);

  const garder = useCallback((suivante: PositionGardee | null) => {
    aUnePosition.current = suivante !== null;
    setGardee(suivante);
  }, []);

  const oublier = useCallback(() => {
    demande.current += 1;
    setRecherche(false);
    garder(null);
  }, [garder]);

  useEffect(() => {
    const abonnement = AppState.addEventListener("change", (etat) => {
      if (etat === "background") {
        enArrierePlanDepuis.current ??= Date.now();
        return;
      }
      if (etat !== "active") return;
      const depuis = enArrierePlanDepuis.current;
      enArrierePlanDepuis.current = null;
      if (depuis === null || Date.now() - depuis <= ABSENCE_MAX_MS || !aUnePosition.current) return;
      oublier();
      setOublisApresAbsence((n) => n + 1);
    });
    return () => abonnement.remove();
  }, [oublier]);

  const chercher = useCallback(async () => {
    const numero = ++demande.current;
    setRecherche(true);
    const lecture = await lirePositionTelephone();
    if (numero !== demande.current) return null;
    setRecherche(false);
    if ("position" in lecture) garder(lecture);
    else if (lecture.erreur !== "introuvable") garder(null);
    return lecture;
  }, [garder]);

  const valeur = useMemo(
    (): EtatPositionActuelle => ({
      position: gardee?.position ?? null,
      approximative: gardee?.approximative ?? false,
      recherche,
      oublisApresAbsence,
      chercher,
      oublier,
    }),
    [gardee, recherche, oublisApresAbsence, chercher, oublier],
  );

  return <ContextePositionActuelle.Provider value={valeur}>{children}</ContextePositionActuelle.Provider>;
}
