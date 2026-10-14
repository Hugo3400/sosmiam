// Les sorties du compte connecté (voir routes/sorties.ts) : lecture de la demande, invités résolus par leur identifiant
// public (jamais l'id d'un compte), appel du service, effets appliqués (la cloche avant la réponse, le téléphone après),
// puis la réponse. Les refus métier prennent leur statut dans ERREURS (refuserSocial).
import type { Request, Response } from "express";

import { MAX_PARTICIPANTS_SORTIE } from "../../../../packages/commun/src/regles/potes.ts";
import { validerNouvelleSortie } from "../../../../packages/commun/src/validation/valider-nouvelle-sortie.ts";
import { lireIdentifiantPublic } from "../fonctions/social/lire-identifiant-public.ts";
import { lireProfilSocialPose } from "../middlewares/profil-social.ts";
import { lireIdentifiant } from "../middlewares/proteger-pro.ts";
import type { ContexteRoutesSociales, DependancesSocialApp } from "../routes/social-app.ts";
import type { NouvelleSortie, RefusSortie } from "../services/sorties-regles.ts";
import { lireCorps } from "./comptes-champs.ts";
import { ChampInvalide } from "./gestion/lire-champs.ts";
import { lireIdClient, lireListeIdentifiantsPublics, refuserSocial, RefusSocial } from "./social-champs.ts";

/** Statut HTTP des refus métier de ce contrôleur (spécification sociale D.0, D.3) */
const ERREURS: Readonly<Record<string, number>> = {
  "sortie-inconnue": 404, "lieu-inconnu": 404, "personne-inconnue": 404, "reserve-a-l-organisateur": 403, "sortie-passee": 409,
  "sortie-pleine": 409, "vote-termine": 409, "max-propositions": 409, "pas-dans-la-bande": 409, "trop-de-sorties": 409,
};

/** Un refus du service : sa réponse JSON (une clé déjà prise pour autre chose : 400 champ-invalide { champ: "idClient" }) */
function refuser(erreur: RefusSortie): never {
  if (erreur === "cle-deja-prise") throw new ChampInvalide("idClient");
  throw refuserSocial(erreur, ERREURS);
}

/** Un identifiant de l'adresse (`:id`, `:lieuId`), sinon 400 champ-invalide { champ } */
function lireParametre(requete: Request, champ: "id" | "lieuId"): number {
  const id = lireIdentifiant(requete.params[champ]);
  if (id === null) throw new ChampInvalide(champ);
  return id;
}

/** Une sortie déjà créée avec cette clé : le service la rend sans relire ces champs (aucun n'est utilisé) */
const SORTIE_REJOUEE: NouvelleSortie = { titre: "", emoji: "", quand: new Date(0), finVote: new Date(0), invites: [], lieux: [] };

export function creerControleursSorties(d: Pick<DependancesSocialApp, "sorties" | "relations">, contexte: Pick<ContexteRoutesSociales, "horloge" | "appliquer">) {
  const maintenant = () => new Date(contexte.horloge());
  const moi = (reponse: Response) => lireProfilSocialPose(reponse).compteId;

  /** Des identifiants publics aux comptes : un seul inconnu (ou qui t'a bloqué) et c'est « pas dans ta bande », comme un inconnu */
  async function lireInvites(compteId: number, idsPublics: readonly string[]): Promise<number[]> {
    const comptes = await d.relations.trouverComptes(idsPublics, compteId);
    if (comptes.size !== idsPublics.length) refuser("pas-dans-la-bande");
    return idsPublics.map((id) => comptes.get(id)!);
  }

  return {
    /** GET /app/sorties */
    async lister(_requete: Request, reponse: Response) {
      reponse.json({ ok: true, ...(await d.sorties.lister(moi(reponse), maintenant())) });
    },

    /** GET /app/sorties/:id[?version=<n>] */
    async lire(requete: Request, reponse: Response) {
      const id = lireParametre(requete, "id");
      const brut = requete.query.version;
      if (brut !== undefined && (typeof brut !== "string" || !/^\d{1,9}$/.test(brut))) throw new ChampInvalide("version");
      const lue = await d.sorties.lire(moi(reponse), id, brut === undefined ? null : Number(brut), maintenant());
      if (!lue) refuser("sortie-inconnue");
      reponse.json({ ok: true, ...lue });
    },

    /** POST /app/sorties { titre, emoji, quand, finVote, invites, lieux } (en-tête Idempotency-Key) */
    async creer(requete: Request, reponse: Response) {
      const compteId = moi(reponse);
      const cle = lireIdClient(requete);
      const quand = maintenant();
      let nouvelle = SORTIE_REJOUEE;
      // Rejouée (la réponse s'était perdue) : la sortie déjà créée revient, même si ses dates ne passeraient plus
      if ((await d.relations.lireIdempotence(compteId, cle, "sortie")) === null) {
        const lue = validerNouvelleSortie(lireCorps(requete), quand);
        if (!lue.ok) throw lue.raison === "mot-interdit" ? new RefusSocial("message-refuse", 400, lue.champ) : new ChampInvalide(lue.champ);
        const { titre, emoji, invites, lieux } = lue.sortie;
        nouvelle = { titre, emoji, quand: new Date(lue.sortie.quand), finVote: new Date(lue.sortie.finVote), invites: await lireInvites(compteId, invites), lieux };
      }
      const r = await d.sorties.creer(compteId, nouvelle, cle, quand);
      if (!r.ok) refuser(r.erreur);
      await contexte.appliquer(r.effets);
      reponse.status(r.cree ? 201 : 200).json({ ok: true, sortie: r.sortie });
    },

    /** POST /app/sorties/:id/reponse { vient: boolean } */
    async repondre(requete: Request, reponse: Response) {
      const id = lireParametre(requete, "id");
      const vient = lireCorps(requete).vient;
      if (typeof vient !== "boolean") throw new ChampInvalide("vient");
      const r = await d.sorties.repondre(moi(reponse), id, vient, maintenant());
      if (!r.ok) refuser(r.erreur);
      reponse.json(r.sortie ? { ok: true, sortie: r.sortie } : { ok: true });
    },

    /** POST /app/sorties/:id/invites { invites: string[] } */
    async inviter(requete: Request, reponse: Response) {
      const compteId = moi(reponse);
      const id = lireParametre(requete, "id");
      const idsPublics = lireListeIdentifiantsPublics(lireCorps(requete), "invites", MAX_PARTICIPANTS_SORTIE - 1);
      if (idsPublics.length === 0) throw new ChampInvalide("invites");
      const r = await d.sorties.inviter(compteId, id, await lireInvites(compteId, idsPublics), maintenant());
      if (!r.ok) refuser(r.erreur);
      await contexte.appliquer(r.effets);
      reponse.json({ ok: true, sortie: r.sortie });
    },

    /** POST /app/sorties/:id/propositions { lieuId } */
    async proposer(requete: Request, reponse: Response) {
      const id = lireParametre(requete, "id");
      const brut = lireCorps(requete).lieuId;
      const lieuId = typeof brut === "number" ? lireIdentifiant(String(brut)) : null;
      if (lieuId === null || lieuId !== brut) throw new ChampInvalide("lieuId");
      const r = await d.sorties.proposer(moi(reponse), id, lieuId, maintenant());
      if (!r.ok) refuser(r.erreur);
      reponse.status(r.deja ? 200 : 201).json(r.deja ? { ok: true, sortie: r.sortie, deja: true } : { ok: true, sortie: r.sortie });
    },

    /** PUT (oui) ou DELETE (non) /app/sorties/:id/votes/:lieuId */
    voter(oui: boolean) {
      return async (requete: Request, reponse: Response) => {
        const id = lireParametre(requete, "id");
        const r = await d.sorties.voter(moi(reponse), id, lireParametre(requete, "lieuId"), oui, maintenant());
        if (!r.ok) refuser(r.erreur);
        reponse.json({ ok: true, sortie: r.sortie });
      };
    },

    /** POST /app/sorties/:id/terminer-vote */
    async terminerVote(requete: Request, reponse: Response) {
      const r = await d.sorties.terminerVote(moi(reponse), lireParametre(requete, "id"), maintenant());
      if (!r.ok) refuser(r.erreur);
      await contexte.appliquer(r.effets);
      reponse.json({ ok: true, sortie: r.sortie });
    },

    /**
     * DELETE /app/sorties/:id/participants/:personne : la personne est cherchée même si elle a bloqué l'organisateur (elle
     * est nommée dans les participants, et il doit pouvoir la retirer). Un identifiant inconnu n'est refusé (404
     * personne-inconnue) qu'APRÈS sortie-inconnue et reserve-a-l-organisateur, et comme une personne qui n'est pas dans la
     * sortie : rien n'est dit d'un compte qui t'a bloqué
     */
    async retirerParticipant(requete: Request, reponse: Response) {
      const compteId = moi(reponse);
      const id = lireParametre(requete, "id");
      const idPublic = lireIdentifiantPublic(requete.params.personne);
      if (!idPublic) throw new ChampInvalide("personne");
      const personne = await d.relations.trouverCompte(idPublic);
      const r = await d.sorties.retirerParticipant(compteId, id, personne, maintenant());
      if (!r.ok) refuser(r.erreur);
      reponse.json({ ok: true });
    },

    /** DELETE /app/sorties/:id/participation : toujours 200 (rien n'est dit d'une sortie qu'on ne voit pas) */
    async quitter(requete: Request, reponse: Response) {
      await d.sorties.quitter(moi(reponse), lireParametre(requete, "id"), maintenant());
      reponse.json({ ok: true });
    },

    /** DELETE /app/sorties/:id */
    async annuler(requete: Request, reponse: Response) {
      const r = await d.sorties.annuler(moi(reponse), lireParametre(requete, "id"));
      if (!r.ok) refuser(r.erreur);
      await contexte.appliquer(r.effets);
      reponse.json({ ok: true });
    },
  };
}
