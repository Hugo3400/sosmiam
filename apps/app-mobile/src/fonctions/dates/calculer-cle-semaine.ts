/** Identifiant de la semaine (lundi → dimanche) d'une date, par exemple « 2026-10-05 » (la date de son lundi, heure locale). */
export function calculerCleSemaine(date: Date = new Date()): string {
  const lundi = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const ecartAuLundi = (lundi.getDay() + 6) % 7; // dimanche = 6 jours après le lundi
  lundi.setDate(lundi.getDate() - ecartAuLundi);
  const mois = String(lundi.getMonth() + 1).padStart(2, "0");
  const jour = String(lundi.getDate()).padStart(2, "0");
  return `${lundi.getFullYear()}-${mois}-${jour}`;
}
