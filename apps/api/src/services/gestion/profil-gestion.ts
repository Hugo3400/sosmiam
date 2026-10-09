// Le profil de l'app vu depuis le logiciel de gestion (docs/decisions.md, « Avant de brancher l'app ») : le nom et la date
// de naissance restent chiffrés dans la base ; on ne les déchiffre que pour l'export (droit d'accès), et la date quand
// l'équipe la corrige sur demande (« Date de naissance fausse : corrigée par l'équipe », jamais par la personne).
import { AGE_MINIMUM_INSCRIPTION } from "../../../../../packages/commun/src/regles/ages.ts";
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { calculerAgeProfil } from "../../fonctions/comptes/calculer-age-profil.ts";
import type { ChiffrementDonnees } from "../chiffrement-donnees.ts";
import { retirerDuProgramme } from "./ambassadeurs.ts";

/** Sous cet âge, pas de rôle d'ambassadeur ni de pro (espaces réservés aux 18 ans et plus) */
const MAJORITE = 18;

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

export type CorrectionDate =
  | { etat: "introuvable" | "date-invalide" | "trop-jeune" }
  | { etat: "corrigee"; age: number; rolesRetires: ("ambassadeur" | "pro")[] };

/**
 * Corrige la date de naissance (« AAAA-MM-JJ », jamais dans le futur, 15 ans au moins au jour de Paris) et l'enregistre
 * chiffrée. Si la personne a moins de 18 ans, ses rôles d'ambassadeur (retiré du programme) et de pro (rattachements
 * retirés) partent : ces espaces sont réservés aux majeurs.
 */
export async function corrigerDateNaissance(id: number, date: string, chiffrement: ChiffrementDonnees, maintenant = new Date()): Promise<CorrectionDate> {
  const age = /^\d{4}-\d{2}-\d{2}$/.test(date) ? calculerAgeProfil(date, maintenant) : null;
  if (age === null) return { etat: "date-invalide" };
  if (age < AGE_MINIMUM_INSCRIPTION) return { etat: "trop-jeune" };
  const compte = await baseDeDonnees.compte.findUnique({ where: { id }, select: { id: true, ambassadeur: { select: { compteId: true } } } });
  if (!compte) return { etat: "introuvable" };
  await baseDeDonnees.compte.update({ where: { id }, data: { dateNaissanceChiffree: chiffrement.chiffrer(date, "dateNaissance") }, select: { id: true } });
  const rolesRetires: ("ambassadeur" | "pro")[] = [];
  if (age < MAJORITE) {
    if (compte.ambassadeur && (await retirerDuProgramme(id))) rolesRetires.push("ambassadeur");
    const { count } = await baseDeDonnees.rattachementLieu.updateMany({
      where: { compteId: id, statut: { in: ["valide", "en-attente"] } },
      data: { statut: "retire", reponse: "Rôle retiré : moins de 18 ans après correction de la date de naissance.", decideLe: maintenant },
    });
    if (count > 0) rolesRetires.push("pro");
  }
  return { etat: "corrigee", age, rolesRetires };
}
