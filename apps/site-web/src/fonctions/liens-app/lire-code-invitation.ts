const CODE = /(?:^|[?#&])c=([a-z0-9]{6,64})(?:&|$)/i;

/**
 * Dans le navigateur seulement : le code secret d'un lien d'invitation, lu dans le fragment (« #c=… ») ou, pour les
 * anciens liens, dans les paramètres (« ?c=… »). Le serveur ne s'en sert jamais. Null s'il manque ou n'a pas la forme.
 */
export function lireCodeInvitation(fragment: string, parametres: string): string | null {
  return (CODE.exec(fragment) ?? CODE.exec(parametres))?.[1]?.toLowerCase() ?? null;
}
