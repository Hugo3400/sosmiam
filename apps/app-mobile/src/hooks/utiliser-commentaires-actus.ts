import { useCallback, useEffect, useState } from "react";

import { MESSAGES_SERVICE_PAR_LANGUE } from "@sos-miam/commun/contenus/messages-services";
import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { CommentaireActus } from "@sos-miam/commun/types/actus";
import { commentairesActusExemples } from "~/contenus/actus-exemples";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserServiceActus } from "~/hooks/utiliser-service-actus";

type EtatCommentaires = { articleId: number; liste: CommentaireActus[]; suite: number | null };

export function utiliserCommentairesActus(articleId: number, exemple: boolean) {
  const { service } = utiliserServiceActus();
  const { langue } = utiliserLangue();
  const [etat, setEtat] = useState<EtatCommentaires | null>(null);

  useEffect(() => {
    if (exemple) return setEtat({ articleId, liste: commentairesActusExemples[articleId] ?? [], suite: null });
    let actif = true;
    void service.commentaires(articleId, null).then((r) => {
      if (actif) setEtat({ articleId, liste: r.ok ? r.commentaires : [], suite: r.ok ? r.suite : null });
    });
    return () => {
      actif = false;
    };
  }, [service, articleId, exemple]);

  const chargerSuite = useCallback(async () => {
    if (!etat?.suite || exemple) return;
    const r = await service.commentaires(articleId, etat.suite);
    if (r.ok) setEtat((e) => (e ? { ...e, liste: [...e.liste, ...r.commentaires], suite: r.suite } : e));
  }, [etat, exemple, service, articleId]);

  const envoyer = useCallback(async (texte: string, reponseA: number | null): Promise<string | null> => {
    if (exemple) return null;
    const r = await service.commenter(articleId, texte, reponseA);
    if (!r.ok) {
      const message = choisirTextes(MESSAGES_SERVICE_PAR_LANGUE, langue)[r.erreur];
      return `${message.titre}. ${message.texte}`;
    }
    setEtat((e) => (e ? { ...e, liste: [...e.liste, r.commentaire] } : e));
    return null;
  }, [exemple, service, articleId, langue]);

  const supprimer = useCallback(async (id: number) => {
    if (exemple) return;
    const r = await service.supprimerCommentaire(id);
    if (!r.ok) return;
    setEtat((e) => {
      if (!e) return e;
      const aDesReponses = e.liste.some((c) => c.reponseA === id);
      return { ...e, liste: aDesReponses ? e.liste.map((c) => (c.id === id ? { ...c, texte: "", supprime: true } : c)) : e.liste.filter((c) => c.id !== id) };
    });
  }, [exemple, service]);

  const pret = etat?.articleId === articleId;
  return { commentaires: pret ? etat.liste : [], aUneSuite: pret && etat.suite !== null, chargerSuite, envoyer, supprimer };
}
