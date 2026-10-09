// Contrat du service des avis, côté client : avis à écrire, envoyer le sien (vérifié, ou non vérifié chez un lieu sans
// compte SOS Miam), lire ceux d'un lieu page par page. Routes de l'API : /app/avis (apps/api/src/routes/avis.ts).

import type { AvisPublic, NouvelAvis, NouvelAvisNonVerifie, ResumeAvis } from "../types/avis.ts";
import type { Visite } from "../types/visite.ts";
import type { ReponseApi } from "./reponse-api.ts";

export interface ServiceAvis {
  listerAvisAEcrire(): Promise<ReponseApi<{ visites: Visite[] }>>;
  /** avis : l'avis tel que les autres le verront (l'API le rend ; la démo peut s'en passer) */
  envoyerAvis(avis: NouvelAvis): Promise<ReponseApi<{ pointsGagnes: number; avis?: AvisPublic }>>;
  /** apres : le curseur `suite` de la page précédente ; suite : celui de la page suivante (null à la dernière) */
  listerAvisLieu(lieuId: number, apres?: string | null): Promise<ReponseApi<{ resume: ResumeAvis; avis: AvisPublic[]; suite?: string | null }>>;
  /** Avis « non vérifié », sans points : facultatif tant que la démo ne le propose pas */
  envoyerAvisNonVerifie?(avis: NouvelAvisNonVerifie): Promise<ReponseApi<{ pointsGagnes: number; avis?: AvisPublic }>>;
}
