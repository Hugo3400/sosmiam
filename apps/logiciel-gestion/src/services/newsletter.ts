import { appeler, parametres } from "./client-gestion.ts";

export type Inscrit = {
  id: number;
  email: string;
  ville: string | null;
  ambassadeur: boolean;
  beta: boolean;
  telephone: "iphone" | "android" | null;
  source: string;
  premiereInscription: string;
  derniereInscription: string;
  aRelancer: boolean;
};

export type ListeInscrits = {
  total: number;
  trouves: number;
  parPage: number;
  compteurs: { ambassadeurs: number; aRelancer: number; recents: number; beta: number; iphone: number; android: number };
  villes: { ville: string; nombre: number }[];
  inscrits: Inscrit[];
};

export type FiltresInscrits = {
  recherche: string;
  ville: string;
  ambassadeur: boolean;
  beta: boolean;
  telephone: "" | "iphone" | "android";
  relance: boolean;
  page: number;
};

export type ResumeBrouillon = { id: number; objet: string; creeLe: string; modifieLe: string };
export type Brouillon = ResumeBrouillon & { texte: string };

export const listerInscrits = (filtres: FiltresInscrits) => appeler<ListeInscrits>("GET", `/newsletter/inscrits${parametres(filtres)}`);
export const desinscrire = (id: number) => appeler<{ ok: true }>("DELETE", `/newsletter/inscrits/${id}`);
export const exporterInscrits = () => appeler<string>("GET", "/newsletter/export", { reponse: "texte" });

export const listerBrouillons = () => appeler<ResumeBrouillon[]>("GET", "/newsletter/brouillons");
export const lireBrouillon = (id: number) => appeler<Brouillon>("GET", `/newsletter/brouillons/${id}`);
export const enregistrerBrouillon = (id: number | null, saisie: { objet: string; texte: string }) =>
  id ? appeler<Brouillon>("PUT", `/newsletter/brouillons/${id}`, { corps: saisie }) : appeler<Brouillon>("POST", "/newsletter/brouillons", { corps: saisie });
export const supprimerBrouillon = (id: number) => appeler<{ ok: true }>("DELETE", `/newsletter/brouillons/${id}`);
