import { appeler, parametres } from "./client-gestion.ts";

export type ResultatsRecherche = {
  lieux: { id: number; nom: string; emoji: string; ville: string; statut: string }[];
  comptes: { id: number; prenom: string; pseudo: string | null; email: string; ambassadeur: { statut: string } | null }[];
  publications: { id: number; legende: string; statut: string; lieu: { nom: string; emoji: string } }[];
  bigSos: { id: number; statut: string; lieu: { nom: string; emoji: string; ville: string } }[];
  demandes: { id: number; nom: string; ville: string; statut: string }[];
  inscrits: { id: number; email: string; ville: string | null }[];
  // Ajoutés le 15/10/2026 : absents tant que l'API n'est pas redémarrée
  /** Par numéro seulement */
  signalements?: { id: number; cible: string; cibleId: string; statut: string; raison: string }[];
  defis?: { id: number; emoji: string; titre: string; debut: string; fin: string | null }[];
  missions?: { id: number; titre: string; statut: string; compteId: number; compte: { prenom: string } }[];
  evenements?: { id: number; titre: string; debut: string; suspendu: boolean; lieu: { nom: string; ville: string } }[];
  presse?: { id: string; nom: string; format: string; famille: string }[];
};

export const rechercherPartout = (q: string) => appeler<ResultatsRecherche>("GET", `/recherche${parametres({ q })}`);
