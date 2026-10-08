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
};
