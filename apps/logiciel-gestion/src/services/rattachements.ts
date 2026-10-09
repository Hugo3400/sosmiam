// Rattachements d'un compte pro à son lieu (« Lieu vérifié ✓ ») : demandes de gérant à valider, et équipes.
import { appeler, parametres } from "./client-gestion.ts";
import type { LieuControle } from "./lieux.ts";

export type StatutRattachement = "en-attente" | "valide" | "refuse" | "retire";
export type Rattachement = {
  id: number;
  lieuId: number;
  compteId: number;
  role: "gerant" | "equipe";
  preuve: string;
  siret: string | null;
  statut: StatutRattachement;
  reponse: string | null;
  creeLe: string;
  decideLe: string | null;
  lieu: LieuControle & { siteWeb: string | null; telephone: string | null };
  compte: { id: number; prenom: string; email: string; emailVerifieLe: string | null };
};

export const listerRattachements = (filtres: { statut?: string; role?: string; lieu?: number }) =>
  appeler<Rattachement[]>("GET", `/rattachements${parametres({ statut: filtres.statut ?? "", role: filtres.role ?? "", lieu: filtres.lieu ? String(filtres.lieu) : "" })}`);
export const deciderRattachement = (id: number, decision: "valider" | "refuser" | "retirer", reponse: string | null, envoyer: boolean) =>
  appeler<{ ok: true; statut: StatutRattachement; mail: "envoye" | "aucun" | "echec" }>("POST", `/rattachements/${id}/decision`, { corps: { decision, reponse, envoyer } });
