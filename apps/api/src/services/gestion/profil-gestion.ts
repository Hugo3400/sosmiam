// Le profil de l'app vu depuis le logiciel de gestion (docs/decisions.md, « Avant de brancher l'app ») : le nom et la date
// de naissance restent chiffrés dans la base ; on ne les déchiffre que pour l'export (droit d'accès), et la date quand
// l'équipe la corrige sur demande (« Date de naissance fausse : corrigée par l'équipe », jamais par la personne).
import { AGE_MINIMUM_INSCRIPTION } from "../../../../../packages/commun/src/regles/ages.ts";
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { calculerAgeProfil } from "../../fonctions/comptes/calculer-age-profil.ts";
import type { ChiffrementDonnees } from "../chiffrement-donnees.ts";

/**
 * SOS Miam n'est ouvert qu'aux majeurs (décidé par Hugo le 14 octobre 2026 : 18 ans en France, seul pays pour l'instant).
 * Le plus haut des deux, pour rester juste avant comme après le passage de la règle commune à la majorité.
 */
const AGE_MINIMUM = Math.max(AGE_MINIMUM_INSCRIPTION, 18);

/** Déchiffre un champ ; « illisible » si la donnée ou la clé ne correspond pas (jamais d'erreur qui ferait tout échouer). */
function dechiffrerOuIllisible(chiffrement: ChiffrementDonnees, valeur: string | null, champ: "nom" | "dateNaissance") {
  if (!valeur) return null;
  try {
    return chiffrement.dechiffrer(valeur, champ);
  } catch {
    return "(illisible : donnée abîmée ou clé différente)";
  }
}

/** Le nom et la date de naissance en clair, pour l'export d'un compte (demande d'accès). */
export function dechiffrerProfil(chiffrement: ChiffrementDonnees, compte: { nomChiffre: string | null; dateNaissanceChiffree: string | null }) {
  return { nom: dechiffrerOuIllisible(chiffrement, compte.nomChiffre, "nom"), dateNaissance: dechiffrerOuIllisible(chiffrement, compte.dateNaissanceChiffree, "dateNaissance") };
}

/** La date de naissance d'un compte en clair (bouton « Afficher » du logiciel) ; null si le compte n'existe pas. */
export async function lireDateNaissance(id: number, chiffrement: ChiffrementDonnees) {
  const compte = await baseDeDonnees.compte.findUnique({ where: { id }, select: { dateNaissanceChiffree: true } });
  if (!compte) return null;
  return { dateNaissance: dechiffrerOuIllisible(chiffrement, compte.dateNaissanceChiffree, "dateNaissance") };
}

/** Le prénom et le nom en clair, pour les corriger à la demande de la personne ; null si le compte n'existe pas */
export async function lireIdentite(id: number, chiffrement: ChiffrementDonnees) {
  const compte = await baseDeDonnees.compte.findUnique({ where: { id }, select: { prenom: true, nomChiffre: true } });
  if (!compte) return null;
  return { prenom: compte.prenom, nom: compte.nomChiffre ? dechiffrerOuIllisible(chiffrement, compte.nomChiffre, "nom") : null };
}

/** Corrige le prénom et le nom (déjà chiffré, ou null pour l'effacer) ; false si le compte n'existe pas */
export async function corrigerIdentite(id: number, identite: { prenom: string; nomChiffre: string | null }) {
  const { count } = await baseDeDonnees.compte.updateMany({ where: { id }, data: identite });
  return count > 0;
}

export type CorrectionDate = { etat: "introuvable" | "date-invalide" | "trop-jeune" } | { etat: "corrigee"; age: number };

/**
 * Corrige la date de naissance (« AAAA-MM-JJ », jamais dans le futur) et l'enregistre chiffrée. Une date qui donnerait
 * moins de 18 ans (jour de Paris) est refusée (« trop-jeune ») : SOS Miam est réservé aux majeurs, et un tel compte n'a
 * pas sa place ; c'est à l'équipe de le supprimer si c'est vrai.
 */
export async function corrigerDateNaissance(id: number, date: string, chiffrement: ChiffrementDonnees, maintenant = new Date()): Promise<CorrectionDate> {
  const age = /^\d{4}-\d{2}-\d{2}$/.test(date) ? calculerAgeProfil(date, maintenant) : null;
  if (age === null) return { etat: "date-invalide" };
  if (age < AGE_MINIMUM) return { etat: "trop-jeune" };
  const { count } = await baseDeDonnees.compte.updateMany({ where: { id }, data: { dateNaissanceChiffree: chiffrement.chiffrer(date, "dateNaissance") } });
  return count > 0 ? { etat: "corrigee", age } : { etat: "introuvable" };
}
