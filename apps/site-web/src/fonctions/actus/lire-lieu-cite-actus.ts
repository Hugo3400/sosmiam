import type { LieuCiteActus } from "../../../../../packages/commun/src/types/actus.ts";
import type { TypeLieu } from "../../../../../packages/commun/src/types/lieu.ts";

const TYPES: ReadonlySet<string> = new Set<TypeLieu>(["resto", "patisserie", "bar", "sortie"]);

const lireChaine = (valeur: unknown) => (typeof valeur === "string" ? valeur.trim() : null);

export function lireLieuCiteActus(brut: unknown): LieuCiteActus | null {
  if (typeof brut !== "object" || brut === null) return null;
  const { id, nom, type, emoji, quartier, ville, verifie } = brut as Record<string, unknown>;
  const [nomLu, emojiLu, quartierLu, villeLu] = [nom, emoji, quartier, ville].map(lireChaine);
  if (!Number.isSafeInteger(id) || !nomLu || typeof type !== "string" || !TYPES.has(type) || emojiLu === null || quartierLu === null || !villeLu) return null;
  return { id: id as number, nom: nomLu, type: type as TypeLieu, emoji: emojiLu, quartier: quartierLu, ville: villeLu, verifie: verifie === true };
}
