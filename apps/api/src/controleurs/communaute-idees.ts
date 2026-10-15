import type { Request, Response } from "express";

import { LONGUEUR_MAX_COMMENTAIRE_IDEE } from "../../../../packages/commun/src/regles/communaute.ts";
import { validerNouvelleIdee } from "../../../../packages/commun/src/validation/valider-nouvelle-idee.ts";
import type { NouvelleIdee } from "../../../../packages/commun/src/types/idees.ts";
import { lireIdentifiant } from "../middlewares/proteger-pro.ts";
import type { ServicesCommunaute } from "../services/communaute-regles.ts";
import type { ContexteRoutesSociales, DependancesSocialApp } from "../routes/social-app.ts";
import { lireCorps } from "./comptes-champs.ts";
import { lireParametre, moi, refuserCommunaute, repondreCommunaute } from "./communaute-champs.ts";
import { ChampInvalide } from "./gestion/lire-champs.ts";
import { lireIdClient, lireTexteSocial, refuserSocial, RefusSocial } from "./social-champs.ts";

const IDEE_REJOUEE: NouvelleIdee = { titre: "", detail: "" };

function lireReponseA(corps: Record<string, unknown>): number | null {
  const brut = corps.reponseA;
  if (brut === undefined || brut === null) return null;
  const id = lireIdentifiant(brut);
  if (id === null) throw new ChampInvalide("reponseA");
  return id;
}

export function creerControleursIdees(
  communaute: ServicesCommunaute, d: Pick<DependancesSocialApp, "relations">, contexte: Pick<ContexteRoutesSociales, "horloge" | "appliquer">,
) {
  const maintenant = () => new Date(contexte.horloge());
  const idees = communaute.idees;

  return {
    async lister(_requete: Request, reponse: Response) {
      reponse.json({ ok: true, idees: await idees.lister(moi(reponse)) });
    },

    async lire(requete: Request, reponse: Response) {
      const lue = await idees.lire(moi(reponse), lireParametre(requete, "id"));
      if (!lue) throw refuserSocial("idee-inconnue");
      reponse.json({ ok: true, ...lue });
    },

    async proposer(requete: Request, reponse: Response) {
      const compteId = moi(reponse);
      const cle = lireIdClient(requete);
      let nouvelle = IDEE_REJOUEE;
      if ((await d.relations.lireIdempotence(compteId, cle, "idee")) === null) {
        const lue = validerNouvelleIdee(lireCorps(requete));
        if (!lue.ok) throw lue.raison === "mot-interdit" ? new RefusSocial("message-refuse", 400, lue.champ) : new ChampInvalide(lue.champ);
        nouvelle = lue.idee;
      }
      const r = await idees.proposer(compteId, nouvelle, cle, maintenant());
      if (!r.ok) return refuserCommunaute(reponse, r);
      reponse.status(r.cree ? 201 : 200).json({ ok: true, idee: r.idee });
    },

    async retirer(requete: Request, reponse: Response) {
      await repondreCommunaute(reponse, contexte.appliquer, await idees.retirer(moi(reponse), lireParametre(requete, "id")), () => ({}));
    },

    voter(oui: boolean) {
      return async (requete: Request, reponse: Response) => {
        const r = await idees.voter(moi(reponse), lireParametre(requete, "id"), oui, maintenant());
        await repondreCommunaute(reponse, contexte.appliquer, r, (ok) => ({ idee: ok.idee }));
      };
    },

    async commenter(requete: Request, reponse: Response) {
      const corps = lireCorps(requete);
      const texte = lireTexteSocial(corps, "texte", LONGUEUR_MAX_COMMENTAIRE_IDEE, true);
      const r = await idees.commenter(moi(reponse), lireParametre(requete, "id"), texte, lireReponseA(corps), maintenant());
      await repondreCommunaute(reponse, contexte.appliquer, r, (ok) => ({ commentaire: ok.commentaire }), 201);
    },

    async supprimerCommentaire(requete: Request, reponse: Response) {
      await repondreCommunaute(reponse, contexte.appliquer, await idees.supprimerCommentaire(moi(reponse), lireParametre(requete, "id")), () => ({}));
    },

    aimerCommentaire(oui: boolean) {
      return async (requete: Request, reponse: Response) => {
        const r = await idees.aimerCommentaire(moi(reponse), lireParametre(requete, "id"), oui, maintenant());
        await repondreCommunaute(reponse, contexte.appliquer, r, (ok) => ({ commentaire: ok.commentaire }));
      };
    },
  };
}
