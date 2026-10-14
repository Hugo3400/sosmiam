import { FORME_ID_PUBLIC } from "../../../../../packages/commun/src/regles/potes.ts";

/**
 * Les mentions gardées dans un commentaire (colonne JSON `mentions` : [{ "p": pseudo tel qu'écrit, "id": identifiant
 * public }]), au format de l'app ({ pseudo, id }). Une entrée mal formée est ignorée : rien d'inattendu ne sort de la base.
 */
export function lireMentionsCommentaire(json: unknown): { pseudo: string; id: string }[] {
  if (!Array.isArray(json)) return [];
  return json.flatMap((m: unknown) => {
    if (typeof m !== "object" || m === null) return [];
    const { p, id } = m as Record<string, unknown>;
    return typeof p === "string" && p.length <= 40 && typeof id === "string" && FORME_ID_PUBLIC.test(id) ? [{ pseudo: p, id }] : [];
  });
}
