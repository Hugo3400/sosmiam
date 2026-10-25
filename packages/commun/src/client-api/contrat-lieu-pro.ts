// Contrat de ce que l'équipe d'un lieu règle « autour » du comptoir (mode pro de l'app, puis pro.sosmiam.fr) : le SOS
// « place ce soir » et le message du moment, les statistiques de la semaine, et les événements du lieu. Gérant ET équipe ;
// le rôle est toujours relu par le serveur (mêmes routes que l'API : /pro/comptoir/lieux/:id/…).

import type { ImageLieu } from "../regles/images-lieu.ts";
import type { ReglageEvenement, EvenementLieuPro } from "../types/evenement.ts";
import type { MomentLieu } from "../types/moment-lieu.ts";
import type { StatistiquesSemaine } from "../types/statistiques-lieu.ts";
import type { ReponseApi } from "./reponse-api.ts";

export type ReponseMoment = ReponseApi<{ moment: MomentLieu }>;
export type ReponseEvenementPro = ReponseApi<{ evenement: EvenementLieuPro }>;

/** jusqua null : jusqu'à la fermeture de ce soir (obligatoire si les horaires du lieu ne sont pas connus) */
export type LancementSos = { places: number; offre: string | null; jusqua: string | null };
/** jusqua null : jusqu'à la fermeture de ce soir, sinon 24 h ; 24 h au plus */
export type ReglageMessageMoment = { texte: string; jusqua: string | null };

export interface ServiceLieuPro {
  lireMoment(lieuId: number): Promise<ReponseMoment>;
  /** Erreurs : « champ-invalide » (places, offre, jusqua), « sos-deja-lance » (un par jour, même arrêté) */
  lancerSos(lieuId: number, sos: LancementSos): Promise<ReponseMoment>;
  /** Arrête le SOS en cours : il ne se relance pas le même jour */
  arreterSos(lieuId: number): Promise<ReponseMoment>;
  /** Erreurs : « champ-invalide » (texte, jusqua) */
  reglerMessage(lieuId: number, message: ReglageMessageMoment): Promise<ReponseMoment>;
  effacerMessage(lieuId: number): Promise<ReponseMoment>;
  /** De la semaine en cours (la première) à la plus ancienne ; semaines : 1 à 26 (8 par défaut) */
  lireStatistiques(lieuId: number, semaines?: number): Promise<ReponseApi<{ semaines: StatistiquesSemaine[] }>>;
  /** À venir (le plus proche d'abord), puis finis ou annulés depuis 30 jours au plus */
  listerEvenements(lieuId: number): Promise<ReponseApi<{ evenements: EvenementLieuPro[] }>>;
  /** Erreurs : « evenement-invalide » (champ), « trop-d-evenements » (10 à venir) */
  creerEvenement(lieuId: number, reglage: ReglageEvenement): Promise<ReponseEvenementPro>;
  /** Le réglage en entier. Erreurs : « evenement-invalide », « evenement-inconnu », « evenement-passe », « transition-interdite » (annulé) */
  modifierEvenement(lieuId: number, evenementId: number, reglage: ReglageEvenement): Promise<ReponseEvenementPro>;
  /** Annule toutes ses dates restantes. Erreurs : « evenement-inconnu », « evenement-passe » */
  annulerEvenement(lieuId: number, evenementId: number): Promise<ReponseEvenementPro>;
  envoyerImage(lieuId: number, quelle: ImageLieu, octets: Blob | ArrayBuffer | Uint8Array): Promise<ReponseApi<{ adresse: string }>>;
  retirerImage(lieuId: number, quelle: ImageLieu): Promise<ReponseApi>;
}
