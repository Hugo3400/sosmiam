import { appeler, parametres } from "./client-gestion.ts";

export type ResultatsRecherche = {
  lieux: { id: number; nom: string; emoji: string; ville: string; statut: string }[];
  comptes: { id: number; prenom: string; email: string; ambassadeur: { statut: string } | null }[];
  publications: { id: number; legende: string; statut: string; lieu: { nom: string; emoji: string } }[];
  bigSos: { id: number; statut: string; lieu: { nom: string; emoji: string; ville: string } }[];
  demandes: { id: number; nom: string; ville: string; statut: string }[];
  inscrits: { id: number; email: string; ville: string | null }[];
};

export const rechercherPartout = (q: string) => appeler<ResultatsRecherche>("GET", `/recherche${parametres({ q })}`);
