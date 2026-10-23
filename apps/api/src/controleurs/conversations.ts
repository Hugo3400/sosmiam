// La messagerie du compte connecté (voir routes/conversations.ts) : conversations, privés, groupes et leurs invitations,
// messages, réactions, lu, couper, effacer pour soi. Les personnes sont toujours désignées par leur identifiant public ; une
// personne qui t'a bloqué est « inconnue », sauf pour retirer ou changer le rôle d'un membre de TON groupe (il y reste nommé,
// et un blocage ne doit jamais l'empêcher d'être exclu, ni se deviner à la réponse). Les effets (cloche, notifications) sont appliqués avant de répondre (cloche) et
// après (téléphone). Jamais un texte de message au journal.
import type { Request, Response } from "express";

import { CODES_REACTIONS, FORME_ID_GIF, LONGUEUR_MAX_TITRE_GROUPE, MAX_LIEUX_SONDAGE } from "../../../../packages/commun/src/regles/chat.ts";
import { LONGUEUR_MAX_MESSAGE, LONGUEUR_MAX_MOT_RECOMMANDATION } from "../../../../packages/commun/src/regles/potes.ts";
import type { CodeReaction, RoleConversation, TypePartage } from "../../../../packages/commun/src/types/messagerie.ts";
import { estEmojiSeul } from "../../../../packages/commun/src/validation/est-emoji-seul.ts";
import { validerNouveauGroupe } from "../../../../packages/commun/src/validation/valider-nouveau-groupe.ts";
import { validerNouveauSondage } from "../../../../packages/commun/src/validation/valider-nouveau-sondage.ts";
import { estAncienneApp } from "../fonctions/social/est-ancienne-app.ts";
import { lireIdentifiantPublic } from "../fonctions/social/lire-identifiant-public.ts";
import { lireProfilSocialPose } from "../middlewares/profil-social.ts";
import { lireIdentifiant } from "../middlewares/proteger-pro.ts";
import type { ContexteRoutesSociales, DependancesSocialApp } from "../routes/social-app.ts";
import type { MessageAEnvoyer } from "../services/messagerie-regles.ts";
import { ATTENTE_STOCKAGE_PLEIN_SECONDES } from "../services/stockage-medias-chat.ts";
import { lireCorps } from "./comptes-champs.ts";
import { ChampInvalide } from "./gestion/lire-champs.ts";
import { lireCurseurApres, lireIdClient, lireListeIdentifiantsPublics, lirePersonne, lireTexteSocial, RefusSocial, refuserSocial } from "./social-champs.ts";

/** Statut HTTP des refus métier de la messagerie (spécification sociale D.0, D.3) ; les médias ont la leur (conversations-medias.ts) */
export const ERREURS_MESSAGERIE: Readonly<Record<string, number>> = {
  "conversation-inconnue": 404, "conversation-fermee": 403, "pas-dans-la-bande": 409, "groupe-plein": 409, "reserve-aux-admins": 403,
  "geree-par-la-sortie": 409, "personne-inconnue": 404, "invitation-inconnue": 404, "message-inconnu": 404, "reserve-a-l-auteur": 403,
  "lieu-inconnu": 404, "reponse-introuvable": 400, "pas-l-auteur": 403, "trop-tard": 409, "non-modifiable": 409, "trop-d-epinglees": 409,
  "album-plein": 409, "reserve-aux-groupes": 409, "sondage-clos": 409, "gif-refuse": 400, "gif-inconnu": 404, "gif-indisponible": 503,
};

/** Invités d'un groupe : 1 à 19 (avec toi, 20 personnes) */
const MAX_INVITES = 19;
const ROLES: readonly RoleConversation[] = ["admin", "membre"];
const TYPES_PARTAGES: readonly TypePartage[] = ["photo", "lieu"];
const estCodeReaction = (brut: unknown): brut is CodeReaction => typeof brut === "string" && (CODES_REACTIONS as readonly string[]).includes(brut);

/**
 * Un refus du service en réponse, avec la table du contrôleur (par défaut, celle de la messagerie) : « id-client-pris » est un
 * idClient qui n'est pas le tien (400) ; Retry-After si le disque est plein
 */
export function rendreRefus(reponse: Response, erreur: string, erreurs: Readonly<Record<string, number>> = ERREURS_MESSAGERIE): never {
  if (erreur === "id-client-pris") throw new ChampInvalide("idClient");
  if (erreur === "album-invalide") throw new ChampInvalide("album");
  if (erreur === "stockage-plein") reponse.set("Retry-After", String(ATTENTE_STOCKAGE_PLEIN_SECONDES));
  throw refuserSocial(erreur, erreurs);
}

/** :id ou :messageId d'une adresse (/^[1-9]\d{0,8}$/), sinon 400 champ-invalide */
export function lireNumero(requete: Request, nom: "id" | "messageId"): number {
  const numero = lireIdentifiant(requete.params[nom]);
  if (numero === null) throw new ChampInvalide(nom);
  return numero;
}

export function creerControleursConversations(d: Pick<DependancesSocialApp, "messagerie" | "relations">, contexte: Pick<ContexteRoutesSociales, "horloge" | "appliquer">) {
  const maintenant = () => new Date(contexte.horloge());
  const moi = (reponse: Response) => lireProfilSocialPose(reponse).compteId;
  const lireApp = (requete: Request) => ({ ancienneApp: estAncienneApp(requete.get("X-Version-App")) });

  /** Des identifiants publics en comptes ; les inconnus (et ceux qui t'ont bloqué) sont gardés pour la liste des ignorés */
  async function resoudre(ids: readonly string[], compteId: number) {
    const trouves = await d.relations.trouverComptes(ids, compteId);
    const versPublic = new Map([...trouves].map(([idPublic, id]) => [id, idPublic]));
    const inconnus = ids.filter((id) => !trouves.has(id));
    return { comptes: [...trouves.values()], ignores: (ignores: readonly number[]) => [...inconnus, ...ignores.flatMap((id) => versPublic.get(id) ?? [])] };
  }

  /** La personne d'un champ du corps (identifiant public) : 400 mal formé ou toi-même, 404 inconnue */
  async function lirePersonneDuCorps(corps: Record<string, unknown>, champ: string, compteId: number): Promise<number> {
    const idPublic = lireIdentifiantPublic(corps[champ]);
    if (!idPublic) throw new ChampInvalide(champ);
    const cible = await d.relations.trouverCompte(idPublic, compteId);
    if (cible === null) throw refuserSocial("personne-inconnue", ERREURS_MESSAGERIE);
    if (cible === compteId) throw new ChampInvalide(champ);
    return cible;
  }

  /**
   * Le message d'un envoi : texte (1 à 500 caractères), lieu (et son mot de 140), sondage (2 à 4 lieux, fin entre 10 min et
   * 7 jours) ou GIF (son identifiant chez GIPHY) ; 400 message-refuse pour un mot interdit
   */
  function lireMessage(requete: Request): MessageAEnvoyer {
    const corps = lireCorps(requete);
    const idClient = lireIdClient(requete);
    const reponseA = corps.reponseA === undefined || corps.reponseA === null ? undefined : lireIdentifiant(corps.reponseA);
    if (reponseA === null) throw new ChampInvalide("reponseA");
    const commun = { idClient, ...(reponseA !== undefined ? { reponseA } : {}) };
    if (corps.type === "texte") return { ...commun, type: "texte", texte: lireTexteSocial(corps, "texte", LONGUEUR_MAX_MESSAGE, true) };
    if (corps.type === "vote") {
      const v = validerNouveauSondage({ lieux: corps.lieux, finLe: corps.finLe }, maintenant());
      if (!v.ok) throw new ChampInvalide(v.champ);
      return { ...commun, type: "vote", lieux: v.sondage.lieux, finLe: new Date(v.sondage.finLe) };
    }
    if (corps.type === "gif") {
      if (typeof corps.gifId !== "string" || !FORME_ID_GIF.test(corps.gifId)) throw new ChampInvalide("gifId");
      return { ...commun, type: "gif", gifId: corps.gifId };
    }
    if (corps.type !== "lieu") throw new ChampInvalide("type");
    const lieuId = corps.lieuId;
    if (typeof lieuId !== "number" || !Number.isSafeInteger(lieuId) || lieuId < 1) throw new ChampInvalide("lieuId");
    return { ...commun, type: "lieu", lieuId, texte: lireTexteSocial(corps, "texte", LONGUEUR_MAX_MOT_RECOMMANDATION, false) };
  }

  return {
    /** GET /app/conversations[?apres=] */
    async lister(requete: Request, reponse: Response) {
      reponse.json({ ok: true, ...(await d.messagerie.listerConversations(moi(reponse), lireCurseurApres(requete), maintenant(), lireApp(requete))) });
    },

    /** GET /app/conversations/:id[?version=][&avant=] */
    async lireFil(requete: Request, reponse: Response) {
      const id = lireNumero(requete, "id");
      const { version: brutVersion, avant: brutAvant } = requete.query;
      const version = brutVersion === undefined ? null : typeof brutVersion === "string" && /^\d{1,9}$/.test(brutVersion) ? Number(brutVersion) : undefined;
      if (version === undefined) throw new ChampInvalide("version");
      const avant = brutAvant === undefined ? null : lireIdentifiant(brutAvant);
      if (avant === null && brutAvant !== undefined) throw new ChampInvalide("avant");
      const lu = await d.messagerie.lireFil(moi(reponse), id, { version, avant }, maintenant(), lireApp(requete));
      if (!lu) rendreRefus(reponse, "conversation-inconnue");
      if ("messages" in lu) return reponse.json({ ok: true, fil: lu });
      reponse.json({ ok: true, ...lu });
    },

    /** POST /app/conversations/prive { personne } : 201 créée, 200 déjà là */
    async ouvrirPrive(requete: Request, reponse: Response) {
      const compteId = moi(reponse);
      const autre = await lirePersonneDuCorps(lireCorps(requete), "personne", compteId);
      const r = await d.messagerie.ouvrirPrive(compteId, autre, maintenant());
      if (!r.ok) rendreRefus(reponse, r.erreur);
      reponse.status(r.cree ? 201 : 200).json({ ok: true, conversation: r.conversation });
    },

    /** POST /app/conversations/groupes { titre, emoji, invites } (Idempotency-Key) : 201 créé, 200 même clé */
    async creerGroupe(requete: Request, reponse: Response) {
      const compteId = moi(reponse);
      const cle = lireIdClient(requete);
      const v = validerNouveauGroupe(lireCorps(requete));
      if (!v.ok) throw v.raison === "mot-interdit" ? new RefusSocial("message-refuse", 400, v.champ) : new ChampInvalide(v.champ);
      const invites = await resoudre(v.groupe.invites, compteId);
      const r = await d.messagerie.creerGroupe(compteId, { titre: v.groupe.titre, emoji: v.groupe.emoji, invites: invites.comptes }, cle, maintenant());
      if (!r.ok) rendreRefus(reponse, r.erreur);
      await contexte.appliquer(r.effets);
      reponse.status(r.cree ? 201 : 200).json({ ok: true, conversation: r.conversation, ignores: r.cree ? invites.ignores(r.ignores) : [] });
    },

    /** PATCH /app/conversations/:id { titre?, emoji? } : groupe, admins */
    async modifierGroupe(requete: Request, reponse: Response) {
      const id = lireNumero(requete, "id");
      const corps = lireCorps(requete);
      const titre = corps.titre === undefined ? undefined : lireTexteSocial(corps, "titre", LONGUEUR_MAX_TITRE_GROUPE, true);
      const emoji = corps.emoji === undefined ? undefined : typeof corps.emoji === "string" ? corps.emoji.trim() : null;
      if (emoji !== undefined && !estEmojiSeul(emoji)) throw new ChampInvalide("emoji");
      if (titre === undefined && emoji === undefined) throw new ChampInvalide("titre");
      const r = await d.messagerie.modifierGroupe(moi(reponse), id, { ...(titre !== undefined ? { titre } : {}), ...(emoji ? { emoji } : {}) }, maintenant());
      if (!r.ok) rendreRefus(reponse, r.erreur);
      reponse.json({ ok: true, conversation: r.conversation });
    },

    /** POST /app/conversations/:id/invites { invites } : un admin invite des potes de SA bande */
    async inviter(requete: Request, reponse: Response) {
      const compteId = moi(reponse);
      const id = lireNumero(requete, "id");
      const ids = lireListeIdentifiantsPublics(lireCorps(requete), "invites", MAX_INVITES);
      if (ids.length === 0) throw new ChampInvalide("invites");
      const invites = await resoudre(ids, compteId);
      const r = await d.messagerie.inviter(compteId, id, invites.comptes, maintenant());
      if (!r.ok) rendreRefus(reponse, r.erreur);
      await contexte.appliquer(r.effets);
      reponse.json({ ok: true, conversation: r.conversation, ignores: invites.ignores(r.ignores) });
    },

    /** POST /app/conversations/:id/reponse { rejoint } */
    async repondre(requete: Request, reponse: Response) {
      const id = lireNumero(requete, "id");
      const { rejoint } = lireCorps(requete);
      if (typeof rejoint !== "boolean") throw new ChampInvalide("rejoint");
      const r = await d.messagerie.repondreInvitation(moi(reponse), id, rejoint, maintenant());
      if (!r.ok) rendreRefus(reponse, r.erreur);
      reponse.json(r.conversation ? { ok: true, rejoint: true, conversation: r.conversation } : { ok: true, rejoint: false });
    },

    /** DELETE /app/conversations/:id/membres/:personne (« moi » : quitter le groupe) */
    async retirerMembre(requete: Request, reponse: Response) {
      const compteId = moi(reponse);
      const id = lireNumero(requete, "id");
      // Même s'il t'a bloqué : le service n'agit que sur un membre ou un invité de ce groupe (sinon, rien), la réponse ne dit rien
      const membre = requete.params.personne === "moi" ? "moi" : await lirePersonne(requete, d.relations, compteId, { memeSiBloque: true });
      const r = await d.messagerie.retirerMembre(compteId, id, membre, maintenant());
      if (!r.ok) rendreRefus(reponse, r.erreur);
      reponse.json({ ok: true });
    },

    /** PUT /app/conversations/:id/membres/:personne/role { role } */
    async changerRole(requete: Request, reponse: Response) {
      const compteId = moi(reponse);
      const id = lireNumero(requete, "id");
      // Même s'il t'a bloqué (voir retirerMembre) : hors du groupe, toujours 404 personne-inconnue
      const membre = await lirePersonne(requete, d.relations, compteId, { memeSiBloque: true });
      const { role } = lireCorps(requete);
      if (!ROLES.includes(role as RoleConversation)) throw new ChampInvalide("role");
      const r = await d.messagerie.changerRole(compteId, id, membre, role as RoleConversation, maintenant());
      if (!r.ok) rendreRefus(reponse, r.erreur);
      reponse.json({ ok: true, conversation: r.conversation });
    },

    /** PUT /app/conversations/:id/notifications { coupees } */
    async couper(requete: Request, reponse: Response) {
      const id = lireNumero(requete, "id");
      const { coupees } = lireCorps(requete);
      if (typeof coupees !== "boolean") throw new ChampInvalide("coupees");
      if (!(await d.messagerie.couper(moi(reponse), id, coupees))) rendreRefus(reponse, "conversation-inconnue");
      reponse.json({ ok: true });
    },

    /** PUT /app/conversations/:id/lu { jusqua } */
    async marquerLu(requete: Request, reponse: Response) {
      const id = lireNumero(requete, "id");
      const jusqua = lireIdentifiant(lireCorps(requete).jusqua);
      if (jusqua === null) throw new ChampInvalide("jusqua");
      if (!(await d.messagerie.marquerLu(moi(reponse), id, jusqua, maintenant(), lireApp(requete)))) rendreRefus(reponse, "conversation-inconnue");
      reponse.json({ ok: true });
    },

    async epingler(requete: Request, reponse: Response) {
      const id = lireNumero(requete, "id");
      const { epinglee } = lireCorps(requete);
      if (typeof epinglee !== "boolean") throw new ChampInvalide("epinglee");
      const r = await d.messagerie.epingler(moi(reponse), id, epinglee, maintenant());
      if (!r.ok) rendreRefus(reponse, r.erreur);
      reponse.json({ ok: true });
    },

    async listerPartages(requete: Request, reponse: Response) {
      const id = lireNumero(requete, "id");
      const { type, avant: brutAvant } = requete.query;
      if (!TYPES_PARTAGES.includes(type as TypePartage)) throw new ChampInvalide("type");
      const avant = brutAvant === undefined ? null : lireIdentifiant(brutAvant);
      if (avant === null && brutAvant !== undefined) throw new ChampInvalide("avant");
      const page = await d.messagerie.listerPartages(moi(reponse), id, type as TypePartage, avant, maintenant());
      if (!page) rendreRefus(reponse, "conversation-inconnue");
      reponse.json({ ok: true, ...page });
    },

    /** POST /app/conversations/:id/effacer */
    async effacerPourMoi(requete: Request, reponse: Response) {
      const id = lireNumero(requete, "id");
      if (!(await d.messagerie.effacerPourMoi(moi(reponse), id))) rendreRefus(reponse, "conversation-inconnue");
      reponse.json({ ok: true });
    },

    /** POST /app/conversations/:id/messages { idClient, type, texte?, lieuId?, lieux?, finLe?, gifId? } : 201 nouveau, 200 envoi rejoué */
    async envoyer(requete: Request, reponse: Response) {
      const id = lireNumero(requete, "id");
      const message = lireMessage(requete);
      const r = await d.messagerie.envoyer(moi(reponse), id, message, maintenant());
      if (!r.ok) rendreRefus(reponse, r.erreur);
      await contexte.appliquer(r.effets);
      reponse.status(r.rejoue ? 200 : 201).json({ ok: true, message: r.message, version: r.version });
    },

    async modifierMessage(requete: Request, reponse: Response) {
      const id = lireNumero(requete, "id");
      const messageId = lireNumero(requete, "messageId");
      const texte = lireTexteSocial(lireCorps(requete), "texte", LONGUEUR_MAX_MESSAGE, true);
      const r = await d.messagerie.modifierMessage(moi(reponse), id, messageId, texte, maintenant());
      if (!r.ok) rendreRefus(reponse, r.erreur);
      reponse.json({ ok: true, message: r.message, version: r.version });
    },

    /** DELETE /app/conversations/:id/messages/:messageId */
    async supprimerMessage(requete: Request, reponse: Response) {
      const r = await d.messagerie.supprimerMessage(moi(reponse), lireNumero(requete, "id"), lireNumero(requete, "messageId"), maintenant());
      if (!r.ok) rendreRefus(reponse, r.erreur);
      reponse.json({ ok: true, version: r.version });
    },

    voter(oui: boolean) {
      return async (requete: Request, reponse: Response) => {
        const id = lireNumero(requete, "id");
        const messageId = lireNumero(requete, "messageId");
        const brut = oui ? lireCorps(requete).ordre : null;
        if (oui && (typeof brut !== "number" || !Number.isInteger(brut) || brut < 1 || brut > MAX_LIEUX_SONDAGE)) throw new ChampInvalide("ordre");
        const r = await d.messagerie.voterSondage(moi(reponse), id, messageId, oui ? (brut as number) : null, maintenant());
        if (!r.ok && r.erreur === "option-inconnue") throw new ChampInvalide("ordre");
        if (!r.ok) rendreRefus(reponse, r.erreur);
        reponse.json({ ok: true, message: r.message, version: r.version });
      };
    },

    /** PUT (oui) ou DELETE (non) /app/conversations/:id/messages/:messageId/reactions/:reaction */
    reagir(oui: boolean) {
      return async (requete: Request, reponse: Response) => {
        const id = lireNumero(requete, "id");
        const messageId = lireNumero(requete, "messageId");
        const { reaction } = requete.params;
        if (!estCodeReaction(reaction)) throw new ChampInvalide("reaction");
        const r = await d.messagerie.basculerReaction(moi(reponse), id, messageId, reaction, oui, maintenant());
        if (!r.ok) rendreRefus(reponse, r.erreur);
        reponse.json({ ok: true, version: r.version });
      };
    },
  };
}
