// La relecture des avis : la file (avis en relecture, réponses des lieux à relire) et la décision de l'équipe.
import { appeler, parametres } from "./client-gestion.ts";

type LieuAvis = { id: number; nom: string; emoji: string; ville: string };
export type AvisARelire = {
  id: number; compteId: number; note: number; texte: string; signature: string; raisonRelecture: string | null; repasOffert: boolean; creeLe: string;
  avecPhoto: boolean; verifie: boolean; lieu: LieuAvis;
  /** Verdicts consultatifs des ambassadeurs, comptés (jamais qui) */
  verdicts: { ok: number; louche: number; motifs: string[] };
  /** Les avis de l'auteur en tout, et ceux déjà masqués */
  auteur: { avis: number; masques: number };
};
export type ReponseARelire = {
  id: number; note: number; texte: string; signature: string; statut: string; reponseTexte: string; reponseLe: string; reponseParId: number | null; lieu: LieuAvis;
};
export type FileAvis = { compteurs: { avis: number; reponses: number }; parPage: number; avis: AvisARelire[]; reponses: ReponseARelire[] };
export type DecisionAvis = { action: "publier" } | { action: "masquer"; motif: string; motivation: string };

export const listerAvisARelire = (quoi: "avis" | "reponses", page: number) => appeler<FileAvis>("GET", `/avis/a-relire${parametres({ quoi, page })}`);
export const trancherAvis = (id: number, decision: DecisionAvis) => appeler<{ ok: true }>("POST", `/avis/${id}/decision`, { corps: decision });
export const trancherReponseAvis = (id: number, decision: DecisionAvis) => appeler<{ ok: true }>("POST", `/avis/${id}/reponse/decision`, { corps: decision });
