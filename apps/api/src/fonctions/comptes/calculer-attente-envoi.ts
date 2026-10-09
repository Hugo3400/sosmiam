const MINUTE = 60_000;
/** Un lien au plus toutes les 15 minutes… */
export const ESPACEMENT_ENVOIS = 15 * MINUTE;
/** … et 5 au plus sur 24 heures glissantes, par compte */
export const ENVOIS_PAR_JOUR = 5;
export const FENETRE_ENVOIS = 24 * 60 * MINUTE;

/**
 * Secondes à attendre avant d'envoyer un nouveau lien par mail à ce compte (nouveau mot de passe, confirmation de
 * l'e-mail), d'après les moments des liens déjà envoyés (dans n'importe quel ordre) : 0 s'il peut partir tout de suite.
 */
export function calculerAttenteEnvoi(envois: readonly number[], maintenant: number): number {
  const recents = envois.filter((moment) => maintenant - moment < FENETRE_ENVOIS).sort((a, b) => a - b);
  let fin = 0;
  const dernier = recents.at(-1);
  if (dernier !== undefined) fin = dernier + ESPACEMENT_ENVOIS;
  if (recents.length >= ENVOIS_PAR_JOUR) fin = Math.max(fin, recents[recents.length - ENVOIS_PAR_JOUR] + FENETRE_ENVOIS);
  return Math.max(0, Math.ceil((fin - maintenant) / 1000));
}
