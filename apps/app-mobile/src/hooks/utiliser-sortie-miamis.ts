import { useCallback } from "react";

import type { ServiceCommunaute } from "@sos-miam/commun/client-api/contrat-communaute";
import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import type { SortieMiamisApi } from "@sos-miam/commun/types/communaute";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { utiliserGesteCommunaute } from "~/hooks/utiliser-geste-communaute";
import { utiliserLectureCommunaute } from "~/hooks/utiliser-lecture-communaute";

type AppelSortie = (service: ServiceCommunaute) => Promise<ReponseApi<{ sortie: SortieMiamisApi }>>;

export function utiliserSortieMiamis(id: string) {
  const lecture = utiliserLectureCommunaute((s) => s.lireSortie(id));
  const { agir, enCours } = utiliserGesteCommunaute();
  const remplacer = lecture.remplacer;

  const geste = useCallback(
    async (nom: string, appel: AppelSortie): Promise<ErreurService | null> => {
      const r = await agir(nom, appel);
      if (!r.ok) return r.erreur;
      remplacer(() => ({ sortie: r.reponse.sortie }));
      return null;
    },
    [agir, remplacer],
  );

  const annuler = useCallback(async (): Promise<ErreurService | null> => {
    const r = await agir("annuler", (s) => s.annulerSortie(id));
    return r.ok ? null : r.erreur;
  }, [agir, id]);

  return {
    sortie: lecture.donnees?.sortie ?? null,
    chargement: lecture.chargement,
    erreur: lecture.erreur,
    relire: lecture.relire,
    enCours,
    demanderAVenir: () => geste("venir", (s) => s.demanderAVenir(id)),
    annulerDemande: () => geste("annuler-demande", (s) => s.annulerDemande(id)),
    quitter: () => geste("quitter", (s) => s.quitterSortie(id)),
    accepter: (personne: string) => geste(`accepter-${personne}`, (s) => s.accepterArrivee(id, personne)),
    refuser: (personne: string) => geste(`refuser-${personne}`, (s) => s.refuserArrivee(id, personne)),
    retirer: (personne: string) => geste(`retirer-${personne}`, (s) => s.retirerParticipant(id, personne)),
    validerPresence: () => geste("presence", (s) => s.validerPresence(id)),
    annuler,
  };
}
