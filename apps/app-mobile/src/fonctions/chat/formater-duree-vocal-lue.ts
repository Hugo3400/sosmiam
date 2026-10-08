/** Durée d'une note vocale pour le lecteur d'écran : « 12 secondes », « 1 minute », « 1 minute et 5 secondes ». */
export function formaterDureeVocalLue(secondes: number): string {
  const total = Number.isFinite(secondes) ? Math.max(1, Math.round(secondes)) : 1;
  const minutes = Math.floor(total / 60);
  const reste = total % 60;
  const enSecondes = `${reste} seconde${reste > 1 ? "s" : ""}`;
  if (minutes === 0) return enSecondes;
  const enMinutes = `${minutes} minute${minutes > 1 ? "s" : ""}`;
  return reste === 0 ? enMinutes : `${enMinutes} et ${enSecondes}`;
}
