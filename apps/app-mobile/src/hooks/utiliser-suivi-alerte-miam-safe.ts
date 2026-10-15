import { useEffect, useState } from "react";

import { utiliserAlerteGardeeMiamSafe, type AlerteGardeeLieu } from "~/hooks/utiliser-alerte-gardee-miam-safe";
import { utiliserServices } from "~/hooks/utiliser-services";
import { noterStatutAlerteMiamSafe } from "~/services/memoire-alertes-miam-safe";

export type SuiviAlerteMiamSafe = AlerteGardeeLieu & { aRelire: boolean };

const RELECTURE_MS = 3000;
const RELECTURE_SANS_REPONSE_MS = 10_000;

function lireReponse(repondueLe: string | null): number {
  const instant = repondueLe ? Date.parse(repondueLe) : Number.NaN;
  return Number.isNaN(instant) ? Date.now() : instant;
}

function choisirAlertesDuTour(id: number, precedentes: number[], tour: number): number[] {
  if (precedentes.length === 0 || tour % 2 === 1) return [id];
  return [precedentes[(tour / 2 - 1) % precedentes.length]];
}

export function utiliserSuiviAlerteMiamSafe(lieuId: number, actif: boolean): SuiviAlerteMiamSafe {
  const { miamSafe } = utiliserServices();
  const { cle, alerte } = utiliserAlerteGardeeMiamSafe(lieuId);
  const [relue, setRelue] = useState<string | null>(null);
  const suivie = actif && alerte !== null && alerte.statut !== "en-route" ? alerte : null;
  const repere = alerte ? JSON.stringify([cle, alerte.id]) : null;

  if (!actif && relue !== null) setRelue(null);

  useEffect(() => {
    if (!suivie) return;
    const { id, precedentes, statut } = suivie;
    const marque = JSON.stringify([cle, id]);
    let vivant = true;
    let enCours = false;
    let tour = 0;
    const relire = async (ids: number[]) => {
      if (enCours) return;
      enCours = true;
      const reponses = await Promise.all(ids.map((alerteId) => miamSafe.suivreAlerte(alerteId).catch(() => null)));
      enCours = false;
      if (!vivant) return;
      reponses.forEach((r, i) => {
        if (!r?.ok) return;
        if (r.alerte.statut === "en-route") noterStatutAlerteMiamSafe(cle, ids[i], "en-route", lireReponse(r.alerte.repondueLe));
        else if (r.alerte.statut === "sans-reponse") noterStatutAlerteMiamSafe(cle, ids[i], "sans-reponse", null);
      });
      setRelue(marque);
    };
    void relire([id, ...precedentes]);
    const minuterie = setInterval(() => {
      tour += 1;
      void relire(choisirAlertesDuTour(id, precedentes, tour));
    }, statut === "sans-reponse" ? RELECTURE_SANS_REPONSE_MS : RELECTURE_MS);
    return () => {
      vivant = false;
      clearInterval(minuterie);
    };
  }, [suivie, cle, miamSafe]);

  return { cle, alerte, aRelire: suivie !== null && relue !== repere };
}
