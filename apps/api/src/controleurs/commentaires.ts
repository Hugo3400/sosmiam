// Les commentaires des publications (voir routes/commentaires.ts). La liste d'une publication se lit sans compte (cache
// public de 30 s) ; tout le reste a une session. Les refus métier ont leur statut dans ERREURS (spécification sociale D.3).
import type { Request, Response } from "express";

import { LONGUEUR_MAX_COMMENTAIRE } from "../../../../packages/commun/src/regles/mots-interdits.ts";
import { lireProfilSocialPose } from "../middlewares/profil-social.ts";
import { lireIdentifiant } from "../middlewares/proteger-pro.ts";
import type { DependancesSocialApp } from "../routes/social-app.ts";
import type { AppliquerEffetsSociaux } from "../services/effets-sociaux-regles.ts";
import { lireCorps } from "./comptes-champs.ts";
import { ChampInvalide } from "./gestion/lire-champs.ts";
import { lireCurseurApres, lireTexteSocial, refuserSocial } from "./social-champs.ts";

/** Statut HTTP des refus métier de ce contrôleur */
const ERREURS: Readonly<Record<string, number>> = {
  "publication-inconnue": 404, "commentaire-inconnu": 404, "reserve-a-l-auteur": 403, "reserve-au-gerant": 403, "deja-examine": 409,
};

/** Un identifiant d'adresse (/^[1-9]\d{0,8}$/), sinon 400 champ-invalide { champ } */
function lireId(requete: Request, champ: string): number {
  const id = lireIdentifiant(requete.params[champ]);
  if (id === null) throw new ChampInvalide(champ);
  return id;
}

export function creerControleursCommentaires(d: Pick<DependancesSocialApp, "commentaires">, horloge: () => number, appliquer: AppliquerEffetsSociaux) {
  const maintenant = () => new Date(horloge());
  const moi = (reponse: Response) => lireProfilSocialPose(reponse).compteId;

  return {
    /** GET /app/commentaires/publications/:publicationId[?apres=] (sans session) */
    async lister(requete: Request, reponse: Response) {
      const publicationId = lireId(requete, "publicationId");
      const page = await d.commentaires.listerPublics(publicationId, lireCurseurApres(requete), maintenant());
      if (!page) throw refuserSocial("publication-inconnue", ERREURS);
      reponse.set("Cache-Control", "public, max-age=30").json({ ok: true, ...page });
    },

    /** GET /app/commentaires/publications/:publicationId/moi */
    async lireMiens(requete: Request, reponse: Response) {
      const publicationId = lireId(requete, "publicationId");
      const mesCommentaires = await d.commentaires.lireMiens(moi(reponse), publicationId, maintenant());
      if (!mesCommentaires) throw refuserSocial("publication-inconnue", ERREURS);
      reponse.json({ ok: true, moi: mesCommentaires });
    },

    /** POST /app/commentaires/publications/:publicationId { texte, reponseA?, commeLieu? } */
    async commenter(requete: Request, reponse: Response) {
      const publicationId = lireId(requete, "publicationId");
      const corps = lireCorps(requete);
      const texte = lireTexteSocial(corps, "texte", LONGUEUR_MAX_COMMENTAIRE, true);
      let reponseA: number | null = null;
      if (corps.reponseA !== undefined && corps.reponseA !== null) {
        reponseA = lireIdentifiant(corps.reponseA);
        if (reponseA === null) throw new ChampInvalide("reponseA");
      }
      if (corps.commeLieu !== undefined && typeof corps.commeLieu !== "boolean") throw new ChampInvalide("commeLieu");
      const r = await d.commentaires.commenter(moi(reponse), publicationId, { texte, reponseA, commeLieu: corps.commeLieu === true }, maintenant());
      if (!r.ok) throw refuserSocial(r.erreur, ERREURS);
      await appliquer(r.effets);
      reponse.status(201).json({ ok: true, commentaire: r.commentaire });
    },

    /** PATCH /app/commentaires/:id { texte } */
    async modifier(requete: Request, reponse: Response) {
      const id = lireId(requete, "id");
      const texte = lireTexteSocial(lireCorps(requete), "texte", LONGUEUR_MAX_COMMENTAIRE, true);
      const r = await d.commentaires.modifier(moi(reponse), id, texte, maintenant());
      if (!r.ok) throw refuserSocial(r.erreur, ERREURS);
      await appliquer(r.effets);
      reponse.json({ ok: true, commentaire: r.commentaire });
    },

    /** DELETE /app/commentaires/:id */
    async supprimer(requete: Request, reponse: Response) {
      const r = await d.commentaires.supprimer(moi(reponse), lireId(requete, "id"), maintenant());
      if (!r.ok) throw refuserSocial(r.erreur, ERREURS);
      reponse.json({ ok: true });
    },

    /** PUT et DELETE /app/commentaires/:id/jaime */
    aimer(oui: boolean) {
      return async (requete: Request, reponse: Response) => {
        const r = await d.commentaires.basculerJaime(moi(reponse), lireId(requete, "id"), oui, maintenant());
        if (!r.ok) throw refuserSocial(r.erreur, ERREURS);
        reponse.json({ ok: true, jaimes: r.jaimes });
      };
    },

    /** PUT et DELETE /app/commentaires/:id/masque (le gérant du lieu de la publication) */
    masquer(masque: boolean) {
      return async (requete: Request, reponse: Response) => {
        const r = await d.commentaires.masquerParLieu(moi(reponse), lireId(requete, "id"), masque, maintenant());
        if (!r.ok) throw refuserSocial(r.erreur, ERREURS);
        await appliquer(r.effets);
        reponse.json({ ok: true });
      };
    },
  };
}
