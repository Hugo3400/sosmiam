import type { ModeApp, RolesCompte } from "../../types/roles.ts";

/**
 * Les modes de l'app ouverts à ce compte, toujours « perso » en premier. Un 15-17 ans n'a que « perso », quels que
 * soient ses rôles. Un adulte a « pro » s'il fait partie de l'équipe d'au moins un lieu, et « ambassadeur » s'il est
 * ambassadeur actif, en attente ou suspendu (ces deux derniers ne voient que l'onglet Espace, avec leur statut :
 * voir peutOuvrirEspaceAmbassadeur). Une demande refusée n'ouvre rien.
 */
export function listerModesOuverts(roles: RolesCompte, majeur: boolean): ModeApp[] {
  if (!majeur) return ["perso"];
  const modes: ModeApp[] = ["perso"];
  if (roles.pro.length > 0) modes.push("pro");
  if (roles.ambassadeur !== null && roles.ambassadeur !== "refuse") modes.push("ambassadeur");
  return modes;
}
