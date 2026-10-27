import { ecrireDateLangue } from "@sos-miam/commun/fonctions/langue/ecrire-date-langue";
import type { Langue } from "@sos-miam/commun/regles/langues";

export function ecrireDateArticle(iso: string, langue: Langue, maintenant: Date = new Date()): string {
  const date = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(date.getTime())) return "";
  const annee = date.getFullYear();
  return ecrireDateLangue({ annee, mois: date.getMonth() + 1, jour: date.getDate() }, langue, { sansAnnee: annee === maintenant.getFullYear() });
}
