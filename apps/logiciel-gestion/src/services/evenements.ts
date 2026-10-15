// Les événements publiés par les lieux, vus par l'équipe : la liste et la suspension.
import { appeler, parametres } from "./client-gestion.ts";

export type VueEvenements = "a-venir" | "passes" | "suspendus";
export type EvenementGestion = {
  id: number; titre: string; type: string; description: string;
  debut: string; fin: string | null; hebdoJusqua: string | null;
  tarif: string; prixCentimes: number | null; places: number | null;
  /** Il y a de l'alcool (caché en visite sans compte) */
  alcool: boolean;
  creeLe: string; annuleLe: string | null; suspendu: boolean;
  /** Le compte du gérant qui l'a publié ; null : l'équipe */
  compteId: number | null;
  lieu: { id: number; nom: string; emoji: string; ville: string };
  _count: { interets: number };
};

export const listerEvenements = (filtres: { vue: VueEvenements; ville: string; page: number }) =>
  appeler<{ total: number; parPage: number; suspendus: number; evenements: EvenementGestion[] }>("GET", `/evenements${parametres(filtres)}`);
/** Suspendre demande un motif (gardé au journal) ; rétablir non */
export const suspendreEvenement = (id: number, suspendu: boolean, motif: string) =>
  appeler<{ ok: true }>("POST", `/evenements/${id}/suspension`, { corps: { suspendu, motif } });
