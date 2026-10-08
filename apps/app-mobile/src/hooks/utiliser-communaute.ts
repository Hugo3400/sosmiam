import { createContext, useContext } from "react";

import type { Commentaire } from "@sos-miam/commun/types/commentaires";
import type { ActivitePote, ListePartagee, Pote, Recommandation, Sortie } from "@sos-miam/commun/types/potes";
import type { SignalementContenu } from "@sos-miam/commun/types/signalement";
import type { PlaceClassement } from "~/fonctions/communaute/calculer-classement";
import type { ResultatRecherchePote } from "~/fonctions/communaute/chercher-par-pseudo";
import type { FilCommentaire } from "~/fonctions/communaute/trier-commentaires";

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

export type EtatCommunaute = {
  /** Faux tant que la communauté n'est pas lue sur le téléphone */
  pret: boolean;
  /** Démo : potes d'exemple qui votent et répondent tout seuls, en attendant les comptes */
  demo: true;
  /** Ton profil communautaire (identifiant « moi ») */
  moi: Pote;
  /** 15 à 17 ans (ou âge inconnu) : pas d'alcool. Un adulte, lui, ne trouve pas les mineurs par pseudo et ne peut pas les ajouter (démo). */
  moiMineur: boolean;
  /** Ta bande (sans les personnes bloquées) */
  potes: Pote[];
  /** N'importe qui par son identifiant (toi, ta bande, les autres personnes connues), ou null */
  trouverPote: (id: string) => Pote | null;
  /** Recherche par pseudo ; un adulte n'y voit pas les mineurs, sauf ceux déjà dans sa bande */
  chercherParPseudo: (texte: string) => ResultatRecherchePote[];
  /**
   * Ajoute à ta bande. Démo : le lien et le QR code se déduisent encore du pseudo, public, et leur code secret n'est pas vérifié ;
   * tant que l'API ne vérifie pas les invitations, un adulte n'ajoute donc aucun mineur, quel que soit le moyen (« mineur »).
   */
  ajouterPote: (id: string, moyen: "lien" | "qr" | "pseudo") => "ajoute" | "deja" | "mineur" | "bloque" | "introuvable";
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

  /** Tes sorties, à venir d'abord ; le lieu retenu est calculé à la fin du vote, et plus personne ne vote ensuite. Pour un mineur, sans les bars. */
  sorties: Sortie[];
  trouverSortie: (id: string) => Sortie | null;
  /** Vrai si ce lieu peut être proposé dans cette sortie (pas de bar avec un mineur) */
  lieuPermisDansSortie: (lieuId: number, participants: string[]) => boolean;
  creerSortie: (sortie: NouvelleSortie) => { id: string } | { erreur: "titre" | "participants" | "lieux" };
  /** Vote (ou retire ton vote) pour un lieu ; sans effet une fois le vote fini */
  voter: (sortieId: string, lieuId: number) => void;
  /** « interdit » : lieu pas permis dans cette sortie (bar avec un mineur), ou vote déjà fini */
  proposerLieu: (sortieId: string, lieuId: number) => "ok" | "deja" | "max" | "interdit";
  envoyerMessage: (sortieId: string, texte: string) => ResultatTexte;
  /** Termine le vote tout de suite (seulement l'organisateur) */
  terminerVote: (sortieId: string) => void;
  quitterSortie: (sortieId: string) => void;

  /** Toutes les listes connues, sans celles que tu as signalées */
  listes: ListePartagee[];
  creerListe: (titre: string, emoji: string, description: string) => string;
  basculerSuiviListe: (listeId: string) => void;
  ajouterLieuListe: (listeId: string, lieuId: number) => void;
  retirerLieuListe: (listeId: string, lieuId: number) => void;

  /** Ce que font tes potes, du plus récent au plus ancien */
  activites: ActivitePote[];
  classement: PlaceClassement[];

  /** Lieux reçus de tes potes (sans ceux des personnes bloquées ni ceux que tu as signalés) */
  recommandationsRecues: Recommandation[];
  recommandationsEnvoyees: Recommandation[];
  envoyerLieu: (lieuId: number, potes: string[], mot?: string) => ResultatTexte;
  marquerRecommandationVue: (id: string) => void;

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
