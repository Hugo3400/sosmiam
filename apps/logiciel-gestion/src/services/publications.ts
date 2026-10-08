import { appeler, parametres } from "./client-gestion.ts";

export type TypeMedia = "video" | "affiche" | "photo";
export type Media = { id: number; type: TypeMedia; fichier: string; typeMime: string; taille: number; ordre: number };
export type StatutPublication = "brouillon" | "publiee" | "masquee";

export type SaisiePublication = {
  lieuId: number;
  auteurType: "lieu" | "createur";
  auteurPseudo: string | null;
  partenariat: string | null;
  legende: string;
  illustration: boolean;
  statut: StatutPublication;
  /** Date ISO ; à venir = programmée */
  publieeLe: string | null;
};

export type Publication = Omit<SaisiePublication, "publieeLe"> & {
  id: number;
  publieeLe: string | null;
  /** Masquée pour tous par un signalement grave, en attente de la modération */
  suspendue: boolean;
  creeLe: string;
  modifieLe: string;
  lieu: { id: number; nom: string; emoji: string; couleurs: string[]; ville: string };
  medias: Media[];
};

export const listerPublications = (statut = "", lieu: number | null = null) =>
  appeler<Publication[]>("GET", `/publications${parametres({ statut, lieu })}`);
export const lirePublication = (id: number) => appeler<Publication>("GET", `/publications/${id}`);
export const enregistrerPublication = (id: number | null, saisie: SaisiePublication) =>
  id ? appeler<Publication>("PUT", `/publications/${id}`, { corps: saisie }) : appeler<Publication>("POST", "/publications", { corps: saisie });
export const supprimerPublication = (id: number) => appeler<{ ok: true }>("DELETE", `/publications/${id}`);
export const ajouterMedia = (id: number, type: TypeMedia, fichier: File) =>
  appeler<Media>("POST", `/publications/${id}/medias${parametres({ type })}`, { fichier });
export const retirerMedia = (id: number, idMedia: number) => appeler<{ ok: true }>("DELETE", `/publications/${id}/medias/${idMedia}`);
/** Le fichier d'un média (demande signée : une simple balise <img src> ne passerait pas) */
export const lireFichierMedia = (fichier: string) => appeler<Blob>("GET", `/medias/${fichier}`, { reponse: "blob" });
