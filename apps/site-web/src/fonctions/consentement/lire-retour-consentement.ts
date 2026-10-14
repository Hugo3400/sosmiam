/**
 * Page où revenir après un choix envoyé sans JavaScript : un chemin du site, avec ses paramètres et son ancre
 * (« /cookies?apercu-cookies#mes-choix »), jamais une autre adresse (« //exemple.fr », « /\exemple.fr »). Sinon null.
 */
export function lireRetourConsentement(valeur: unknown): string | null {
  if (typeof valeur !== "string" || valeur.length > 300) return null;
  return /^\/(?!\/)[\w\-/.~%]*(\?[\w\-=&%.~+]*)?(#[\w-]*)?$/.test(valeur) ? valeur : null;
}
