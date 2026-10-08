import { appeler } from "./client-gestion.ts";

export type AnnonceDiscord = {
  id: number;
  titre: string;
  texte: string;
  /** « en-attente » : le bot va la publier (dans les 30 secondes) */
  statut: "en-attente" | "publiee" | "echec";
  lienMessage: string | null;
  erreur: string | null;
  creeLe: string;
  publieeLe: string | null;
};

export const listerAnnonces = () => appeler<AnnonceDiscord[]>("GET", "/annonces");
export const envoyerAnnonce = (titre: string, texte: string) => appeler<AnnonceDiscord>("POST", "/annonces", { corps: { titre, texte } });
export const retirerAnnonce = (id: number) => appeler<{ ok: true }>("DELETE", `/annonces/${id}`);
