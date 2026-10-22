// Partie sociale servie par l'API (décidée le 8 et le 14 octobre 2026, docs/decisions.md « Potes, messagerie et profils sur
// le serveur ») : une personne vue par les autres, son profil, ses réglages et le pouls que l'app relit. L'app est réservée
// aux majeurs : aucune règle d'âge ici. Les autres formes sont rangées par domaine (bande, listes, sorties, messagerie, cloche).
import type { ListeResumeApi } from "./listes.ts";

/** Une personne en petit, telle que les autres la voient (listes, messages, commentaires, cloche) */
export type PersonneResume = {
  /** Identifiant public (10 caractères), stable même si le pseudo change */
  id: string;
  pseudo: string;
  prenom: string;
  /** Avatar public : un emoji, « miami:<id> » ou « photo:<nom> » ; null : pas choisi (l'app met son avatar par défaut) */
  avatar: string | null;
};

/** « bande » : tout ; « public » : la vitrine (badges, listes « tous ») ; « prive » : l'en-tête et les compteurs */
export type NiveauProfil = "bande" | "public" | "prive";

/**
 * Où en est une invitation à accepter (sortie, groupe, liste à remplir à plusieurs) : « invite » (en attente), « accepte »,
 * ou « refuse » (en silence, noté pour qu'on ne puisse pas réinviter en boucle).
 */
export type StatutInvitation = "invite" | "accepte" | "refuse";

export type RelationApi = {
  pote: boolean;
  demandeBande: "envoyee" | "recue" | null;
  jeSuis: "aucun" | "demande" | "suivi";
  meSuit: boolean;
  /** Elle a demandé à te suivre (demande en attente, pas refusée) : RelationPersonne.demandeRecue de l'app */
  meDemande: boolean;
  /** Tu l'as bloquée (l'inverse n'est jamais dit : le profil répond 404) */
  bloque: boolean;
};

export type ProfilCommunautaireApi = PersonneResume & {
  niveau: NiveauProfil;
  prive: boolean;
  compteurs: { abonnes: number; abonnements: number };
  /** null : c'est toi */
  relation: RelationApi | null;
  /** Niveaux « public » et « bande » */
  badges?: string[];
  listes?: ListeResumeApi[];
  /** Niveau « bande » (et toi) ; lieuxSauves et gardes vides si la personne ne partage pas son activité */
  bande?: {
    ville: string | null;
    points: number;
    palier: string;
    pointsDuMois: number;
    rescoussesDuMois: number;
    lieuxSauves: number[];
    gardes: number[];
  };
};

export type ReglagesSociaux = { trouvable: boolean; suggerable: boolean; activitePartagee: boolean; pushSocial: boolean };

export type ReglagesMessagerie = { accusesLecture: boolean; apercuMessages: boolean };

export type MoiSocial = { personne: PersonneResume; prive: boolean; reglages: ReglagesSociaux & ReglagesMessagerie };

export type PoulsSocial = {
  /**
   * signature : change quand il faut relire ; jamais à comparer autrement que par l'égalité.
   * invitations : les invitations à rejoindre un groupe qui attendent ta réponse (« Rejoindre le groupe ? »)
   */
  messages: { nonLus: number; invitations: number; signature: string };
  sorties: { invitations: number; nonLus: number; signature: string };
  cloche: { nonVues: number; signature: string };
  demandes: { bande: number; suivis: number; signature: string };
  bande: { signature: string };
};

export type SuggestionPersonneApi = { personne: PersonneResume; raison: "te-suit" | "ta-bande" | "potes-en-commun" };

/** Ce qu'on retire de SA vue ; ce qu'on a signalé n'y est jamais (signalements sociaux) */
export type CibleMasque = "sortie" | "activite" | "liste" | "lieu-recu" | "suggestion";
