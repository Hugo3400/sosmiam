import { useCallback } from "react";

import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { utiliserGesteCommunaute } from "~/hooks/utiliser-geste-communaute";
import { utiliserLectureCommunaute } from "~/hooks/utiliser-lecture-communaute";

export function utiliserAccueilMiamis() {
  const sorties = utiliserLectureCommunaute((s) => s.listerSorties());
  const quiEstLa = utiliserLectureCommunaute((s) => s.lireQuiEstLa());
  const fil = utiliserLectureCommunaute((s) => s.lireFil());
  const { agir, enCours } = utiliserGesteCommunaute();
  const remplacerSortie = sorties.remplacer;

  const demanderAVenir = useCallback(
    async (id: string): Promise<ErreurService | null> => {
      const r = await agir(`venir-${id}`, (s) => s.demanderAVenir(id));
      if (!r.ok) return r.erreur;
      remplacerSortie((d) => ({ ...d, sorties: d.sorties.map((x) => (x.id === id ? r.reponse.sortie : x)) }));
      return null;
    },
    [agir, remplacerSortie],
  );

  const relireSorties = sorties.relire;
  const relireQuiEstLa = quiEstLa.relire;
  const relireFil = fil.relire;
  const relireTout = useCallback(
    () => Promise.all([relireSorties(), relireQuiEstLa(), relireFil()]).then(() => undefined),
    [relireSorties, relireQuiEstLa, relireFil],
  );

  return { sorties, quiEstLa, fil, demanderAVenir, enCours, relireTout };
}
