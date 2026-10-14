import type { PeriodeEvenements } from "~/contenus/type-filtres-explorer";

/**
 * Les bornes d'une période d'Explorer, à l'heure du téléphone : « ce soir » = de maintenant à 4 h du matin ; « ce week-end »
 * = du vendredi 18 h (ou de maintenant, si on y est déjà) au lundi 4 h.
 */
export function calculerPeriodeEvenements(periode: PeriodeEvenements, maintenant: Date = new Date()): { du: Date; au: Date } {
  const quatreHeures = (base: Date, jours: number) => {
    const d = new Date(base);
    d.setDate(d.getDate() + jours);
    d.setHours(4, 0, 0, 0);
    return d;
  };
  if (periode === "ce-soir") {
    const au = quatreHeures(maintenant, maintenant.getHours() < 4 ? 0 : 1);
    return { du: maintenant, au };
  }
  // Jours jusqu'au lundi qui suit (dimanche : 1 ; lundi avant 4 h : 0, c'est encore le week-end)
  const jour = maintenant.getDay();
  const jusquAuLundi = jour === 1 && maintenant.getHours() < 4 ? 0 : (8 - jour) % 7 || 7;
  const au = quatreHeures(maintenant, jusquAuLundi);
  const vendredi = new Date(au);
  vendredi.setDate(vendredi.getDate() - 3);
  vendredi.setHours(18, 0, 0, 0);
  return { du: vendredi > maintenant ? vendredi : maintenant, au };
}
