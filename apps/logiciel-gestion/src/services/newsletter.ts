import type { JSONContent } from "@tiptap/react";

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

export type EtatBoite = {
  /** Le fichier de connexion à la boîte bonjour@ existe sur le serveur */
  boiteConfiguree: boolean;
  derniereSynchro: string | null;
  /** Inscrits de la liste complète (formulaire + mails), après la dernière synchronisation */
  total: number;
  /** Arrivés seulement par mail (pas dans la base) */
  parMailSeulement: { adresse: string; ville: string; inscritLe: string }[];
};
export const lireBoite = () => appeler<EtatBoite>("GET", "/newsletter/boite");
export const synchroniserBoite = () => appeler<{ ok: boolean; message: string }>("POST", "/newsletter/boite/synchroniser");

export type ResumeBrouillon = { id: number; objet: string; creeLe: string; modifieLe: string };
/** contenu : document de l'éditeur visuel ; null pour un ancien brouillon écrit en Markdown (dans texte) */
export type Brouillon = ResumeBrouillon & { texte: string; contenu: JSONContent | null };

export const listerInscrits = (filtres: FiltresInscrits) => appeler<ListeInscrits>("GET", `/newsletter/inscrits${parametres(filtres)}`);
export const desinscrire = (id: number) => appeler<{ ok: true }>("DELETE", `/newsletter/inscrits/${id}`);
export const exporterInscrits = () => appeler<string>("GET", "/newsletter/export", { reponse: "texte" });

export const listerBrouillons = () => appeler<ResumeBrouillon[]>("GET", "/newsletter/brouillons");
export const lireBrouillon = (id: number) => appeler<Brouillon>("GET", `/newsletter/brouillons/${id}`);
export const enregistrerBrouillon = (id: number | null, saisie: { objet: string; texte: string; contenu: JSONContent }) =>
  id ? appeler<Brouillon>("PUT", `/newsletter/brouillons/${id}`, { corps: saisie }) : appeler<Brouillon>("POST", "/newsletter/brouillons", { corps: saisie });
export const supprimerBrouillon = (id: number) => appeler<{ ok: true }>("DELETE", `/newsletter/brouillons/${id}`);
