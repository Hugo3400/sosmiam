// Suivre entre personnes : abonnés, abonnements, demandes et notifications. Formes partagées par l'app et, plus tard, l'API.
// Dans le code on dit « suivi » ; à l'écran, « abonnés » et « abonnements » (voir docs/decisions.md, « Suivre et abonnements »).

/** Ton choix : public (on te suit sans demander) ou privé (chaque abonnement est une demande). */
export type Confidentialite = "public" | "prive";

/** Ce que la règle peutSuivre doit savoir d'un compte */
export type CompteSuivable = {
  id: string;
  /** Privé par choix : chaque abonnement est une demande (voir estComptePrive) */
  prive?: boolean;
};

/** Un lien vu de « moi » : l'autre personne, et depuis quand (ISO). */
export type LienSuivi = { id: string; depuis: string };

/** Pourquoi on ne peut pas suivre. Jamais affiché tel quel : l'écran montre seulement l'absence de bouton. */
export type RefusSuivi = "soi-meme" | "bloque";

/** surDemande : compte privé, « Suivre » envoie une demande */
export type VerdictSuivi = { permis: true; surDemande: boolean } | { permis: false; raison: RefusSuivi };

/** complet : tout ; prive : en-tête et compteurs (qu'on ne peut pas ouvrir) */
export type VisibiliteProfil = "complet" | "prive";

/** Une notification à créer. cle : clé de suivi de qui agit (« personne:sofia », « createur:lea.mange », « lieu:13 ») */
export type NouvelleNotificationSuivi =
  | { type: "nouvel-abonne"; cle: string; enRetour: boolean }
  | { type: "demande-acceptee"; cle: string }
  | { type: "nouvelle-publication"; cle: string; publicationId: string };

export type NotificationSuivi = NouvelleNotificationSuivi & { id: string; date: string };
