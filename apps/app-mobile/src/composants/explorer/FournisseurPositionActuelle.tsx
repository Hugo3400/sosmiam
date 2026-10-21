import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";

import type { PositionLieu } from "@sos-miam/commun/types/lieu";
import { lirePositionTelephone } from "~/fonctions/geo/lire-position-telephone";
import { ContextePositionActuelle, type EtatPositionActuelle } from "~/hooks/utiliser-position-actuelle";
import { utiliserProfil } from "~/hooks/utiliser-profil";

const ABSENCE_MAX_MS = 5 * 60_000;
const OUBLI_RECENT_MS = 8_000;

type PositionGardee = { position: PositionLieu; approximative: boolean; compte: string | null };

export function FournisseurPositionActuelle({ children }: { children: ReactNode }) {
  const { profil } = utiliserProfil();
  const compte = profil?.creeLe ?? null;
  const [gardee, setGardee] = useState<PositionGardee | null>(null);
  const [recherche, setRecherche] = useState(false);
  const [oubliApresAbsence, setOubliApresAbsence] = useState<number | null>(null);
  const demande = useRef(0);
  const enArrierePlanDepuis = useRef<number | null>(null);
  const finOubli = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (gardee !== null && gardee.compte !== compte) setGardee(null);
  const tenue = gardee !== null && gardee.compte === compte ? gardee : null;
  const actuel = useRef({ compte, aUnePosition: tenue !== null });
  useEffect(() => {
    actuel.current = { compte, aUnePosition: tenue !== null };
  });

  const oublier = useCallback(() => {
    demande.current += 1;
    setRecherche(false);
    setGardee(null);
  }, []);

  useEffect(() => {
    const abonnement = AppState.addEventListener("change", (etat) => {
      if (etat === "background") {
        enArrierePlanDepuis.current ??= Date.now();
        return;
      }
      if (etat !== "active") return;
      const depuis = enArrierePlanDepuis.current;
      enArrierePlanDepuis.current = null;
      if (depuis === null || Date.now() - depuis <= ABSENCE_MAX_MS || !actuel.current.aUnePosition) return;
      oublier();
      setOubliApresAbsence(Date.now());
      if (finOubli.current) clearTimeout(finOubli.current);
      finOubli.current = setTimeout(() => setOubliApresAbsence(null), OUBLI_RECENT_MS);
    });
    return () => {
      abonnement.remove();
      if (finOubli.current) clearTimeout(finOubli.current);
    };
  }, [oublier]);

  const chercher = useCallback(async () => {
    const numero = ++demande.current;
    const pour = actuel.current.compte;
    setRecherche(true);
    const lecture = await lirePositionTelephone(actuel.current.aUnePosition);
    if (numero !== demande.current) return null;
    setRecherche(false);
    if ("position" in lecture) setGardee({ ...lecture, compte: pour });
    else if (lecture.erreur !== "introuvable") setGardee(null);
    return lecture;
  }, []);

  const valeur = useMemo(
    (): EtatPositionActuelle => ({
      position: tenue?.position ?? null,
      approximative: tenue?.approximative ?? false,
      recherche,
      oubliApresAbsence,
      chercher,
      oublier,
    }),
    [tenue, recherche, oubliApresAbsence, chercher, oublier],
  );

  return <ContextePositionActuelle.Provider value={valeur}>{children}</ContextePositionActuelle.Provider>;
}
