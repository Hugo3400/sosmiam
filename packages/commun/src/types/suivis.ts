// Suivre entre personnes : abonnés, abonnements, demandes et notifications. Formes partagées par l'app et, plus tard, l'API.
// Dans le code on dit « suivi » ; à l'écran, « abonnés » et « abonnements » (voir docs/decisions.md, « Suivre et abonnements »).

/** Ton choix : public (on te suit sans demander) ou privé (chaque abonnement est une demande). Entre 15 et 17 ans, privé quoi qu'il arrive. */
export type Confidentialite = "public" | "prive";

/** Ce que la règle peutSuivre doit savoir d'un compte */
export type CompteSuivable = {
  id: string;
  /** 15 à 17 ans (ou âge inconnu) */
  mineur: boolean;
  /** Privé par choix (un mineur est privé de toute façon : voir estComptePrive) */
  prive?: boolean;
  /** Créateur de contenu : un ado peut le suivre même s'il est adulte, et un adulte peut demander à suivre un créateur de 15-17 ans */
  createur?: boolean;
};

/**
 * Un lien vu de « moi » : l'autre personne, et depuis quand (ISO).
 * surveillance : lien entre un adulte et un créateur de 15-17 ans, à remonter au logiciel de gestion (surveillance accrue).
 */
export type LienSuivi = { id: string; depuis: string; surveillance?: boolean };

/** Pourquoi on ne peut pas suivre. Jamais affiché tel quel : l'écran montre seulement l'absence de bouton. */
export type RefusSuivi = "soi-meme" | "bloque" | "age";

/** surveillance : un adulte qui suit un créateur de 15-17 ans (permis, sur demande, sous surveillance accrue) */
export type VerdictSuivi = { permis: true; surDemande: boolean; surveillance?: boolean } | { permis: false; raison: RefusSuivi };

/** complet : tout ; prive : en-tête et compteurs (qu'on ne peut pas ouvrir) ; reserve : en-tête seul, ni compteurs ni bouton */
export type VisibiliteProfil = "complet" | "prive" | "reserve";

/** Une notification à créer. cle : clé de suivi de qui agit (« personne:sofia », « createur:lea.mange », « lieu:13 ») */
export type NouvelleNotificationSuivi =
  | { type: "nouvel-abonne"; cle: string; enRetour: boolean }
  | { type: "demande-acceptee"; cle: string }
  | { type: "nouvelle-publication"; cle: string; publicationId: string }
  | { type: "majorite" };

export type NotificationSuivi = NouvelleNotificationSuivi & { id: string; date: string };
