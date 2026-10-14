const FORME_BASE64URL = /^[A-Za-z0-9_-]{1,80}$/;
/** « <date ISO>_<identifiant public> » (FORME_ID_PUBLIC de commun : 10 caractères, minuscules et chiffres de 2 à 9) */
const FORME_CURSEUR = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)_([a-z2-9]{10})$/;

/**
 * Le curseur `?apres=` écrit par ecrireCurseurPersonne : null s'il est absent (première page), undefined s'il est mal formé
 * (la route répond 400 champ-invalide).
 */
export function lireCurseurPersonne(brut: unknown): { date: Date; idPublic: string } | null | undefined {
  if (brut === undefined || brut === null || brut === "") return null;
  if (typeof brut !== "string" || !FORME_BASE64URL.test(brut)) return undefined;
  const lu = FORME_CURSEUR.exec(Buffer.from(brut, "base64url").toString("utf8"));
  if (!lu) return undefined;
  const date = new Date(lu[1]);
  // Une date impossible (30 février…) ne se relit pas à l'identique
  if (Number.isNaN(date.getTime()) || date.toISOString() !== lu[1]) return undefined;
  return { date, idPublic: lu[2] };
}
