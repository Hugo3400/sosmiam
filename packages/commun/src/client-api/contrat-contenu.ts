// Contrat du contenu lu par l'app, avec ou sans compte : lieux publiés, leur carte, le lieu d'un QR de vitrine, le fil
// « Pour toi », et la vue d'une fiche (compteur anonyme pour les statistiques du lieu). Mêmes routes que l'API (/app/…).

import type { CarteLieu } from "../types/carte.ts";
import type { LieuApi } from "../types/lieu.ts";
import type { PublicationApi } from "../types/publication.ts";
import type { ReponseApi } from "./reponse-api.ts";

/** Un rectangle de la carte (degrés) */
export type ZoneCarte = { nord: number; sud: number; ouest: number; est: number };

export interface ServiceContenu {
  /** Les lieux publiés (dans la zone si elle est donnée), 1 000 au plus : au-delà, l'app resserre sa zone */
  listerLieux(zone?: ZoneCarte): Promise<ReponseApi<{ lieux: LieuApi[] }>>;
  /** « lieu-inconnu » : absent, brouillon ou masqué */
  lireLieu(id: number): Promise<ReponseApi<{ lieu: LieuApi }>>;
  /** La carte complète, alcool compris (l'app le retire pour les moins de 18 ans) ; majLe : le moment exact */
  lireCarte(id: number): Promise<ReponseApi<{ carte: CarteLieu | null; majLe: string | null }>>;
  /** Le lieu d'un QR de vitrine (sosmiam.fr/l/<code>) */
  trouverParCode(codePublic: string): Promise<ReponseApi<{ lieuId: number }>>;
  /** Le fil, du plus récent au plus ancien ; suite : le curseur de la page suivante (null : c'est tout) */
  listerPublications(apres?: string | null, limite?: number): Promise<ReponseApi<{ publications: PublicationApi[]; suite: string | null }>>;
  /** Une vue de la fiche (un compteur par jour et par lieu, sans savoir qui) ; un échec ne compte pas */
  compterVue(lieuId: number): Promise<void>;
}
