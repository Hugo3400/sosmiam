export function lireMinutesHeure(heure: string): number | null {
  const morceaux = /^(\d{2}):(\d{2})$/.exec(heure);
  if (!morceaux) return null;
  const [heures, minutes] = [Number(morceaux[1]), Number(morceaux[2])];
  return heures > 24 || minutes > 59 ? null : heures * 60 + minutes;
}
