// « Envoyer à un pote » du compte connecté (voir routes/lieux-envoyes.ts) : un message « lieu » dans chaque discussion privée,
// lieux reçus et envoyés, « vus ». Les destinataires sont désignés par leur identifiant public ; ceux qu'on ne trouve pas,
// hors de ta bande ou avec qui il y a un blocage sont ignorés sans dire pourquoi.
import type { Request, Response } from "express";

import { MAX_DESTINATAIRES_LIEU } from "../../../../packages/commun/src/regles/chat.ts";
import { LONGUEUR_MAX_MOT_RECOMMANDATION } from "../../../../packages/commun/src/regles/potes.ts";
import { lireProfilSocialPose } from "../middlewares/profil-social.ts";
import { lireIdentifiant } from "../middlewares/proteger-pro.ts";
import type { ContexteRoutesSociales, DependancesSocialApp } from "../routes/social-app.ts";
import { lireCorps } from "./comptes-champs.ts";
import { ChampInvalide } from "./gestion/lire-champs.ts";
import { lireCurseurApres, lireIdClient, lireListeIdentifiantsPublics, lireTexteSocial, refuserSocial } from "./social-champs.ts";

/** Statut HTTP des refus de « Envoyer à un pote » (spécification sociale D.0, D.3) */
export const ERREURS_LIEUX_ENVOYES: Readonly<Record<string, number>> = { "lieu-inconnu": 404, "pas-dans-la-bande": 409 };

export function creerControleursLieuxEnvoyes(d: Pick<DependancesSocialApp, "messagerie" | "relations">, contexte: Pick<ContexteRoutesSociales, "horloge" | "appliquer">) {
  const moi = (reponse: Response) => lireProfilSocialPose(reponse).compteId;

  return {
    /** POST /app/lieux-envoyes { idClient, lieuId, a, mot? } : 201 envoyés, 200 envoi rejoué */
    async envoyer(requete: Request, reponse: Response) {
      const compteId = moi(reponse);
      const corps = lireCorps(requete);
      const idClient = lireIdClient(requete);
      const { lieuId } = corps;
      if (typeof lieuId !== "number" || !Number.isSafeInteger(lieuId) || lieuId < 1) throw new ChampInvalide("lieuId");
      const a = lireListeIdentifiantsPublics(corps, "a", MAX_DESTINATAIRES_LIEU);
      if (a.length === 0) throw new ChampInvalide("a");
      const mot = lireTexteSocial(corps, "mot", LONGUEUR_MAX_MOT_RECOMMANDATION, false);
      const trouves = await d.relations.trouverComptes(a, compteId);
      const versPublic = new Map([...trouves].map(([idPublic, id]) => [id, idPublic]));
      const r = await d.messagerie.envoyerLieu(compteId, idClient, lieuId, [...trouves.values()], mot, new Date(contexte.horloge()));
      if (!r.ok) throw refuserSocial(r.erreur, ERREURS_LIEUX_ENVOYES);
      await contexte.appliquer(r.effets);
      const ignores = [...a.filter((id) => !trouves.has(id)), ...r.ignores.flatMap((id) => versPublic.get(id) ?? [])];
      reponse.status(r.rejoue ? 200 : 201).json({ ok: true, envoyes: r.envoyes, ignores });
    },

    /** GET /app/lieux-envoyes/recus[?apres=] et /envoyes[?apres=] */
    lister(sens: "recus" | "envoyes") {
      return async (requete: Request, reponse: Response) => {
        const apres = lireCurseurApres(requete);
        const page = sens === "recus" ? await d.messagerie.listerLieuxRecus(moi(reponse), apres) : await d.messagerie.listerLieuxEnvoyes(moi(reponse), apres);
        reponse.json({ ok: true, ...page });
      };
    },

    /** PUT /app/lieux-envoyes/vus { jusqua } */
    async marquerVus(requete: Request, reponse: Response) {
      const jusqua = lireIdentifiant(lireCorps(requete).jusqua);
      if (jusqua === null) throw new ChampInvalide("jusqua");
      await d.messagerie.marquerLieuxVus(moi(reponse), jusqua);
      reponse.json({ ok: true });
    },
  };
}
