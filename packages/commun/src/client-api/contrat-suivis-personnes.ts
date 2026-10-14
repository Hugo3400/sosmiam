// Contrat des suivis entre personnes (compte connecté), mêmes routes que l'API (/app/suivis-personnes) : suivre à sens
// unique, tout de suite pour un compte public, sur demande pour un compte privé. On ne prévient jamais l'autre d'un refus,
// d'un retrait ni d'un « ne plus suivre ». Une personne est toujours désignée par son identifiant public. Les lieux et les
// pseudos de créateurs se suivent ailleurs (contrat de l'activité).

import type { LienSuiviApi, PageLiensSuiviApi, ResumeSuivisApi } from "../types/suivis.ts";
import type { ReponseApi } from "./reponse-api.ts";

export interface ServiceSuivisPersonnes {
  /** GET /app/suivis-personnes : prive, compteurs, demandes reçues et envoyées (50 chacune) */
  lireResume(): Promise<ReponseApi<{ suivis: ResumeSuivisApi }>>;
  /** GET /app/suivis-personnes/abonnes[?apres=] : 50 par page ; apres : la `suite` de la page d'avant, renvoyée telle quelle */
  listerAbonnes(apres?: string): Promise<ReponseApi<PageLiensSuiviApi>>;
  /** GET /app/suivis-personnes/abonnements[?apres=] : personnes seulement */
  listerAbonnements(apres?: string): Promise<ReponseApi<PageLiensSuiviApi>>;
  /**
   * PUT (suivi vrai) ou DELETE /app/suivis-personnes/abonnements/:personne. Suivre rend etat (« suivi » ou « demande ») et
   * deja ; ne plus suivre annule aussi une demande. « personne-inconnue », « trop-d-abonnements »
   */
  suivre(id: string, suivi: boolean): Promise<ReponseApi<{ etat?: "suivi" | "demande"; deja?: boolean }>>;
  /**
   * POST /app/suivis-personnes/demandes/:personne/accepter (accepte vrai, rend lien) ou DELETE …/demandes/:personne (refus
   * silencieux). « demande-inconnue »
   */
  repondreDemande(id: string, accepte: boolean): Promise<ReponseApi<{ lien?: LienSuiviApi }>>;
  /** DELETE /app/suivis-personnes/abonnes/:personne */
  retirerAbonne(id: string): Promise<ReponseApi>;
  /** PUT /app/suivis-personnes/confidentialite : repasser en public accepte les demandes en attente (acceptees) */
  changerConfidentialite(prive: boolean): Promise<ReponseApi<{ prive: boolean; acceptees: number }>>;
}
