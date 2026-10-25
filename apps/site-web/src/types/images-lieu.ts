export type Dimensions = { largeur: number; hauteur: number };

export type Cadre = { x: number; y: number; largeur: number; hauteur: number };

export type ReglageRecadrage = { zoom: number; x: number; y: number };

export type BrouillonImageLieu = { source: ImageBitmap; reglage: ReglageRecadrage };

export type ImagesDuLieu = { banniere: string | null; logo: string | null };

export type VisuelImageLieu = { genre: "adresse"; adresse: string } | { genre: "toile"; source: ImageBitmap; cadre: Cadre } | null;

export type ReponseImageLieu = { ok: true; adresse: string | null } | { ok: false; erreur: string; jusqua: string | null };

export type MessageImageLieu = { titre: string; texte: string };

export type LieuApercuImages = { nom: string; info: string; quartier: string; ville: string; emoji: string; couleurs: string[]; estVerifie: boolean };
