// Types des lieux tels que l'API les renvoie au public (GET /lieux). À rassembler plus tard dans packages/commun.

export type CategorieLieu = "resto" | "patisserie" | "bar" | "sortie";

/** Un lieu publié : seulement ce qui est public (ni note interne, ni téléphone, ni adresse exacte). */
export type LieuPublic = {
  id: number;
  nom: string;
  type: CategorieLieu;
  emoji: string;
  info: string;
  quartier: string;
  ville: string;
  prix: string;
  couleurs: string[];
  decouvertPar: string | null;
  logo?: string | null;
};

export type LieuListe = LieuPublic & { verifie: boolean; sos: { places: number } | null };

export type VilleLieux = { ville: string; nombre: number };

export type PageLieux = { lieux: LieuListe[]; total: number; page: number; pages: number };

export type EpingleLieu = { id: number; nom: string; type: CategorieLieu; latitude: number; longitude: number; sos: boolean };

export type ApercuLieu = LieuListe & { adresse: string | null };
