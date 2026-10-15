export type Genre = "femme" | "homme" | "autre";

export type ChoixGenre = Genre | "ne-pas-dire";

export type GenreProfil = { choix: ChoixGenre | null; modifieLe: string | null };
