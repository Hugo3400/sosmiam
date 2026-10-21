import type { StatutIdee } from "../../../../packages/commun/src/types/idees.ts";
import { appeler, parametres } from "./client-gestion.ts";

type Auteur = { pseudo: string | null; prenom: string } | null;
export type IdeeGestion = {
  id: number; titre: string; detail: string; statut: StatutIdee; auteur: Auteur; votes: number; commentaires: number;
  reponseBrigade: string | null; reponduLe: string | null; ideeDuMois: string | null; suspendue: boolean; retiree: boolean; publieeLe: string | null; creeLe: string;
};
export type CommentaireIdeeGestion = { id: number; texte: string; reponseAId: number | null; creeLe: string; auteur: Auteur; masque: boolean; suspendu: boolean; retire: boolean };
export type EtiquetteLibre = { sortieId: number; nom: string; retireeLe: string | null; titreSortie: string; organisateurId: number | null; quand: string };

export const listerIdees = (statut: StatutIdee | "") => appeler<{ idees: IdeeGestion[] }>("GET", `/communaute/idees${parametres({ statut })}`);
export const listerCommentairesIdee = (id: number) => appeler<{ commentaires: CommentaireIdeeGestion[] }>("GET", `/communaute/idees/${id}/commentaires`);
export const changerStatutIdee = (id: number, statut: StatutIdee) => appeler<{ ok: true }>("POST", `/communaute/idees/${id}/statut`, { corps: { statut } });
export const repondreIdee = (id: number, texte: string | null) => appeler<{ ok: true }>("POST", `/communaute/idees/${id}/reponse`, { corps: { texte } });
export const choisirIdeeDuMois = (id: number, mois: string) => appeler<{ ok: true }>("POST", `/communaute/idees/${id}/idee-du-mois`, { corps: { mois } });
export const supprimerIdee = (id: number) => appeler<{ ok: true }>("DELETE", `/communaute/idees/${id}`);
export const masquerCommentaireIdee = (id: number, masque: boolean) => appeler<{ ok: true }>("POST", `/communaute/commentaires/${id}/masque`, { corps: { masque } });
export const listerEtiquettesLibres = (retirees: boolean) => appeler<{ etiquettes: EtiquetteLibre[] }>("GET", `/communaute/etiquettes${parametres({ retirees: retirees ? "oui" : "" })}`);
export const retirerEtiquetteLibre = (sortieId: number, nom: string) => appeler<{ ok: true }>("POST", "/communaute/etiquettes/retrait", { corps: { sortieId, nom } });
export const retirerSortieMiamis = (id: number) => appeler<{ ok: true }>("POST", `/communaute/sorties-miamis/${id}/retrait`, { corps: {} });
