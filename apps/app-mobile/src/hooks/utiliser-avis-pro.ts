import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import type { AvisPublic, ResumeAvis } from "@sos-miam/commun/types/avis";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { utiliserServices } from "~/hooks/utiliser-services";

export type LectureAvisPro = { etat: "attente" } | { etat: "lu"; resume: ResumeAvis; avis: AvisPublic[] } | { etat: "erreur"; erreur: ErreurService };

type ReponseReponse = ReponseApi<{ avis: AvisPublic }>;

const HORS_LIGNE: Extract<ReponseApi, { ok: false }> = { ok: false, erreur: "hors-ligne" };
const RELECTURE_MS = 60_000;

export function utiliserAvisPro(lieuId: number | null) {
  const { comptoir } = utiliserServices();
  const [lecture, setLecture] = useState<LectureAvisPro>({ etat: "attente" });
  const [enCours, setEnCours] = useState<number | null>(null);
  const monte = useRef(true);

  useEffect(
    () => () => {
      monte.current = false;
    },
    [],
  );

  const relire = useCallback(async () => {
    if (lieuId === null) return;
    const r = await comptoir.listerAvis(lieuId).catch(() => HORS_LIGNE);
    if (!monte.current) return;
    setLecture((avant) => {
      if (r.ok) return { etat: "lu", resume: r.resume, avis: r.avis };
      return avant.etat === "lu" ? avant : { etat: "erreur", erreur: r.erreur };
    });
  }, [comptoir, lieuId]);

  useFocusEffect(
    useCallback(() => {
      void relire();
      const desabonner = comptoir.ecouter(() => void relire());
      const minuterie = setInterval(() => void relire(), RELECTURE_MS);
      return () => {
        desabonner();
        clearInterval(minuterie);
      };
    }, [comptoir, relire]),
  );

  const repondre = useCallback(
    async (avisId: number, texte: string): Promise<ReponseReponse> => {
      setEnCours(avisId);
      try {
        const r = await comptoir.repondreAvis(avisId, texte).catch(() => HORS_LIGNE);
        if (r.ok && monte.current) {
          setLecture((avant) => (avant.etat === "lu" ? { ...avant, avis: avant.avis.map((a) => (a.id === avisId ? r.avis : a)) } : avant));
        }
        if (r.ok || r.erreur === "reponse-deja-donnee" || r.erreur === "introuvable") void relire();
        return r;
      } finally {
        if (monte.current) setEnCours(null);
      }
    },
    [comptoir, relire],
  );

  return { lecture, enCours, relire, repondre };
}
