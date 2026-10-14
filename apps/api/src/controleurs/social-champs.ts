// Petits lecteurs des demandes sociales (spécification sociale D.1), partagés par tous les domaines : une personne par son
// identifiant public, un texte social filtré, une liste d'identifiants publics, l'idClient d'un envoi, un curseur de page.
// Un champ qui ne va pas lance ChampInvalide (400 champ-invalide { champ }, par gererErreursComptes) ; un refus métier lance
// RefusSocial (son code et son statut, par gererRefusSociaux, posé devant gererErreursComptes dans routes/social-app.ts),
// construit par refuserSocial(erreur, ERREURS) : le statut vient de la table ERREURS du contrôleur (D.0, D.3), la même
// partout pour un même code.
import type { NextFunction, Request, Response } from "express";

import { estIdClient } from "../../../../packages/commun/src/validation/est-id-client.ts";
import { verifierTexteSocial } from "../../../../packages/commun/src/validation/verifier-texte-social.ts";
import { lireCurseurDate } from "../fonctions/social/lire-curseur-date.ts";
import { lireIdentifiantPublic } from "../fonctions/social/lire-identifiant-public.ts";
import type { RelationsSociales } from "../services/relations-sociales-regles.ts";
import { ChampInvalide } from "./gestion/lire-champs.ts";

/** Un refus à rendre tel quel : { ok: false, erreur, champ? } avec ce statut (404 personne-inconnue, 400 message-refuse…) */
export class RefusSocial extends Error {
  readonly erreur: string;
  readonly statut: number;
  readonly champ?: string;
  constructor(erreur: string, statut: number, champ?: string) {
    super(`refus social : ${erreur}`);
    this.erreur = erreur;
    this.statut = statut;
    this.champ = champ;
  }
}

/**
 * Le refus d'une erreur métier, avec son statut HTTP : celui de la table ERREURS du contrôleur, sinon la règle commune
 * (404 pour un « …-inconnu » ou « …-inconnue », 403 pour un « reserve-… » et « conversation-fermee », 409 pour le reste).
 * Un même code a ainsi le même statut dans tous les contrôleurs sociaux.
 */
export function refuserSocial(erreur: string, erreurs: Readonly<Record<string, number>> = {}, champ?: string): RefusSocial {
  const commun = /-inconnue?$/.test(erreur) ? 404 : erreur.startsWith("reserve-") || erreur === "conversation-fermee" ? 403 : 409;
  return new RefusSocial(erreur, erreurs[erreur] ?? commun, champ);
}

/** Rend un RefusSocial en JSON ; tout le reste passe à gererErreursComptes (400 champ-invalide, 500…) */
export function gererRefusSociaux(erreur: unknown, _requete: Request, reponse: Response, suite: NextFunction) {
  if (!(erreur instanceof RefusSocial)) return suite(erreur);
  reponse.status(erreur.statut).json({ ok: false, erreur: erreur.erreur, ...(erreur.champ ? { champ: erreur.champ } : {}) });
}

/**
 * Le compte du paramètre `:personne` (un identifiant public). Mal formé : 400 champ-invalide { champ: "personne" } ;
 * inconnu, sans profil social, ou qui T'A bloqué : 404 personne-inconnue (on ne dit jamais qu'on est bloqué).
 * memeSiBloque : pour /app/blocages seulement (on peut toujours bloquer en retour, sans que ce soit un indice).
 */
export async function lirePersonne(requete: Request, relations: Pick<RelationsSociales, "trouverCompte">, moi: number, o: { memeSiBloque?: boolean } = {}): Promise<number> {
  const idPublic = lireIdentifiantPublic(requete.params.personne);
  if (!idPublic) throw new ChampInvalide("personne");
  const compteId = await relations.trouverCompte(idPublic, o.memeSiBloque ? undefined : moi);
  if (compteId === null) throw refuserSocial("personne-inconnue");
  return compteId;
}

/**
 * Un texte social du corps, nettoyé avec trim et vérifié par verifierTexteSocial de commun (même règle que l'app) : vide ou
 * trop long, ChampInvalide ; un mot interdit, 400 message-refuse { champ } (le code du filtre de mots, « On reformule ? »).
 * Facultatif : null s'il est absent, null ou vide.
 */
export function lireTexteSocial(corps: Record<string, unknown>, champ: string, max: number, obligatoire: true): string;
export function lireTexteSocial(corps: Record<string, unknown>, champ: string, max: number, obligatoire: false): string | null;
export function lireTexteSocial(corps: Record<string, unknown>, champ: string, max: number, obligatoire: boolean): string | null {
  const brut = corps[champ];
  if (brut === undefined || brut === null) {
    if (obligatoire) throw new ChampInvalide(champ);
    return null;
  }
  if (typeof brut !== "string") throw new ChampInvalide(champ);
  const propre = brut.trim();
  if (propre === "" && !obligatoire) return null;
  const verdict = verifierTexteSocial(propre, max);
  if (verdict === "mot-interdit") throw new RefusSocial("message-refuse", 400, champ);
  if (verdict !== "ok") throw new ChampInvalide(champ);
  return propre;
}

/** Une liste d'identifiants publics (invités, membres…), `max` au plus, sans doublon ; un seul mal formé : ChampInvalide */
export function lireListeIdentifiantsPublics(corps: Record<string, unknown>, champ: string, max: number): string[] {
  const brut = corps[champ];
  if (!Array.isArray(brut) || brut.length > max) throw new ChampInvalide(champ);
  const ids = brut.map(lireIdentifiantPublic);
  if (ids.some((id) => id === null)) throw new ChampInvalide(champ);
  return [...new Set(ids as string[])];
}

/**
 * L'idClient d'un envoi : `idClient` du corps, ou l'en-tête Idempotency-Key (un média, une création). Un UUID v4 en
 * minuscules (FORME_ID_CLIENT de commun), sinon 400 champ-invalide { champ: "idClient" }.
 */
export function lireIdClient(requete: Request): string {
  const corps: unknown = requete.body;
  const duCorps = typeof corps === "object" && corps !== null && !Array.isArray(corps) ? (corps as Record<string, unknown>).idClient : undefined;
  const brut = duCorps ?? requete.get("idempotency-key");
  if (!estIdClient(brut)) throw new ChampInvalide("idClient");
  return brut;
}

/**
 * Le curseur `?apres=` (la `suite` de la page d'avant), tel quel ; null : première page ; mal formé : ChampInvalide("apres").
 * `lire` : lireCurseurDate (cloche, messages…) par défaut, lireCurseurPersonne pour une page de personnes.
 */
export function lireCurseurApres(requete: Request, lire: (brut: unknown) => object | null | undefined = lireCurseurDate): string | null {
  const brut: unknown = requete.query.apres;
  const lu = lire(brut);
  if (lu === undefined) throw new ChampInvalide("apres");
  return lu === null ? null : (brut as string);
}
