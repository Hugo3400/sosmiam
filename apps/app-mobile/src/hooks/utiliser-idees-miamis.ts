import { useCallback, useRef, useState } from "react";

import type { ServiceCommunaute } from "@sos-miam/commun/client-api/contrat-communaute";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { IdeeMiamis, NouvelleIdee } from "@sos-miam/commun/types/idees";
import { basculerVoteIdee } from "~/fonctions/idees-miamis/basculer-vote-idee";
import { changerIdeeDansListe } from "~/fonctions/idees-miamis/changer-idee-dans-liste";
import { utiliserGesteCommunaute } from "~/hooks/utiliser-geste-communaute";
import { utiliserLectureCommunaute } from "~/hooks/utiliser-lecture-communaute";

export type IdeesMiamis = {
  idees: IdeeMiamis[] | null;
  chargement: boolean;
  erreur: ErreurService | null;
  envoi: boolean;
  votesEnCours: ReadonlySet<string>;
  relire: () => Promise<void>;
  voter: (id: string, oui: boolean) => Promise<ErreurService | null>;
  proposer: (idee: NouvelleIdee, cle: string) => Promise<ErreurService | null>;
};

const lireIdees = (service: ServiceCommunaute) => service.listerIdees();

export function utiliserIdeesMiamis(): IdeesMiamis {
  const { donnees, chargement, erreur, relire, remplacer } = utiliserLectureCommunaute(lireIdees);
  const { enCours, agir } = utiliserGesteCommunaute();
  const votes = useRef(new Set<string>());
  const [votesEnCours, setVotesEnCours] = useState<ReadonlySet<string>>(() => new Set());

  const noterVote = useCallback((id: string, enCoursDeVote: boolean) => {
    if (enCoursDeVote) votes.current.add(id);
    else votes.current.delete(id);
    setVotesEnCours(new Set(votes.current));
  }, []);

  const changer = useCallback(
    (id: string, transformer: (idee: IdeeMiamis) => IdeeMiamis) => remplacer((d) => ({ ...d, idees: changerIdeeDansListe(d.idees, id, transformer) })),
    [remplacer],
  );

  const voter = useCallback(
    async (id: string, oui: boolean) => {
      if (votes.current.has(id)) return null;
      noterVote(id, true);
      changer(id, (idee) => basculerVoteIdee(idee, oui));
      const resultat = await agir(`vote-${id}`, (s) => s.voterIdee(id, oui));
      noterVote(id, false);
      if (resultat.ok) {
        changer(id, () => resultat.reponse.idee);
        return null;
      }
      changer(id, (idee) => basculerVoteIdee(idee, !oui));
      return resultat.erreur;
    },
    [agir, changer, noterVote],
  );

  const proposer = useCallback(
    async (idee: NouvelleIdee, cle: string) => {
      const resultat = await agir("proposer", (s) => s.proposerIdee(idee, cle));
      if (!resultat.ok) return resultat.erreur;
      const nouvelle = resultat.reponse.idee;
      remplacer((d) => ({ ...d, idees: [nouvelle, ...d.idees.filter((i) => i.id !== nouvelle.id)] }));
      return null;
    },
    [agir, remplacer],
  );

  return {
    idees: donnees?.idees ?? null,
    chargement,
    erreur,
    envoi: enCours === "proposer",
    votesEnCours,
    relire,
    voter,
    proposer,
  };
}
