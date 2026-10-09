// « Lancer une ville » : les villes qui ont des lieux, et où en est chacune.
import { appeler, parametres } from "./client-gestion.ts";

export type VilleResume = { ville: string; lieux: number; enLigne: number };
export type LancementVille = {
  ville: string;
  commune: { nom: string; codeDepartement: string; population: number } | null;
  lieux: { total: number; enLigne: number; brouillons: number; brouillonsComplets: number; masques: number };
  ambassadeurs: { actifs: number; enAttente: number; ambassadeurDeVille: { id: number; prenom: string } | null };
  fondateurs: { zone: string; type: "ville" | "departement"; places: number; prises: number } | null;
  /** inscrits : null si la liste de la newsletter n'est pas lisible sur le serveur */
  public: { inscrits: number | null; appareils: number };
};

export const listerVilles = () => appeler<VilleResume[]>("GET", "/villes");
export const lireLancementVille = (ville: string) => appeler<LancementVille>("GET", `/villes/lancement${parametres({ ville })}`);
