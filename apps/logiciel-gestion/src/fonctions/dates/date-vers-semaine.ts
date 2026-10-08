/** Date → semaine ISO au format d'un champ « semaine » (« 2026-W41 »). */
export function dateVersSemaine(date: Date): string {
  const jour = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const jeudi = new Date(jour.getTime() + (3 - ((jour.getUTCDay() + 6) % 7)) * 86_400_000);
  const annee = jeudi.getUTCFullYear();
  const numero = 1 + Math.floor((jeudi.getTime() - Date.UTC(annee, 0, 1)) / (7 * 86_400_000));
  return `${annee}-W${String(numero).padStart(2, "0")}`;
}
