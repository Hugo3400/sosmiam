/** Anti-spam décidé le 8 octobre 2026 : au plus 1 notification par jour et 4 par semaine par téléphone. */
export const ANTI_SPAM = { parJour: 1, parSemaine: 4 } as const;

/**
 * Ce téléphone a-t-il déjà eu son compte de notifications ? `envoyees` : les dates des notifications non demandées qu'il
 * a reçues (les 7 derniers jours suffisent). Les notifications demandées (« un SOS près de chez toi ») passent toujours.
 */
export function depasseAntiSpam(envoyees: Date[], maintenant: Date): boolean {
  const jour = maintenant.getTime() - 86_400_000;
  const semaine = maintenant.getTime() - 7 * 86_400_000;
  const surLeJour = envoyees.filter((date) => date.getTime() > jour).length;
  const surLaSemaine = envoyees.filter((date) => date.getTime() > semaine).length;
  return surLeJour >= ANTI_SPAM.parJour || surLaSemaine >= ANTI_SPAM.parSemaine;
}
