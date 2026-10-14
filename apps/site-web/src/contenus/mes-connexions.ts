// Textes de « Mes façons de me connecter » dans « Mon compte » (sosmiam.fr, ambassadeur. et pro.) : relier ou délier
// Apple et Google, ajouter un mot de passe. Les messages arrivent par « ?connexions=<code>&avec=<fournisseur> » : jamais un
// texte venu d'ailleurs. « {fournisseur} » est remplacé par « Apple », « Google », ou « Apple ou Google ».
// Aucun import ici : les tests (tests/mes-connexions.test.ts) lancent ce fichier directement avec Node.

/** Ce qui peut arriver après « Relier » ou « Délier » */
export type CodeMesConnexions =
  | "relie" | "delie" | "identite-deja-reliee" | "deja-relie" | "derniere-connexion" | "autre-compte" | "refuse" | "expire"
  | "annule" | "trop-de-demandes" | "indisponible";

/** Les codes qui annoncent une réussite (les autres : une explication, sans reproche) */
export const REUSSITES_MES_CONNEXIONS: CodeMesConnexions[] = ["relie", "delie"];

export const messagesMesConnexions: Record<CodeMesConnexions, string> = {
  relie: "C'est relié ! Tu peux maintenant te connecter avec {fournisseur}, en plus de tes autres façons. Ton adresse e-mail SOS Miam, elle, ne bouge pas.",
  delie: "C'est délié : {fournisseur} ne t'ouvre plus la porte de SOS Miam. Tes autres façons de te connecter marchent toujours.",
  "identite-deja-reliee": "Ce compte {fournisseur} est déjà relié à un autre compte SOS Miam. On ne fusionne jamais deux comptes : connecte-toi à l'autre compte, délie {fournisseur} depuis son « Mon compte » (ou supprime-le s'il ne te sert plus), puis reviens le relier ici.",
  "deja-relie": "Ton compte SOS Miam a déjà un autre compte {fournisseur} relié. Délie-le d'abord, puis relie le nouveau.",
  "derniere-connexion": "C'est ta seule façon de te connecter : sans elle, tu resterais à la porte ! Ajoute un mot de passe ou relie un autre compte d'abord.",
  "autre-compte": "Ce n'est pas le compte {fournisseur} relié à ton compte SOS Miam : reprends avec le bon.",
  refuse: "{fournisseur} n'a pas pu confirmer qui tu es. Réessaie dans un instant.",
  expire: "Ça a pris un peu trop de temps (10 minutes au plus). Recommence, ça va vite !",
  annule: "Pas de souci, rien n'a bougé.",
  "trop-de-demandes": "Doucement ! Trop d'essais d'affilée : réessaie dans un petit moment.",
  indisponible: "Oups, {fournisseur} ne répond pas pour l'instant. Réessaie dans un instant.",
};

/** Sous le titre de la partie */
export const CHAPO_MES_CONNEXIONS =
  "Un seul compte, plusieurs clés : garde celles qui t'arrangent. Ton adresse e-mail SOS Miam reste la même quoi qu'il arrive.";

/** « Ajouter un mot de passe » : ce qui va se passer */
export const AIDE_AJOUTER_MOT_DE_PASSE = "On t'envoie un lien à {email} pour choisir ton mot de passe (valable 24 heures).";

/** Adresse masquée d'Apple (relais privé) : le lien n'arrive que si le relais transmet les mails */
export const AVERTISSEMENT_RELAIS_APPLE =
  "Ton adresse est une adresse masquée d'Apple : le lien n'arrive que si le transfert des e-mails est activé pour SOS Miam, dans les réglages de ton identifiant Apple (« Se connecter avec Apple »).";

/** Après l'envoi du lien */
export const LIEN_MOT_DE_PASSE_ENVOYE =
  "C'est parti ! Un lien t'attend dans ta boîte mail (pense à jeter un œil aux indésirables). Il est valable 24 heures.";
