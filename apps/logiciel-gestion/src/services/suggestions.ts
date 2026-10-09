// Modifications de fiches de lieux proposées par un client ou par le lieu : l'équipe accepte tout, une partie, ou refuse.
import { appeler, parametres } from "./client-gestion.ts";
import type { Lieu } from "./lieux.ts";

export type StatutSuggestion = "en-attente" | "acceptee" | "partielle" | "refusee";
export type Suggestion = {
  id: number;
  lieuId: number;
  compteId: number | null;
  source: "client" | "pro";
  /** Seulement les champs qui changent, avec les noms de la fiche */
  proposition: Record<string, unknown>;
  /** Ces champs tels qu'ils étaient quand la personne a fait sa suggestion */
  avant: Record<string, unknown>;
  message: string | null;
  statut: StatutSuggestion;
  champsAcceptes: string[];
  reponse: string | null;
  creeLe: string;
  decideLe: string | null;
  lieu: Pick<Lieu, "id" | "nom" | "emoji" | "ville" | "couleurs" | "statut">;
  compte: { id: number; prenom: string; email: string } | null;
};

export const listerSuggestions = (statut: string, lieu?: number) => appeler<Suggestion[]>("GET", `/suggestions${parametres({ statut, lieu: lieu ? String(lieu) : "" })}`);
/** champs : ceux à appliquer (vide : refusée) ; reponse envoyée par mail à l'auteur si envoyer */
export const deciderSuggestion = (id: number, champs: string[], reponse: string | null, envoyer: boolean) =>
  appeler<{ ok: true; statut: StatutSuggestion; champs: string[]; mail: "envoye" | "aucun" | "echec" }>("POST", `/suggestions/${id}/decision`, { corps: { champs, reponse, envoyer } });
