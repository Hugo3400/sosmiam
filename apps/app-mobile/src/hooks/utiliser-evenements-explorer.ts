import { useEffect, useMemo, useState } from "react";

import type { EvenementLieuPublic } from "@sos-miam/commun/types/evenement";
import type { PeriodeEvenements } from "~/contenus/type-filtres-explorer";
import { calculerPeriodeEvenements } from "~/fonctions/dates/calculer-periode-evenements";
import { utiliserSession } from "~/hooks/utiliser-session";
import { DEMO_VISITES_ACTIVE } from "~/services/demo/demo-visites-active";
import { listerEvenementsPublicsDemo } from "~/services/demo/lieu-pro-demo";

/**
 * Le filtre « Événements » d'Explorer : le premier événement de chaque lieu sur la période (ce soir, ce week-end), lu sans
 * compte (démo : ceux joués sur le téléphone). null tant que le filtre est coupé ou pas encore lu. En visite sans compte (âge
 * inconnu), jamais un événement avec alcool.
 */
export function utiliserEvenementsExplorer(periode: PeriodeEvenements | null, age: number | null): Map<number, EvenementLieuPublic> | null {
  const { contenu } = utiliserSession();
  const [lus, setLus] = useState<{ periode: PeriodeEvenements; evenements: EvenementLieuPublic[] } | null>(null);

  useEffect(() => {
    if (!periode) return;
    let actif = true;
    const { du, au } = calculerPeriodeEvenements(periode);
    const lire = DEMO_VISITES_ACTIVE
      ? Promise.resolve({ ok: true as const, evenements: listerEvenementsPublicsDemo(null, Date.now()).filter((e) => Date.parse(e.debut) < au.getTime() && Date.parse(e.fin ?? e.debut) >= du.getTime()) })
      : contenu.listerEvenements({ du: du.toISOString(), au: au.toISOString() });
    lire.then((r) => actif && setLus({ periode, evenements: r.ok ? r.evenements : [] }));
    return () => {
      actif = false;
    };
  }, [contenu, periode]);

  return useMemo(() => {
    if (!periode || lus?.periode !== periode) return null;
    const parLieu = new Map<number, EvenementLieuPublic>();
    for (const e of lus.evenements) if ((age !== null || !e.alcool) && !parLieu.has(e.lieu.id)) parLieu.set(e.lieu.id, e);
    return parLieu;
  }, [lus, periode, age]);
}
