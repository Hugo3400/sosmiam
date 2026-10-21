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
  /** Relier ou délier sans mot de passe : le jeton de l'autre fournisseur n'est pas celui du compte relié */
  autreCompte: (nom: string) => `Ce n'est pas le compte ${nom} relié à ton compte SOS Miam : reprends avec le bon.`,
  lienEnvoye: "C'est parti ! Un lien t'attend dans ta boîte mail (pense à jeter un œil aux indésirables). Il est valable 24 heures.",
  // Propres à l'app : Apple ne se lance que sur un iPhone, Google pas dans l'aperçu web
  /** Relier ou délier sans mot de passe, quand la clé qui doit confirmer ne se lance pas sur cet appareil */
  confirmationImpossibleIci: (nom: string, autre: string, geste: "relier" | "délier" = "délier") =>
    `Sans mot de passe, c'est ${autre} qui confirme… et ${autre} ne se lance pas ici${autre === "Apple" ? " (il lui faut un iPhone)" : ""}. Le plus simple : ajoute d'abord un mot de passe (on t'envoie le lien), puis reviens ${geste} ${nom}. Ou fais-le depuis ${autre === "Apple" ? "ton iPhone" : "ton téléphone"} 😉`,
  /** Supprimer le compte sans mot de passe, quand aucune de ses clés ne se lance sur cet appareil */
  suppressionImpossibleIci:
    "Ici, pas moyen de confirmer que c'est bien toi : Apple ne se lance que sur un iPhone (et Google pas dans l'aperçu web). Ajoute d'abord un mot de passe (on t'envoie le lien), ou reviens supprimer ton compte depuis ton iPhone.",
  /** Les clés n'ont pas pu être lues (pas de réseau, API en panne) */
  lectureRatee: "Tes clés n'ont pas pu se charger (le réseau, sûrement)",
};

/** « Ajouter un mot de passe » : ce qui va se passer */
export const aideAjouterMotDePasse = (email: string) => `On t'envoie un lien à ${email} pour le choisir (valable 24 heures).`;

/** Adresse masquée d'Apple (relais privé) : le lien n'arrive que si le relais transmet les mails */
export const AVERTISSEMENT_RELAIS_APPLE =
  "C'est une adresse masquée d'Apple : le lien n'arrive que si le transfert des e-mails est activé pour SOS Miam, dans les réglages de ton identifiant Apple (« Se connecter avec Apple »).";
