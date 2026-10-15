import type { CibleAnnonceApp } from "../../../../packages/commun/src/regles/annonces-app.ts";
import { appeler } from "./client-gestion.ts";

export type PopUpApp = {
  id: number; titre: string; texte: string; emoji: string | null; boutonLibelle: string | null; boutonLien: string | null;
  cible: CibleAnnonceApp; ville: string | null; debut: string; fin: string | null; publieeLe: string | null; retireeLe: string | null;
  creeLe: string; modifieLe: string;
};
export type SaisiePopUpApp = Pick<PopUpApp, "titre" | "texte" | "emoji" | "boutonLibelle" | "boutonLien" | "cible" | "ville" | "fin"> & { debut: string | null };

export const listerPopUps = () => appeler<{ annonces: PopUpApp[] }>("GET", "/annonces-app");
export const creerPopUp = (saisie: SaisiePopUpApp) => appeler<{ ok: true; id: number }>("POST", "/annonces-app", { corps: saisie });
export const modifierPopUp = (id: number, saisie: SaisiePopUpApp) => appeler<{ ok: true }>("PUT", `/annonces-app/${id}`, { corps: saisie });
export const publierPopUp = (id: number, publiee: boolean) => appeler<{ ok: true }>("POST", `/annonces-app/${id}/publication`, { corps: { publiee } });
export const supprimerPopUp = (id: number) => appeler<{ ok: true }>("DELETE", `/annonces-app/${id}`);
