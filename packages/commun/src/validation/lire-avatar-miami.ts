import { AVATAR_CAPITAINE, AVATARS_MIAMIS, PREFIXE_AVATAR_MIAMI, type IdMiami } from "../regles/avatars-miamis.ts";

export type AvatarMiami = { id: IdMiami; nom: string; /** Le Capitaine : réservé au compte officiel, jamais au choix */ reserve: boolean };

/**
 * Le Miami d'une valeur d'avatar (« miami:toque »), ou null : un emoji, rien, ou un Miami que cette version ne connaît pas
 * (on affiche alors l'avatar par défaut). Le Capitaine est reconnu, avec reserve : vrai ; pour le choix d'une personne,
 * refuser un Miami réservé.
 */
export function lireAvatarMiami(valeur: unknown): AvatarMiami | null {
  if (typeof valeur !== "string" || !valeur.startsWith(PREFIXE_AVATAR_MIAMI)) return null;
  const id = valeur.slice(PREFIXE_AVATAR_MIAMI.length);
  if (id === AVATAR_CAPITAINE.id) return { ...AVATAR_CAPITAINE, reserve: true };
  const miami = AVATARS_MIAMIS.find((m) => m.id === id);
  return miami ? { ...miami, reserve: false } : null;
}
