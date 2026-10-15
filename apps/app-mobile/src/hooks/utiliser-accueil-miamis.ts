import { useCallback } from "react";

import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { utiliserGesteCommunaute } from "~/hooks/utiliser-geste-communaute";
import { utiliserLectureCommunaute } from "~/hooks/utiliser-lecture-communaute";

export function utiliserAccueilMiamis() {
  const sorties = utiliserLectureCommunaute((s) => s.listerSorties());
  const quiEstLa = utiliserLectureCommunaute((s) => s.lireQuiEstLa());
  const idees = utiliserLectureCommunaute((s) => s.listerIdees());
  const fil = utiliserLectureCommunaute((s) => s.lireFil());
  const { agir, enCours } = utiliserGesteCommunaute();
  const remplacerSortie = sorties.remplacer;
  const remplacerIdees = idees.remplacer;

  const demanderAVenir = useCallback(
    async (id: string): Promise<ErreurService | null> => {
      const r = await agir(`venir-${id}`, (s) => s.demanderAVenir(id));
      if (!r.ok) return r.erreur;
      remplacerSortie((d) => ({ ...d, sorties: d.sorties.map((x) => (x.id === id ? r.reponse.sortie : x)) }));
      return null;
    },
    [agir, remplacerSortie],
  );

  const voterIdee = useCallback(
    async (id: string, oui: boolean): Promise<ErreurService | null> => {
      remplacerIdees((d) => ({ ...d, idees: d.idees.map((i) => (i.id === id ? { ...i, aVote: oui, votes: Math.max(0, i.votes + (oui ? 1 : -1)) } : i)) }));
      const r = await agir(`vote-${id}`, (s) => s.voterIdee(id, oui));
      if (r.ok) {
        remplacerIdees((d) => ({ ...d, idees: d.idees.map((i) => (i.id === id ? r.reponse.idee : i)) }));
        return null;
      }
      remplacerIdees((d) => ({ ...d, idees: d.idees.map((i) => (i.id === id ? { ...i, aVote: !oui, votes: Math.max(0, i.votes + (oui ? -1 : 1)) } : i)) }));
      return r.erreur;
    },
    [agir, remplacerIdees],
  );

  const relireSorties = sorties.relire;
  const relireQuiEstLa = quiEstLa.relire;
  const relireIdees = idees.relire;
  const relireFil = fil.relire;
  const relireTout = useCallback(
    () => Promise.all([relireSorties(), relireQuiEstLa(), relireIdees(), relireFil()]).then(() => undefined),
    [relireSorties, relireQuiEstLa, relireIdees, relireFil],
  );

  return { sorties, quiEstLa, idees, fil, demanderAVenir, voterIdee, enCours, relireTout };
}
