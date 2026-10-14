/**
 * Page où revenir après un envoi sans JavaScript (champ « retour » des formulaires de choix) : chemin, paramètres et
 * ancre de la page. Un paramètre sans valeur reste sans « = » (React Router écrit « ?apercu-cookies= »).
 */
export function ecrireRetourConsentement(chemin: string, parametres: string, ancre = ""): string {
  return `${chemin}${parametres.replace(/=(?=&|$)/g, "")}${ancre}`;
}
