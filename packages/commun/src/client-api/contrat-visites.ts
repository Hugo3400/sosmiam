// Contrat du service des visites, côté client : demander l'addition, scanner le QR du comptoir, suivre ses visites.

import type { LecturePosition } from "../types/position.ts";
import type { InfosVisiteLieu, ResultatValidation, Visite } from "../types/visite.ts";
import type { Desabonner, ReponseApi } from "./reponse-api.ts";

export interface ServiceVisites {
  lireLieu(lieuId: number): Promise<ReponseApi<{ infos: InfosVisiteLieu }>>;
  listerLieuxQuiValident(): Promise<ReponseApi<{ lieux: number[] }>>;
  demanderAddition(lieuId: number, position: LecturePosition): Promise<ReponseApi<{ visite: Visite }>>;
  validerComptoir(texteScanne: string, position: LecturePosition): Promise<ReponseApi<ResultatValidation>>;
  lireVisite(id: number): Promise<ReponseApi<ResultatValidation>>;
  annulerDemande(id: number): Promise<ReponseApi<{ visite: Visite }>>;
  contesterRefus(id: number, mot: string): Promise<ReponseApi<{ visite: Visite }>>;
  /** points : total des visites et des avis avec photo (journal), à ajouter aux points comptés sur le téléphone */
  listerVisites(): Promise<ReponseApi<{ visites: Visite[]; enCours: Visite | null; points: number }>>;
  ecouter(rappel: () => void): Desabonner;
}
