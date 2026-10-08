// Demandes de lieux : un lieu qui s'inscrit depuis le site, ou une pépite proposée sur Discord (reçue par le bot).
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";

export type NouvelleDemandeLieu = {
  origine: "lieu" | "communaute";
  nom: string;
  type: string | null;
  ville: string;
  adresse: string | null;
  description: string;
  plat: string | null;
  horaires: string | null;
  siteWeb: string | null;
  instagram: string | null;
  contactNom: string | null;
  contactEmail: string | null;
  contactTelephone: string | null;
  lienDiscord: string | null;
};

export async function enregistrerDemandeLieu(demande: NouvelleDemandeLieu): Promise<void> {
  await baseDeDonnees.demandeLieu.create({ data: demande });
}
