// « Continuer avec Apple » et « Continuer avec Google » sur le site (sosmiam.fr/mon-compte, ambassadeur. et pro.) : flux
// OpenID Connect par redirection, réponse en form_post (services/connexion-externe.server.ts).

export type FournisseurExterne = "apple" | "google";

/**
 * « connexion » : se connecter (ou créer son compte) ; « suppression » : confirmer la suppression d'un compte sans mot de
 * passe ; « relier » : relier ce compte Apple ou Google au compte connecté (« Mon compte ») ; « delier » : confirmer avec
 * CE fournisseur pour délier l'AUTRE, quand le compte n'a pas de mot de passe
 */
export type IntentionConnexion = "connexion" | "suppression" | "relier" | "delier";

/** Les pages qui montrent les boutons : on y revient en cas de refus, d'annulation ou de panne */
export type PageDepart = "/connexion" | "/inscription" | "/mon-compte" | "/espace/mon-compte";

/** Le cadre de la page « Finir ton inscription » : celui du site principal, de l'espace ambassadeur ou de l'espace pro */
export type EspaceConnexion = "site" | "ambassadeur" | "pro";

/** Ce que garde le cookie court du départ (10 minutes, chiffré) : de quoi vérifier le retour d'Apple ou de Google */
export type EtatConnexion = {
  fournisseur: FournisseurExterne;
  /** Tiré au hasard, renvoyé tel quel par le fournisseur : la vraie protection du retour */
  state: string;
  /** Nonce BRUT (Apple reçoit son SHA-256, Google le nonce tel quel) ; l'API le compare au jeton */
  nonce: string;
  intention: IntentionConnexion;
  depart: PageDepart;
  /** Chemin sûr à rouvrir après la connexion */
  retour: string;
  /** Fin de validité, en millisecondes */
  expire: number;
};

/** Ce que garde le cookie d'attente (10 minutes, chiffré) : un jeton vérifié par le fournisseur, pas encore utilisé */
export type AttenteConnexion = {
  fournisseur: FournisseurExterne;
  intention: IntentionConnexion;
  /** Le jeton d'identité (id_token) : jamais dans la page, jamais dans un journal */
  jeton: string;
  nonce: string;
  depart: PageDepart;
  retour: string;
  espace: EspaceConnexion;
  /** Pour pré-remplir « Finir ton inscription » (prénom d'Apple, donné une seule fois, ou de Google) */
  prenom: string | null;
  nom: string | null;
  email: string | null;
  expire: number;
};
