import { appeler, parametres } from "./client-gestion.ts";

// Mêmes valeurs que packages/commun/src/types/lieu.ts
export type TypeLieu = "resto" | "patisserie" | "bar" | "sortie";
export type EnvieLieu = "terrasse" | "vege" | "amoureux" | "potes" | "famille";
export type StatutLieu = "brouillon" | "publie" | "masque";
export type CreneauOuverture = { jours: number[]; de: string; a: string };

export type SaisieLieu = {
  nom: string;
  type: TypeLieu;
  emoji: string;
  info: string;
  texte: string;
  adresse: string | null;
  quartier: string;
  ville: string;
  latitude: number | null;
  longitude: number | null;
  prix: "€" | "€€" | "€€€";
  prixMoyen: number | null;
  couleurs: [string, string];
  horaires: string;
  ouverture: CreneauOuverture[];
  plat: string;
  tags: string[];
  envies: EnvieLieu[];
  reservable: boolean;
  telephone: string | null;
  siteWeb: string | null;
  instagram: string | null;
  decouvertPar: string | null;
  statut: StatutLieu;
  note: string | null;
};

export type Lieu = SaisieLieu & { id: number; creeLe: string; modifieLe: string };

export type ResumeLieu = Pick<Lieu, "id" | "nom" | "type" | "emoji" | "info" | "quartier" | "ville" | "statut" | "couleurs" | "modifieLe"> & {
  _count: { publications: number };
};

export const listerLieux = (recherche = "", statut = "") => appeler<ResumeLieu[]>("GET", `/lieux${parametres({ recherche, statut })}`);
export const lireLieu = (id: number) => appeler<Lieu>("GET", `/lieux/${id}`);
export const enregistrerLieu = (id: number | null, saisie: SaisieLieu) =>
  id ? appeler<Lieu>("PUT", `/lieux/${id}`, { corps: saisie }) : appeler<Lieu>("POST", "/lieux", { corps: saisie });
export type ResultatAdresse = { libelle: string; nom: string; ville: string; codePostal: string; latitude: number; longitude: number; score: number };
/** Adresses trouvées par le service public de géocodage (IGN), pour remplir les coordonnées d'un lieu */
export const chercherAdresse = (adresse: string) => appeler<ResultatAdresse[]>("GET", `/geocodage${parametres({ adresse })}`);
export const supprimerLieu = (id: number) => appeler<{ ok: true }>("DELETE", `/lieux/${id}`);
