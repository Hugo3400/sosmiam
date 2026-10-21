// Consentement aux cookies (article 82 de la loi Informatique et Libertés, lignes directrices et recommandation de la CNIL
// de 2020). C'est le SEUL endroit où l'on déclare les catégories de cookies et leurs partenaires : le bandeau, le panneau
// « Choisir », le formulaire de /cookies#mes-choix, ContenuExterne et chargerScriptSiConsentement lisent tous ce fichier.
//
// Règles :
// - `active: true` seulement si au moins un traceur de la catégorie existe VRAIMENT sur le site. Aujourd'hui, toutes les
//   catégories facultatives sont inactives : le bandeau reste caché (sinon ce serait un faux choix).
// - Activer une catégorie, ou y ajouter un partenaire, change la version (fonctions/consentement/calculer-version-consentement.ts) :
//   le bandeau revient chez tout le monde. Changer une explication ou une durée ne la change pas.
// - AVANT d'activer : mettre à jour la page Cookies (contenus/legal/cookies.ts : la liste, les partenaires), la politique de
//   confidentialité et, pour la pub, les mentions légales (structure, voir docs/decisions.md).
// - Régie Google (AdSense, Ad Manager) dans l'Espace économique européen : Google exige une plateforme de consentement
//   certifiée IAB TCF v2.2 (liste des CMP certifiées par Google). Ce gestionnaire maison ne l'est pas : il faudra le remplacer
//   par une CMP certifiée, ou la brancher à sa place pour la catégorie « publicite ». Voir docs/decisions.md.
//
// Exemple de partenaire, à recopier le jour venu (avec des noms et des durées RELEVÉS sur le site, jamais devinés) :
//   { nom: "YouTube (Google)", role: "Lit les vidéos intégrées.", politique: "https://policies.google.com/privacy",
//     domaines: ["www.youtube-nocookie.com"], traceurs: [{ nom: "…", finalite: "…", duree: "…" }] }

/** Nom du cookie qui garde le choix (strictement nécessaire : il ne sert qu'à respecter la décision) */
export const NOM_COOKIE_CONSENTEMENT = "sosmiam-consentement";

/** Événement envoyé à `window` après chaque choix enregistré dans le navigateur (chargerScriptSiConsentement l'écoute) */
export const EVENEMENT_CONSENTEMENT = "sosmiam:consentement";

/** Paramètre d'adresse qui montre le bandeau d'aperçu (« /?apercu-cookies ») */
export const PARAMETRE_APERCU_COOKIES = "apercu-cookies";

/** Hôte de la version en préparation : le bandeau d'aperçu y est toujours montré */
export const HOTE_APERCU = "apercu.sosmiam.fr";

/** Adresse du formulaire qui enregistre le choix (POST), servie sur les trois hôtes (routes/ressources/choix-cookies.ts) */
export const ADRESSE_CHOIX_COOKIES = "/cookies/choix";

/** Page des réglages sans JavaScript : la partie « Gérer mes cookies » de /cookies (ancre publique, ne pas la renommer) */
export const ADRESSE_REGLAGES_COOKIES = "/cookies#mes-choix";

/** Les catégories qu'on peut accepter ou refuser (« necessaires » n'en fait pas partie : toujours actifs) */
export const IDS_CATEGORIES_FACULTATIVES = ["contenus-externes", "publicite", "mesure-audience"] as const;

export type IdCategorieFacultative = (typeof IDS_CATEGORIES_FACULTATIVES)[number];
export type IdCategorieConsentement = "necessaires" | IdCategorieFacultative;

export type TraceurConsentement = {
  /** Nom du cookie ou de l'entrée de stockage ; un « * » final vise tous ceux qui commencent ainsi (« _exemple_* ») */
  nom: string;
  finalite: string;
  duree: string;
};

export type PartenaireConsentement = {
  nom: string;
  /** Ce qu'il fait chez nous, en une phrase */
  role: string;
  /** Sa politique de confidentialité */
  politique?: string;
  /** Domaines d'où il charge ses scripts : chargerScriptSiConsentement refuse tout autre domaine pour cette catégorie */
  domaines: string[];
  traceurs: TraceurConsentement[];
};

export type CategorieConsentement = {
  id: IdCategorieConsentement;
  nom: string;
  /** Explication courte, montrée dans le panneau « Choisir » et sur /cookies */
  explication: string;
  /** Morceau de la phrase du bandeau : « Pour {…} et {…}, des partenaires aimeraient… » */
  pourBandeau: string;
  /** Vrai seulement si au moins un traceur de cette catégorie existe vraiment sur le site */
  active: boolean;
  partenaires: PartenaireConsentement[];
};

/** Une catégorie qu'on peut accepter ou refuser */
export type CategorieFacultative = CategorieConsentement & { id: IdCategorieFacultative };

export const categoriesConsentement: CategorieConsentement[] = [
  {
    id: "necessaires",
    nom: "Strictement nécessaires",
    explication:
      "Comme le sel dans les pâtes : sans eux, rien ne tient. Ils protègent le site, te gardent connecté et retiennent tes choix. La loi les dispense d'accord, et ils ne servent ni à la pub ni à te suivre.",
    pourBandeau: "faire marcher le site",
    active: true,
    partenaires: [
      {
        nom: "SOS Miam",
        role: "Ta connexion, ton refus des statistiques, tes choix de cookies et ta position dans la page.",
        domaines: [],
        traceurs: [
          { nom: "__Host-sosmiam-session", finalite: "Te garder connecté.", duree: "90 jours au plus" },
          { nom: "__Host-sosmiam-connexion-externe", finalite: "Vérifier la réponse d'Apple ou de Google.", duree: "10 minutes au plus" },
          { nom: "__Host-sosmiam-inscription-externe", finalite: "Finir une inscription avec Apple ou Google.", duree: "10 minutes au plus" },
          { nom: "__Host-sosmiam-confirmation-externe", finalite: "Relier Apple ou Google à un compte sans mot de passe.", duree: "10 minutes au plus" },
          { nom: "__Host-sosmiam-connexion-qr", finalite: "Attendre que l'app valide « Me connecter avec l'app ».", duree: "2 minutes au plus" },
          { nom: "sosmiam-sans-statistiques", finalite: "Retenir ton refus d'être compté.", duree: "13 mois" },
          { nom: NOM_COOKIE_CONSENTEMENT, finalite: "Retenir tes choix de cookies.", duree: "6 mois" },
          { nom: "react-router-scroll-positions", finalite: "Te ramener où tu étais sur une page (stockage de session).", duree: "Jusqu'à la fermeture de l'onglet" },
          { nom: "react-router-manifest-version", finalite: "Recharger une seule fois après une mise à jour (stockage de session).", duree: "Jusqu'à la fermeture de l'onglet" },
        ],
      },
      {
        nom: "Cloudflare",
        role: "Protège le site contre les attaques et les robots.",
        politique: "https://www.cloudflare.com/privacypolicy/",
        domaines: [],
        traceurs: [
          { nom: "cf_clearance", finalite: "Retenir que tu as passé la vérification anti-robots.", duree: "1 an" },
          { nom: "__cf_bm", finalite: "Distinguer les humains des robots.", duree: "Environ 30 minutes" },
        ],
      },
    ],
  },
  {
    id: "contenus-externes",
    nom: "Vidéos et contenus d'autres sites",
    explication:
      "Les vidéos YouTube, les cartes et les publications Instagram ou TikTok intégrées dans nos pages. Ces plateformes posent leurs propres cookies dès que leur contenu s'affiche, et peuvent s'en servir pour te reconnaître. Sans ton accord, tu vois une vignette à la place, avec un bouton pour afficher quand même.",
    pourBandeau: "afficher des vidéos et des contenus d'autres sites (YouTube, Instagram, TikTok…)",
    active: false,
    partenaires: [],
  },
  {
    id: "publicite",
    nom: "Publicité",
    explication:
      "La pub qui paie l'addition pour que SOS Miam reste gratuit, toujours signalée comme telle. Avec ton accord, nos partenaires publicitaires posent des cookies pour choisir les pubs et compter leurs affichages. Sans ton accord, aucun cookie publicitaire, et le classement des lieux ne bouge pas d'un millimètre.",
    pourBandeau: "afficher de la pub qui nous aide à rester gratuits",
    active: false,
    partenaires: [],
  },
  {
    id: "mesure-audience",
    nom: "Mesure d'audience",
    explication:
      "Nos statistiques actuelles se passent de cookie : notre serveur compte les visites tout seul, sans rien déposer chez toi, et elles n'ont pas besoin de ton accord. Cette case ne servira que si, un jour, un outil de mesure en a besoin.",
    pourBandeau: "mesurer l'audience avec un outil extérieur",
    active: false,
    partenaires: [],
  },
];

/**
 * Aperçu du bandeau (« ?apercu-cookies », ou l'hôte apercu.sosmiam.fr) : la catégorie « publicite » devient active avec
 * ce partenaire fictif. Il n'existe pas, ne charge rien et ne dépose rien.
 */
export const partenaireApercu: PartenaireConsentement = {
  nom: "Exemple (aperçu)",
  role: "Partenaire imaginaire, juste pour voir le bandeau : il ne charge rien et ne dépose rien.",
  domaines: [],
  traceurs: [],
};

/** Les textes du bandeau, du panneau et des vignettes */
export const textesConsentement = {
  titre: "Des cookies ? Seulement si tu veux 🍪",
  /** Suivi de la liste des catégories (« Pour afficher de la pub… ») et de la fin de phrase */
  sansAccord: "Sans ton accord, rien n'est posé, et SOS Miam marche tout aussi bien.",
  changerDAvis: "Tu peux changer d'avis quand tu veux avec « Gérer mes cookies », en bas de chaque page.",
  portee: "Ton choix est gardé 6 mois, pour sosmiam.fr et ses espaces ambassadeur et pro.",
  lienPage: "Tout savoir sur nos cookies",
  apercu: "Aperçu : partenaire imaginaire, rien n'est chargé ni déposé, à part ton choix.",
  toutAccepter: "Tout accepter",
  toutRefuser: "Tout refuser",
  choisir: "Choisir",
  enregistrer: "Enregistrer mes choix",
  fermerSansAccepter: "Fermer et continuer sans accepter",
  fermerSansChanger: "Fermer sans rien changer",
  titrePanneau: "Tes choix, catégorie par catégorie",
  introPanneau: "Tout est décoché au départ : sans ton accord, c'est non. Coche seulement ce que tu veux bien.",
  introGestion: "Voici tes choix actuels. Change ce que tu veux, puis enregistre : retirer un accord est aussi simple que de le donner.",
  toujoursActifs: "Toujours actifs",
  voirPartenaires: "Qui pose quoi",
  choixEnregistre: "C'est noté, ton choix est enregistré.",
};
