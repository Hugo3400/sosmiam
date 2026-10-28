import { createContext, useContext } from "react";

import type { FilCommentaire } from "@sos-miam/commun/fonctions/commentaires/trier-commentaires";
import type { PlaceClassement } from "@sos-miam/commun/fonctions/potes/calculer-classement";
import type { Commentaire } from "@sos-miam/commun/types/commentaires";
import type { ActivitePote, ListePartagee, Pote, Recommandation, Sortie } from "@sos-miam/commun/types/potes";
import type { MoyenInvitation } from "@sos-miam/commun/client-api/contrat-bande";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { ListeResumeApi, VisibiliteListe } from "@sos-miam/commun/types/listes";
import type { CibleMasque, PersonneResume } from "@sos-miam/commun/types/social";
import type { SignalementContenu } from "@sos-miam/commun/types/signalement";
import type { DetailsPote } from "~/fonctions/communaute/convertir-personne-en-pote";
import type { ResultatRecherchePote } from "~/fonctions/communaute/chercher-par-pseudo";
import type { ResultatAjoutBande } from "~/hooks/utiliser-bande-compte";
import type { SourceSociale } from "~/hooks/utiliser-source-sociale";

export type { ResultatAjoutBande } from "~/hooks/utiliser-bande-compte";

/** Résultat d'un envoi de texte (message, commentaire, mot à un pote) */
export type ResultatTexte = "ok" | "vide" | "trop-long" | "mot-interdit";

export type NouvelleSortie = {
  titre: string;
  emoji: string;
  /** Jour et heure (ISO) */
  quand: string;
  /** Potes invités (identifiants), sans toi */
  invites: string[];
  /** Lieux proposés au départ */
  lieux: number[];
  /** Fin du vote (ISO) */
  finVote: string;
};

/**
 * Pourquoi une sortie n'est pas créée : un champ à revoir, trop de sorties à venir, ton compte limité par l'équipe (rien à
 * réessayer), ou pas de réseau (réessaie)
 */
export type ErreurNouvelleSortie = "titre" | "participants" | "lieux" | "quand" | "trop" | "compte-limite" | "reseau";

/** « Tu viens ? » : une sortie où l'on t'invite, vue avant de répondre (ni propositions, ni votes, ni discussion) */
export type InvitationSortie = {
  id: string;
  titre: string;
  emoji: string;
  /** Jour et heure de la sortie (ISO) */
  quand: string;
  /** Identifiants (trouverPote les connaît) ; null : compte supprimé */
  organisateur: string | null;
  invitePar: string | null;
  /** Combien ont déjà dit oui, organisateur compris */
  participants: number;
  /** Quand l'invitation est arrivée (ISO) */
  date: string;
};

export type NouvelleListeCommunaute = { titre: string; emoji: string; description: string; visibilite?: VisibiliteListe };

/** Pourquoi une liste n'est pas créée : un champ à revoir, trop de listes (50), ton compte limité, ou pas de réseau (réessaie) */
export type ErreurNouvelleListe = "titre" | "description" | "trop" | "compte-limite" | "reseau";

/**
 * Un geste qui s'affiche tout de suite (« ok » rendu avant la réponse) puis que le serveur refuse : il est défait, et ce
 * rappel dit pourquoi à l'écran qui l'avait annoncé (par exemple « compte-limite »). Compte connecté seulement
 */
export type SurRefusGeste = (erreur: ErreurService) => void;

export type EtatCommunaute = {
  /** D'où vient la bande : la démo, le serveur (compte connecté), ou rien encore (visite, attente) */
  source: SourceSociale;
  /** Faux tant que la communauté n'est pas lue (sur le téléphone, ou sur le serveur avec un compte) */
  pret: boolean;
  /** Ton profil communautaire : son id est le tien dans les données affichées (« moi » sur le téléphone ; lu par utiliserMonId) */
  moi: Pote;
  /** Ta bande (sans les personnes bloquées) */
  potes: Pote[];
  /** N'importe qui par son identifiant (toi, ta bande, les autres personnes connues), ou null */
  trouverPote: (id: string) => Pote | null;
  /** Recherche par pseudo dans les potes d'exemple (démo) ; avec un compte, c'est utiliserRecherchePseudo qui demande au serveur */
  chercherParPseudo: (texte: string) => ResultatRecherchePote[];
  /**
   * Rejoindre la bande de quelqu'un par son lien ou son QR code (pseudo et code secret lus par lireLienInvitation) : vous voilà
   * potes tout de suite. Démo : le code n'est vérifié nulle part
   */
  rejoindreParInvitation: (pseudo: string, code: string, moyen: MoyenInvitation) => Promise<ResultatAjoutBande>;
  /** Par son pseudo : une demande que l'autre accepte (ou, s'il t'avait déjà demandé, vous voilà potes). Démo : ajouté tout de suite */
  demanderAjout: (id: string) => Promise<ResultatAjoutBande>;
  /** Les demandes de bande qu'on t'a faites, et les tiennes en attente (vides en démo) */
  demandesRecues: Pote[];
  demandesEnvoyees: Pote[];
  /** Accepter sa demande : vous voilà potes. Rend l'erreur, ou null */
  accepterDemandeBande: (id: string) => Promise<ErreurService | null>;
  /** Refuser sa demande (il n'est pas prévenu) ou annuler la tienne. Rend l'erreur, ou null */
  retirerDemandeBande: (id: string) => Promise<ErreurService | null>;
  /** À l'ouverture de Potes (compte connecté) : crée ton profil social s'il manque, une fois par lancement */
  ouvrirProfilSocial: () => void;
  /** Le serveur attend ton pseudo pour ouvrir ta partie sociale */
  pseudoRequis: boolean;
  /** Une personne croisée ailleurs (son profil lu, une recherche) : trouverPote la connaît ensuite (compte connecté) */
  noterPersonne: (personne: PersonneResume, details?: DetailsPote) => void;
  /** Relit la bande, les demandes, l'activité et ce que tu as masqué (compte connecté) */
  relireBande: () => void;
  retirerPote: (id: string) => void;
  /**
   * Comment ce pote de ta bande a été ajouté : « pseudo », « exemple » (bande de la démo), ou undefined (pas ou plus dans ta bande).
   * Démo : un lien ou un QR code rend « lien-non-verifie » ou « qr-non-verifie », qui ne comptent pas « en vrai » tant que l'API
   * ne vérifie pas leur code secret.
   */
  moyenAjout: (id: string) => string | undefined;
  bloques: Pote[];
  /** Bloque quelqu'un : il sort de ta bande, ses messages et commentaires disparaissent pour toi */
  bloquer: (id: string) => void;
  debloquer: (id: string) => void;

  /** Tes sorties, à venir d'abord ; le lieu retenu est calculé à la fin du vote, et plus personne ne vote ensuite. Sans les lieux disparus de l'app. */
  sorties: Sortie[];
  trouverSortie: (id: string) => Sortie | null;
  /**
   * Crée la sortie : chaque invité reçoit « Tu viens ? » (compte connecté) ou la rejoint tout de suite (démo). cle : tirée
   * une fois à l'ouverture de l'écran, pour qu'un second appui ne crée pas deux sorties
   */
  creerSortie: (sortie: NouvelleSortie, cle?: string) => Promise<{ id: string } | { erreur: ErreurNouvelleSortie }>;
  /** Compte connecté : relit cette sortie (à l'ouverture de son écran) ; démo : rien */
  lireSortie: (id: string) => void;
  /** Vote (ou retire ton vote) pour un lieu ; sans effet une fois le vote fini */
  voter: (sortieId: string, lieuId: number) => void;
  /** « interdit » : lieu inconnu, ou vote déjà fini */
  proposerLieu: (sortieId: string, lieuId: number, surRefus?: SurRefusGeste) => "ok" | "deja" | "max" | "interdit";
  /** Démo seulement : avec un compte, la discussion passe par la messagerie (utiliserDiscussionSortie) */
  envoyerMessage: (sortieId: string, texte: string) => ResultatTexte;
  /** Termine le vote tout de suite (seulement l'organisateur) */
  terminerVote: (sortieId: string) => void;
  /** Quitter la sortie (et sa discussion) ; l'organisateur qui part passe la main au plus ancien participant */
  quitterSortie: (sortieId: string) => void;
  /** Les invitations à une sortie qui attendent ta réponse (compte connecté ; vides en démo) */
  invitationsSorties: InvitationSortie[];
  /** « Carrément ! » (vient : tu entres dans le vote et la discussion) ou « Pas cette fois » (en silence). Faux si ça n'a pas marché */
  repondreInvitationSortie: (id: string, vient: boolean) => Promise<boolean>;
  /** L'organisateur invite d'autres potes de sa bande. Rend l'erreur, ou null */
  inviterASortie: (sortieId: string, potes: string[]) => Promise<ErreurService | null>;
  /** L'organisateur retire un participant ou une invitation en attente, sans le prévenir */
  retirerParticipant: (sortieId: string, poteId: string) => Promise<ErreurService | null>;
  /** L'organisateur annule : la sortie et sa discussion disparaissent pour tout le monde */
  annulerSortie: (sortieId: string) => Promise<ErreurService | null>;

  /** Toutes les listes connues (les tiennes, celles que tu remplis, suis, découvres ou as vues), sans celles que tu as signalées */
  listes: ListePartagee[];
  /** cle : tirée une fois à l'ouverture de la feuille, pour qu'un second appui ne crée pas deux listes */
  creerListe: (liste: NouvelleListeCommunaute, cle?: string) => Promise<{ id: string } | { erreur: ErreurNouvelleListe }>;
  /** L'auteur change le titre, l'emoji, la description ou qui la voit. Rend l'erreur, ou null */
  modifierListe: (listeId: string, changements: Partial<NouvelleListeCommunaute>) => Promise<ErreurService | null>;
  /** L'auteur supprime sa liste */
  supprimerListe: (listeId: string) => Promise<ErreurService | null>;
  /** Compte connecté : lit la liste en entier (ses lieux, ses co-auteurs), à l'ouverture de son écran ; démo : rien */
  lireListe: (listeId: string) => void;
  /** Compte connecté : des listes lues ailleurs (le profil d'une personne) ; trouvées ensuite dans listes */
  noterListes: (listes: ListeResumeApi[]) => void;
  basculerSuiviListe: (listeId: string) => void;
  ajouterLieuListe: (listeId: string, lieuId: number, surRefus?: SurRefusGeste) => void;
  retirerLieuListe: (listeId: string, lieuId: number) => void;
  /** Les listes qu'on t'invite à remplir, en attente de ta réponse (compte connecté ; vides en démo) */
  invitationsListes: ListePartagee[];
  /** Accepter (tu peux y ajouter des lieux) ou refuser en silence. Faux si ça n'a pas marché */
  repondreCoAuteur: (listeId: string, accepte: boolean) => Promise<boolean>;
  /** L'auteur invite un pote de sa bande à remplir la liste avec lui */
  inviterCoAuteur: (listeId: string, poteId: string) => Promise<ErreurService | null>;
  /** L'auteur retire un co-auteur ; « moi » : tu ne remplis plus cette liste */
  retirerCoAuteur: (listeId: string, poteId: string) => Promise<ErreurService | null>;

  /** Ce que font tes potes, du plus récent au plus ancien (sans les lignes que tu as retirées) */
  activites: ActivitePote[];
  /** Le classement du mois, toi compris (estMoi) */
  classement: PlaceClassement<Pote>[];

  /** Lieux reçus de tes potes (sans ceux des personnes bloquées ni ceux que tu as signalés) */
  recommandationsRecues: Recommandation[];
  recommandationsEnvoyees: Recommandation[];
  envoyerLieu: (lieuId: number, potes: string[], mot?: string, surRefus?: SurRefusGeste) => ResultatTexte;
  marquerRecommandationVue: (id: string) => void;
  /** Retire des lieux qu'on t'a envoyés (pour toi seulement : ton pote n'en sait rien) ; rend ceux retirés, pour « Annuler » */
  retirerRecommandations: (ids: string[]) => Recommandation[];
  /** « Annuler » : remet les lieux retirés */
  remettreRecommandations: (recommandations: Recommandation[]) => void;
  /** Retire de ta vue, pour toi seulement : une sortie passée (elle sort de tes sorties), une ligne de l'activité de ta bande (elle
   * sort de « Quoi de neuf »), une liste de « À découvrir » (elle reste sur le profil de son auteur : voir estMasque). La cible
   * dit de quoi il s'agit : la sortie « 42 » et la liste « 42 » ne se confondent pas */
  masquer: (cible: CibleMasque, id: string) => void;
  /** Vrai si tu as retiré cet élément de ta vue */
  estMasque: (cible: CibleMasque, id: string) => boolean;
  /** « Annuler » : remet ce qui avait été retiré de ta vue */
  demasquer: (cible: CibleMasque, id: string) => void;

  /** Commentaires d'une publication, rangés (lieu en tête, plus aimés, récents) avec leurs réponses */
  commentairesDe: (publicationId: string) => FilCommentaire[];
  nombreCommentaires: (publicationId: string) => number;
  commenter: (publicationId: string, texte: string, reponseA?: string) => ResultatTexte;
  modifierCommentaire: (id: string, texte: string) => ResultatTexte;
  supprimerCommentaire: (id: string) => void;
  basculerJaimeCommentaire: (id: string) => void;

  /** Signale un commentaire, un message, un lieu envoyé, une liste ou un profil : gardé sur le téléphone en attendant l'API, et le contenu disparaît pour toi (un profil reste visible) */
  signaler: (signalement: Omit<SignalementContenu, "date">) => void;
  /** Vrai si tu as déjà signalé ce commentaire, ce message, ce lieu envoyé, cette liste ou ce profil */
  estSignale: (cibleId: string) => boolean;
  /** Efface toute la communauté du téléphone (la démo repartira de zéro) */
  effacer: () => Promise<void>;
};

export const ContexteCommunaute = createContext<EtatCommunaute | null>(null);

/** La communauté : potes, sorties, listes, activité, recommandations et commentaires (fournie par FournisseurCommunaute). */
export function utiliserCommunaute(): EtatCommunaute {
  const etat = useContext(ContexteCommunaute);
  if (!etat) throw new Error("utiliserCommunaute doit être appelé sous <FournisseurCommunaute>.");
  return etat;
}
