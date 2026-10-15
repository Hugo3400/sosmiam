import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import type { AvisPublic, ResumeAvis } from "@sos-miam/commun/types/avis";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { utiliserServices } from "~/hooks/utiliser-services";

export type LectureAvisLieu =
  | { etat: "attente" }
  | { etat: "erreur"; erreur: ErreurService }
  | { etat: "lu"; resume: ResumeAvis; avis: AvisPublic[]; suite: string | null };

const HORS_LIGNE: Extract<ReponseApi, { ok: false }> = { ok: false, erreur: "hors-ligne" };

export function utiliserAvisLieu(lieuId: number) {
  const { avis: service } = utiliserServices();
  const [lecture, setLecture] = useState<LectureAvisLieu>({ etat: "attente" });
  const [suiteEnCours, setSuiteEnCours] = useState(false);
  const monte = useRef(true);
  const derniereLecture = useRef(0);

  useEffect(
    () => () => {
      monte.current = false;
    },
    [],
  );

  const relire = useCallback(async () => {
    const numero = ++derniereLecture.current;
    const r = await service.listerAvisLieu(lieuId).catch(() => HORS_LIGNE);
    if (!monte.current || numero !== derniereLecture.current) return;
    setLecture((avant) => {
      if (r.ok) return { etat: "lu", resume: r.resume, avis: r.avis, suite: r.suite ?? null };
      return avant.etat === "lu" ? avant : { etat: "erreur", erreur: r.erreur };
    });
  }, [service, lieuId]);

  const lireSuite = useCallback(async () => {
    if (lecture.etat !== "lu" || !lecture.suite || suiteEnCours) return;
    const numero = derniereLecture.current;
    setSuiteEnCours(true);
    const r = await service.listerAvisLieu(lieuId, lecture.suite).catch(() => HORS_LIGNE);
    if (!monte.current) return;
    setSuiteEnCours(false);
    if (!r.ok || numero !== derniereLecture.current) return;
    setLecture((avant) => {
      if (avant.etat !== "lu") return avant;
      const deja = new Set(avant.avis.map((a) => a.id));
      return { etat: "lu", resume: r.resume, avis: [...avant.avis, ...r.avis.filter((a) => !deja.has(a.id))], suite: r.suite ?? null };
    });
  }, [service, lieuId, lecture, suiteEnCours]);

  useFocusEffect(
    useCallback(() => {
      void relire();
    }, [relire]),
  );

  return { lecture, suiteEnCours, relire, lireSuite };
}
