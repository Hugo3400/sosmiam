// Les listes de lieux du compte connecté (voir routes/listes.ts) : lecture de la demande, personnes par leur identifiant
// public, appel du service, effets appliqués (la cloche avant la réponse), puis la réponse. Les refus métier prennent leur
// statut dans ERREURS (refuserSocial).
import type { Request, Response } from "express";

import type { NouvelleListe } from "../../../../packages/commun/src/types/listes.ts";
import { validerNouvelleListe } from "../../../../packages/commun/src/validation/valider-nouvelle-liste.ts";
import { lireIdentifiantPublic } from "../fonctions/social/lire-identifiant-public.ts";
import { lireProfilSocialPose } from "../middlewares/profil-social.ts";
import { lireIdentifiant } from "../middlewares/proteger-pro.ts";
import type { ContexteRoutesSociales, DependancesSocialApp } from "../routes/social-app.ts";
import type { RefusListe } from "../services/listes-regles.ts";
import { lireCorps } from "./comptes-champs.ts";
import { ChampInvalide } from "./gestion/lire-champs.ts";
import { lireCurseurApres, lireIdClient, lirePersonne, refuserSocial, RefusSocial } from "./social-champs.ts";

/** Statut HTTP des refus métier de ce contrôleur (spécification sociale D.0, D.3) */
const ERREURS: Readonly<Record<string, number>> = {
  "liste-inconnue": 404, "lieu-inconnu": 404, "invitation-inconnue": 404, "personne-inconnue": 404, "reserve-a-l-auteur": 403,
  "trop-de-listes": 409, "liste-pleine": 409, "trop-de-co-auteurs": 409, "pas-dans-la-bande": 409,
};

/** Un refus du service : sa réponse JSON ; champ : celui d'un « champ-invalide » (s'abonner à sa liste, s'inviter soi-même) */
function refuser(erreur: RefusListe, champ = "id"): never {
  if (erreur === "cle-deja-prise") throw new ChampInvalide("idClient");
  if (erreur === "champ-invalide") throw new ChampInvalide(champ);
  throw refuserSocial(erreur, ERREURS);
}

/** Un identifiant de l'adresse (`:id`, `:lieuId`), sinon 400 champ-invalide { champ } */
function lireParametre(requete: Request, champ: "id" | "lieuId"): number {
  const id = lireIdentifiant(requete.params[champ]);
  if (id === null) throw new ChampInvalide(champ);
  return id;
}

/** Un refus de validerNouvelleListe : 400 message-refuse (mot interdit) ou 400 champ-invalide, avec son champ */
function refuserListe(r: { champ: string; raison?: "mot-interdit" }): never {
  throw r.raison === "mot-interdit" ? new RefusSocial("message-refuse", 400, r.champ) : new ChampInvalide(r.champ);
}

const CHAMPS_MODIFIABLES = ["titre", "emoji", "description", "visibilite"] as const satisfies readonly (keyof NouvelleListe)[];

export function creerControleursListes(d: Pick<DependancesSocialApp, "listes" | "relations">, contexte: Pick<ContexteRoutesSociales, "horloge" | "appliquer">) {
  const maintenant = () => new Date(contexte.horloge());
  const moi = (reponse: Response) => lireProfilSocialPose(reponse).compteId;

  return {
    /** GET /app/listes */
    async listerMiennes(_requete: Request, reponse: Response) {
      reponse.json({ ok: true, ...(await d.listes.listerMiennes(moi(reponse))) });
    },

    /** GET /app/listes/a-decouvrir[?apres=] */
    async listerADecouvrir(requete: Request, reponse: Response) {
      reponse.json({ ok: true, ...(await d.listes.listerADecouvrir(moi(reponse), lireCurseurApres(requete))) });
    },

    /** GET /app/listes/:id */
    async lire(requete: Request, reponse: Response) {
      const liste = await d.listes.lire(moi(reponse), lireParametre(requete, "id"));
      if (!liste) refuser("liste-inconnue");
      reponse.json({ ok: true, liste });
    },

    /** POST /app/listes { titre, emoji, description?, visibilite } (en-tête Idempotency-Key) */
    async creer(requete: Request, reponse: Response) {
      const cle = lireIdClient(requete);
      const lue = validerNouvelleListe(lireCorps(requete));
      if (!lue.ok) refuserListe(lue);
      const r = await d.listes.creer(moi(reponse), lue.liste, cle, maintenant());
      if (!r.ok) refuser(r.erreur);
      reponse.status(r.cree ? 201 : 200).json({ ok: true, liste: r.liste });
    },

    /** PATCH /app/listes/:id { titre?, emoji?, description?, visibilite? } : seuls les champs envoyés changent */
    async modifier(requete: Request, reponse: Response) {
      const id = lireParametre(requete, "id");
      const corps = lireCorps(requete);
      const envoyes = CHAMPS_MODIFIABLES.filter((champ) => corps[champ] !== undefined);
      // Les champs absents prennent une valeur qui passe : seuls ceux envoyés sont jugés, puis gardés
      const lue = validerNouvelleListe({ titre: "Liste", emoji: "🍽️", description: "", visibilite: "tous", ...Object.fromEntries(envoyes.map((c) => [c, corps[c]])) });
      if (!lue.ok) refuserListe(lue);
      const m: Partial<NouvelleListe> = Object.fromEntries(envoyes.map((c) => [c, lue.liste[c]]));
      const r = await d.listes.modifier(moi(reponse), id, m, maintenant());
      if (!r.ok) refuser(r.erreur);
      reponse.json({ ok: true, liste: r.liste });
    },

    /** DELETE /app/listes/:id */
    async supprimer(requete: Request, reponse: Response) {
      const r = await d.listes.supprimer(moi(reponse), lireParametre(requete, "id"));
      if (!r.ok) refuser(r.erreur);
      reponse.json({ ok: true });
    },

    /** PUT (oui) ou DELETE (non) /app/listes/:id/lieux/:lieuId */
    basculerLieu(oui: boolean) {
      return async (requete: Request, reponse: Response) => {
        const id = lireParametre(requete, "id");
        const r = await d.listes.basculerLieu(moi(reponse), id, lireParametre(requete, "lieuId"), oui, maintenant());
        if (!r.ok) refuser(r.erreur);
        reponse.json({ ok: true, liste: r.liste });
      };
    },

    /** POST /app/listes/:id/co-auteurs { personne } : un pote de ta bande */
    async inviterCoAuteur(requete: Request, reponse: Response) {
      const compteId = moi(reponse);
      const id = lireParametre(requete, "id");
      const idPublic = lireIdentifiantPublic(lireCorps(requete).personne);
      if (!idPublic) throw new ChampInvalide("personne");
      const invite = await d.relations.trouverCompte(idPublic, compteId);
      if (invite === null) refuser("personne-inconnue");
      const r = await d.listes.inviterCoAuteur(compteId, id, invite, maintenant());
      if (!r.ok) refuser(r.erreur, "personne");
      await contexte.appliquer(r.effets);
      reponse.status(201).json({ ok: true, liste: r.liste });
    },

    /** POST /app/listes/:id/co-auteurs/moi/accepter */
    async accepterCoAuteur(requete: Request, reponse: Response) {
      const r = await d.listes.accepterCoAuteur(moi(reponse), lireParametre(requete, "id"), maintenant());
      if (!r.ok) refuser(r.erreur);
      reponse.json({ ok: true, liste: r.liste });
    },

    /** DELETE /app/listes/:id/co-auteurs/:personne (« moi » : refuser l'invitation, ou ne plus remplir la liste) */
    async retirerCoAuteur(requete: Request, reponse: Response) {
      const compteId = moi(reponse);
      const id = lireParametre(requete, "id");
      const membre = requete.params.personne === "moi" ? ("moi" as const) : await lirePersonne(requete, d.relations, compteId);
      const r = await d.listes.retirerCoAuteur(compteId, id, membre, maintenant());
      if (!r.ok) refuser(r.erreur, "personne");
      reponse.json({ ok: true });
    },

    /** PUT (suivre) ou DELETE (ne plus suivre) /app/listes/:id/abonnement */
    suivre(oui: boolean) {
      return async (requete: Request, reponse: Response) => {
        const r = await d.listes.basculerAbonnement(moi(reponse), lireParametre(requete, "id"), oui, maintenant());
        if (!r.ok) refuser(r.erreur);
        reponse.json({ ok: true, liste: r.liste });
      };
    },
  };
}
