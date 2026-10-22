const LONGUEUR_MAX_NOM = 120;

export function ecrireTexteSondageClos(r: { nom: string | null; ordre: number; voix: number; votants: number } | null): string {
  if (!r || r.votants === 0) return "Le vote est fini, personne n'a voté.";
  const nom = r.nom?.trim() ? [...r.nom.trim()].slice(0, LONGUEUR_MAX_NOM).join("") : `la proposition n°${r.ordre}`;
  return `Le vote est fini : ${nom} gagne avec ${r.voix} voix sur ${r.votants}.`;
}
