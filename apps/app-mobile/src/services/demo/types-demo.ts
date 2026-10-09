// Types du faux serveur de la démo des visites (en développement seulement). Contrat partagé par les lots 0, 2, 3 et 4 :
// tout ce qui touche la démo passe par le magasin (MagasinDemoVivant), jamais par AsyncStorage directement.
import type { Desabonner } from "@sos-miam/commun/client-api/reponse-api";
import type { AvisARelire, NoteAvis, StatutAvis, VerdictRelecture } from "@sos-miam/commun/types/avis";
import type { MessageAmbassadeur, MissionAmbassadeur } from "@sos-miam/commun/types/espace-ambassadeur";
import type { DemandeRecompense, ProgrammeFidelite, RecompensePrete } from "@sos-miam/commun/types/fidelite";
import type { CarteLieu } from "@sos-miam/commun/types/carte";
import type { InfosPratiques } from "@sos-miam/commun/types/infos-pratiques";
import type { PropositionLieu } from "@sos-miam/commun/types/proposition-lieu";
import type { ResultatPosition } from "@sos-miam/commun/types/position";
import type { MotifRefusReservation, StatutReservation } from "@sos-miam/commun/types/reservation";
import type { RolesCompte } from "@sos-miam/commun/types/roles";
import type { ModeValidation, MotifRefusVisite, ReglementVisite, StatutVisite } from "@sos-miam/commun/types/visite";

/** « moi » : la personne qui tient le téléphone ; les figurants jouent les autres clients (Karim, Inès) */
export type CleClientDemo = "moi" | `figurant:${string}`;
export type ClientDemo = { cle: CleClientDemo; prenom: string; initialeNom: string | null; avatar: string; majeur: boolean };

export type VisiteDemo = {
  id: number;
  lieuId: number;
  client: CleClientDemo;
  mode: ModeValidation;
  statut: StatutVisite;
  code: string | null;
  creeLe: string;
  expireLe: string | null;
  valideLe: string | null;
  decideLe: string | null;
  pendantSos: boolean;
  points: number;
  tampon: boolean;
  resultatPosition: ResultatPosition | null;
  motifRefus: MotifRefusVisite | null;
  contestee: boolean;
  avisOuvertLe: string | null;
  avisFermeLe: string | null;
  avisDonne: boolean;
  presentationId: number | null;
  reservationId: number | null;
  annulableJusqua: string | null;
  /** Comment l'équipe l'a réglée (absent dans un magasin enregistré avant le 9 octobre 2026 : lu « payée ») */
  reglement?: ReglementVisite | null;
};

export type PresentationDemo = {
  id: number;
  lieuId: number;
  personnes: number;
  restantes: number;
  creeLe: string;
  expireLe: string;
  cachee: boolean;
  /** Comment la table a réglé : vaut pour chaque visite validée avec ce QR (absent : payée) */
  reglement?: ReglementVisite;
};

export type CarteDemo = { lieuId: number; client: CleClientDemo; tampons: number; pretes: RecompensePrete[]; demande: DemandeRecompense | null };

export type ReservationDemo = {
  id: number;
  lieuId: number;
  client: CleClientDemo;
  personnes: number;
  creneau: string;
  message: string | null;
  statut: StatutReservation;
  motifRefus: MotifRefusReservation | null;
  tardive: boolean;
  creeLe: string;
  reponduLe: string | null;
  presenceLe: string | null;
  code: string | null;
  visiteId: number | null;
};

export type AvisDemo = {
  id: number;
  visiteId: number | null;
  lieuId: number;
  client: CleClientDemo | "exemple";
  signature: string;
  note: NoteAvis;
  texte: string;
  photo: string | null;
  preuve: ModeValidation;
  creeLe: string;
  statut: StatutAvis;
  reponseLieu: { texte: string; le: string } | null;
};

export type LigneJournalDemo = {
  id: number;
  visiteId: number | null;
  avisId: number | null;
  valeur: number;
  raison: "visite" | "visite-sos" | "avis-photo" | "annulation-visite";
  le: string;
};

export type MagasinDemo = {
  v: 2;
  creeLe: string;
  prochainId: number;
  figurants: ClientDemo[];
  visites: VisiteDemo[];
  presentations: PresentationDemo[];
  programmes: ProgrammeFidelite[];
  cartes: CarteDemo[];
  reservations: ReservationDemo[];
  avis: AvisDemo[];
  avisARelire: AvisARelire[];
  relectures: { avisId: number; verdict: VerdictRelecture; le: string }[];
  missions: MissionAmbassadeur[];
  messages: MessageAmbassadeur[];
  journal: LigneJournalDemo[];
  contestations: { visiteId: number; mot: string; le: string }[];
  /** Infos pratiques remplies par le gérant (mode pro), par lieu ; absent dans un magasin d'avant le 9 octobre 2026 */
  infosPratiques?: Record<number, InfosPratiques>;
  /** Cartes (plats, boissons, formules) enregistrées par le gérant (mode pro), par lieu ; absent tant qu'aucune ne l'a été */
  cartesDuLieu?: Record<number, CarteLieu>;
  /** Propositions de modification envoyées par les clients (« Une info a changé ? »), relues plus tard par l'équipe */
  suggestions?: SuggestionDemo[];
};

/** Une proposition de modification d'une fiche, gardée telle que l'API la garde : seulement ce qui change */
export type SuggestionDemo = {
  id: number;
  lieuId: number;
  client: CleClientDemo;
  proposition: PropositionLieu;
  message: string | null;
  creeLe: string;
  statut: "en-attente" | "acceptee" | "refusee";
};

/** Un pépin réservé dans les Coulisses : il arrive une seule fois, à la prochaine demande qui peut le subir */
export type PepinDemo = "hors-zone" | "position-imprecise" | "refus-lieu" | "hors-ligne" | "qr-expire";
export type ReglagesDemo = { vraiePosition: boolean; lieuxRepondentSeuls: boolean; avisAccelere: boolean; pepin: PepinDemo | null };

export type MagasinDemoVivant = {
  /** Lit (après expiration de ce qui doit expirer), sans écrire si rien n'a changé */
  lire<T>(fn: (m: Readonly<MagasinDemo>, maintenantMs: number) => T): Promise<T>;
  /** Modifie, expire ce qui doit l'être, enregistre (AsyncStorage) et prévient les écouteurs */
  modifier<T>(fn: (m: MagasinDemo, maintenantMs: number) => T): Promise<T>;
  ecouter(rappel: () => void): Desabonner;
  remettreAZero(): Promise<void>;
};

export type ContexteDemo = {
  magasin: MagasinDemoVivant;
  lireClient: () => ClientDemo | null;
  lireRoles: () => RolesCompte;
  lireReglages: () => ReglagesDemo;
  maintenant: () => number;
};

export type OutilsDemo = {
  texteQrActif(): Promise<{ texte: string; lieuId: number } | null>;
  /** Crée une présentation comme l'équipe et rend le texte du QR (scan simulé sans mode pro) */
  montrerQrPour(lieuId: number, personnes?: number): Promise<string>;
  repondreCommeLeLieu(visiteId: number, reponse: { regler: true } | { regler: false; motif: MotifRefusVisite }): Promise<void>;
  /** Vrai si le mode pro de démo joue ce lieu : pas de réponse automatique, c'est toi qui réponds */
  lieuJoueParMoi(lieuId: number): boolean;
  remettreAZero(): Promise<void>;
};
