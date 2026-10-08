// Contrat du service des avis vérifiés, côté client : avis à écrire, envoyer le sien, lire ceux d'un lieu.

import type { AvisPublic, NouvelAvis, ResumeAvis } from "../types/avis.ts";
import type { Visite } from "../types/visite.ts";
import type { ReponseApi } from "./reponse-api.ts";

export interface ServiceAvis {
  listerAvisAEcrire(): Promise<ReponseApi<{ visites: Visite[] }>>;
  envoyerAvis(avis: NouvelAvis): Promise<ReponseApi<{ pointsGagnes: number }>>;
  listerAvisLieu(lieuId: number): Promise<ReponseApi<{ resume: ResumeAvis; avis: AvisPublic[] }>>;
}
