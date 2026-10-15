import { useCallback, useRef } from "react";

import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { CommentaireIdee, IdeeMiamis } from "@sos-miam/commun/types/idees";
import { basculerJaimeCommentaireIdee } from "~/fonctions/idees-miamis/basculer-jaime-commentaire-idee";
import { basculerVoteIdee } from "~/fonctions/idees-miamis/basculer-vote-idee";
import { utiliserGesteCommunaute } from "~/hooks/utiliser-geste-communaute";
import { utiliserLectureCommunaute } from "~/hooks/utiliser-lecture-communaute";

export type IdeeMiamisOuverte = {
  idee: IdeeMiamis | null;
  commentaires: CommentaireIdee[];
  chargement: boolean;
  erreur: ErreurService | null;
  voteEnCours: boolean;
  envoiCommentaire: boolean;
  relire: () => Promise<void>;
  voter: (oui: boolean) => Promise<ErreurService | null>;
  commenter: (texte: string, reponseA: string | null) => Promise<ErreurService | null>;
  aimer: (commentaireId: string, oui: boolean) => Promise<ErreurService | null>;
  supprimerCommentaire: (commentaireId: string) => Promise<ErreurService | null>;
  retirer: () => Promise<ErreurService | null>;
};

const AUCUN_COMMENTAIRE: CommentaireIdee[] = [];

export function utiliserIdeeMiamis(id: string): IdeeMiamisOuverte {
  const { donnees, chargement, erreur, relire, remplacer } = utiliserLectureCommunaute((s) => s.lireIdee(id));
  const { enCours, agir } = utiliserGesteCommunaute();
  const jaimes = useRef(new Set<string>());
  const vote = useRef(false);

  const changerIdee = useCallback((transformer: (idee: IdeeMiamis) => IdeeMiamis) => remplacer((d) => ({ ...d, idee: transformer(d.idee) })), [remplacer]);
  const changerCommentaires = useCallback(
    (transformer: (commentaires: CommentaireIdee[]) => CommentaireIdee[]) => remplacer((d) => ({ ...d, commentaires: transformer(d.commentaires) })),
    [remplacer],
  );

  const voter = useCallback(
    async (oui: boolean) => {
      if (vote.current) return null;
      vote.current = true;
      changerIdee((idee) => basculerVoteIdee(idee, oui));
      const resultat = await agir("vote", (s) => s.voterIdee(id, oui));
      vote.current = false;
      if (resultat.ok) {
        changerIdee(() => resultat.reponse.idee);
        return null;
      }
      changerIdee((idee) => basculerVoteIdee(idee, !oui));
      return resultat.erreur;
    },
    [agir, changerIdee, id],
  );

  const commenter = useCallback(
    async (texte: string, reponseA: string | null) => {
      const resultat = await agir("commenter", (s) => s.commenterIdee(id, texte, reponseA));
      if (!resultat.ok) return resultat.erreur;
      const nouveau = resultat.reponse.commentaire;
      changerCommentaires((liste) => [...liste.filter((c) => c.id !== nouveau.id), nouveau]);
      changerIdee((idee) => ({ ...idee, commentaires: idee.commentaires + 1 }));
      return null;
    },
    [agir, changerCommentaires, changerIdee, id],
  );

  const aimer = useCallback(
    async (commentaireId: string, oui: boolean) => {
      if (jaimes.current.has(commentaireId)) return null;
      jaimes.current.add(commentaireId);
      const basculer = (valeur: boolean) => changerCommentaires((liste) => liste.map((c) => (c.id === commentaireId ? basculerJaimeCommentaireIdee(c, valeur) : c)));
      basculer(oui);
      const resultat = await agir(`jaime-${commentaireId}`, (s) => s.aimerCommentaireIdee(commentaireId, oui));
      jaimes.current.delete(commentaireId);
      if (resultat.ok) {
        changerCommentaires((liste) => liste.map((c) => (c.id === commentaireId ? resultat.reponse.commentaire : c)));
        return null;
      }
      basculer(!oui);
      return resultat.erreur;
    },
    [agir, changerCommentaires],
  );

  const supprimerCommentaire = useCallback(
    async (commentaireId: string) => {
      const resultat = await agir(`suppression-${commentaireId}`, (s) => s.supprimerCommentaireIdee(commentaireId));
      if (!resultat.ok) return resultat.erreur;
      changerCommentaires((liste) => liste.filter((c) => c.id !== commentaireId));
      changerIdee((idee) => ({ ...idee, commentaires: Math.max(0, idee.commentaires - 1) }));
      return null;
    },
    [agir, changerCommentaires, changerIdee],
  );

  const retirer = useCallback(async () => {
    const resultat = await agir("retrait", (s) => s.retirerIdee(id));
    return resultat.ok ? null : resultat.erreur;
  }, [agir, id]);

  return {
    idee: donnees?.idee ?? null,
    commentaires: donnees?.commentaires ?? AUCUN_COMMENTAIRE,
    chargement,
    erreur,
    voteEnCours: enCours === "vote",
    envoiCommentaire: enCours === "commenter",
    relire,
    voter,
    commenter,
    aimer,
    supprimerCommentaire,
    retirer,
  };
}
