// Textes de « Tes clés pour entrer » (Réglages → Mon compte) : relier ou délier Apple et Google, ajouter un mot de passe.
// Mêmes mots que la partie « Mes façons de me connecter » du site (apps/site-web/src/contenus/mes-connexions.ts).

export type FournisseurConnexion = "apple" | "google";

export const NOMS_FOURNISSEURS: Record<FournisseurConnexion, string> = { apple: "Apple", google: "Google" };

/** Sous le titre de la partie */
export const CHAPO_MES_CONNEXIONS =
  "Un seul compte, plusieurs clés : garde celles qui t'arrangent. Ton adresse e-mail SOS Miam reste la même quoi qu'il arrive.";

export const messagesMesConnexions = {
  relie: (nom: string) =>
    `C'est relié ! Tu peux maintenant te connecter avec ${nom}, en plus de tes autres clés. Ton adresse e-mail SOS Miam, elle, ne bouge pas.`,
  delie: (nom: string) => `C'est délié : ${nom} ne t'ouvre plus la porte de SOS Miam. Tes autres clés marchent toujours.`,
  /** Délier sans mot de passe : le jeton de l'autre fournisseur n'est pas celui du compte relié */
  autreCompte: (nom: string) => `Ce n'est pas le compte ${nom} relié à ton compte SOS Miam : reprends avec le bon.`,
  lienEnvoye: "C'est parti ! Un lien t'attend dans ta boîte mail (pense à jeter un œil aux indésirables). Il est valable 24 heures.",
};

/** « Ajouter un mot de passe » : ce qui va se passer */
export const aideAjouterMotDePasse = (email: string) => `On t'envoie un lien à ${email} pour le choisir (valable 24 heures).`;

/** Adresse masquée d'Apple (relais privé) : le lien n'arrive que si le relais transmet les mails */
export const AVERTISSEMENT_RELAIS_APPLE =
  "C'est une adresse masquée d'Apple : le lien n'arrive que si le transfert des e-mails est activé pour SOS Miam, dans les réglages de ton identifiant Apple (« Se connecter avec Apple »).";
