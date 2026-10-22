export type BrouillonChat = { texte: string; le: string };

export type BrouillonsChat = ReadonlyMap<string, BrouillonChat>;

export const MAX_BROUILLONS_CHAT = 50;
