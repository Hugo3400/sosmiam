import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";

import type { PositionLieu } from "@sos-miam/commun/types/lieu";
import { lirePositionTelephone } from "~/fonctions/geo/lire-position-telephone";
import { utiliserLieux } from "~/hooks/utiliser-lieux";
import { ContextePositionActuelle, type EtatPositionActuelle } from "~/hooks/utiliser-position-actuelle";
import { utiliserProfil } from "~/hooks/utiliser-profil";

const ABSENCE_MAX_MS = 5 * 60_000;
const OUBLI_RECENT_MS = 8_000;

type PositionGardee = { position: PositionLieu; approximative: boolean; compte: string | null };

type Absence = { depuis: number; minuterie: ReturnType<typeof setTimeout> | null; oubliee: boolean };

export function FournisseurPositionActuelle({ children }: { children: ReactNode }) {
  const { profil } = utiliserProfil();
  const { oublierZonesDeTaPosition } = utiliserLieux();
  const compte = profil?.creeLe ?? null;
  const [gardee, setGardee] = useState<PositionGardee | null>(null);
  const [recherche, setRecherche] = useState(false);
  const [oubliApresAbsence, setOubliApresAbsence] = useState<number | null>(null);
  const demande = useRef(0);
  const absence = useRef<Absence | null>(null);
  const finOubli = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (gardee !== null && gardee.compte !== compte) setGardee(null);
  const tenue = gardee !== null && gardee.compte === compte ? gardee : null;
  const actuel = useRef({ compte, aUnePosition: tenue !== null });
  useEffect(() => {
    actuel.current = { compte, aUnePosition: tenue !== null };
  });

  const avecPosition = tenue !== null;
  useEffect(() => {
    if (!avecPosition) oublierZonesDeTaPosition();
  }, [avecPosition, oublierZonesDeTaPosition]);

  const oublier = useCallback(() => {
    demande.current += 1;
    setRecherche(false);
    setGardee(null);
  }, []);

  const marquerOubliDit = useCallback((quand: number) => setOubliApresAbsence((actuelle) => (actuelle === quand ? null : actuelle)), []);

  useEffect(() => {
    const annoncerOubli = () => {
      setOubliApresAbsence(Date.now());
      if (finOubli.current) clearTimeout(finOubli.current);
      finOubli.current = setTimeout(() => setOubliApresAbsence(null), OUBLI_RECENT_MS);
    };
    const abonnement = AppState.addEventListener("change", (etat) => {
      if (etat === "background") {
        if (absence.current) return;
        const debut: Absence = { depuis: Date.now(), minuterie: null, oubliee: false };
        if (actuel.current.aUnePosition) {
          debut.minuterie = setTimeout(() => {
            debut.oubliee = actuel.current.aUnePosition;
            oublier();
          }, ABSENCE_MAX_MS);
        }
        absence.current = debut;
        return;
      }
      if (etat !== "active") return;
      const finie = absence.current;
      absence.current = null;
      if (!finie) return;
      if (finie.minuterie) clearTimeout(finie.minuterie);
      if (Date.now() - finie.depuis <= ABSENCE_MAX_MS) return;
      if (finie.oubliee) return annoncerOubli();
      if (!actuel.current.aUnePosition) return;
      oublier();
      annoncerOubli();
    });
    return () => {
      abonnement.remove();
      if (absence.current?.minuterie) clearTimeout(absence.current.minuterie);
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
      marquerOubliDit,
    }),
    [tenue, recherche, oubliApresAbsence, chercher, oublier, marquerOubliDit],
  );

  return <ContextePositionActuelle.Provider value={valeur}>{children}</ContextePositionActuelle.Provider>;
}
