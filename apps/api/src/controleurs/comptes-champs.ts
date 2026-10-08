// Petits lecteurs des demandes des comptes : ils nettoient les champs, ou disent lequel ne va pas (ChampInvalide, que
// gererErreursComptes transforme en 400 « champ-invalide » avec le nom du champ).
import type { Request, Response } from "express";

import { nettoyerLigne } from "../fonctions/comptes/nettoyer-ligne.ts";
import { verifierEmail } from "../fonctions/texte/verifier-email.ts";
import type { CompteSession } from "../middlewares/proteger-comptes.ts";
import { ChampInvalide } from "./gestion/lire-champs.ts";

/** Le corps JSON de la demande (un objet vide s'il n'y en a pas). */
export function lireCorps(requete: Request): Record<string, unknown> {
  const corps: unknown = requete.body;
  return typeof corps === "object" && corps !== null && !Array.isArray(corps) ? (corps as Record<string, unknown>) : {};
}

/** Identifiant du compte connecté (posé par exigerCompte dans reponse.locals.compte). */
export function lireCompteId(reponse: Response): number {
  return (reponse.locals.compte as CompteSession).id;
}

/** Champ piège, invisible pour les humains : rempli, c'est un robot (il reçoit « ok » et rien n'est gardé). */
export function estRobot(corps: Record<string, unknown>): boolean {
  return typeof corps.piege === "string" && corps.piege.trim() !== "";
}

/** E-mail sans espaces autour et en minuscules, de forme valable (254 caractères au plus). */
export function lireEmail(corps: Record<string, unknown>): string {
  const email = typeof corps.email === "string" ? corps.email.trim().toLowerCase() : "";
  if (!verifierEmail(email)) throw new ChampInvalide("email");
  return email;
}

/** Mot de passe tel quel (jamais nettoyé : ses espaces en font partie), ou "" s'il manque. */
export function lireMotDePasse(corps: Record<string, unknown>, champ: string): string {
  const valeur = corps[champ];
  return typeof valeur === "string" ? valeur : "";
}

/** Une ligne de texte obligatoire (prénom, ville), nettoyée, de `minimum` à `maximum` caractères. */
export function lireLigne(corps: Record<string, unknown>, champ: string, minimum: number, maximum: number): string {
  const valeur = corps[champ];
  const propre = typeof valeur === "string" ? nettoyerLigne(valeur) : "";
  if (propre.length < minimum || propre.length > maximum) throw new ChampInvalide(champ);
  return propre;
}

/** Une ligne facultative (quartier) : null si elle est absente ou vide. */
export function lireLigneFacultative(corps: Record<string, unknown>, champ: string, maximum: number): string | null {
  const valeur = corps[champ];
  if (valeur === undefined || valeur === null) return null;
  if (typeof valeur !== "string") throw new ChampInvalide(champ);
  const propre = nettoyerLigne(valeur);
  if (propre.length > maximum) throw new ChampInvalide(champ);
  return propre || null;
}
