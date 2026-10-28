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

import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_CONSENTEMENT_ANGLAIS } from "~/contenus/anglais/cookies-consentement";

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

export const GESTE_INFORMATION_COOKIES = "vu";

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

export const TEXTES_CONSENTEMENT = {
  titre: "Des cookies ? Seulement si tu veux 🍪",
  invitation: (pour: string, plusieurs: boolean) =>
    `Pour ${pour}, ${plusieurs ? "des partenaires aimeraient" : "un partenaire aimerait"} poser des cookies dans ton navigateur.`,
  et: " et ",
  sansAccord: "Sans ton accord, rien n'est posé, et SOS Miam marche tout aussi bien.",
  changerDAvis: (lien: string) => `Tu peux changer d'avis quand tu veux avec « ${lien} », en bas de chaque page.`,
  portee: "Ton choix est gardé 6 mois, pour sosmiam.fr et ses espaces ambassadeur et pro.",
  lienPage: "Tout savoir sur nos cookies",
  apercu: "Aperçu : partenaire imaginaire, rien n'est chargé ni déposé, à part ton choix.",
  apercuReglages: "Aperçu : le partenaire est imaginaire.",
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
  oui: "Oui",
  non: "Non",
  voirPartenaires: (partenaires: number, traceurs: number) =>
    `Qui pose quoi (${partenaires} ${partenaires > 1 ? "partenaires" : "partenaire"}, ${traceurs} ${traceurs > 1 ? "traceurs" : "traceur"})`,
  deuxPoints: " : ",
  politique: "Sa politique de confidentialité",
  aucunTraceur: "Aucun cookie, aucun traceur.",
  choixEnregistre: "C'est noté, ton choix est enregistré.",
  choixValable: (debut: string, fin: string) => `Ton choix du ${debut} vaut jusqu'au ${fin} : ensuite, on te reposera la question.`,
  sansChoix: "Tu n'as encore rien choisi : tant que tu ne dis rien, c'est non.",
  information: {
    titre: "Ici, zéro cookie de pistage 🍪",
    texte:
      "Les seuls cookies qu'on aime, ce sont ceux de la pâtisserie du coin. Le site n'utilise que ceux qui le font marcher (la sécurité, ta connexion, ta langue) : pas de pub, pas de pistage, donc rien à accepter ni à refuser.",
    compris: "OK, compris",
  },
  contenuExterne: {
    video: { vientDe: (fournisseur: string) => `Cette vidéo vient de ${fournisseur}, qui pose des cookies.`, toujours: "Toujours afficher les vidéos" },
    carte: { vientDe: (fournisseur: string) => `Cette carte vient de ${fournisseur}, qui pose des cookies.`, toujours: "Toujours afficher les cartes" },
    publication: {
      vientDe: (fournisseur: string) => `Cette publication vient de ${fournisseur}, qui pose des cookies.`,
      toujours: "Toujours afficher les publications",
    },
    afficherQuandMeme: "Afficher quand même",
    voirSur: (fournisseur: string) => `Voir sur ${fournisseur}`,
    portee: (lien: string) =>
      ` · « Toujours afficher » vaut pour tous les contenus d'autres sites (vidéos, cartes, publications) ; tu peux changer d'avis dans « ${lien} ».`,
  },
  categories: {
    necessaires: {
      nom: "Strictement nécessaires",
      explication:
        "Comme le sel dans les pâtes : sans eux, rien ne tient. Ils protègent le site, te gardent connecté et retiennent tes choix. La loi les dispense d'accord, et ils ne servent ni à la pub ni à te suivre.",
      pourBandeau: "faire marcher le site",
    },
    "contenus-externes": {
      nom: "Vidéos et contenus d'autres sites",
      explication:
        "Les vidéos YouTube, les cartes et les publications Instagram ou TikTok intégrées dans nos pages. Ces plateformes posent leurs propres cookies dès que leur contenu s'affiche, et peuvent s'en servir pour te reconnaître. Sans ton accord, tu vois une vignette à la place, avec un bouton pour afficher quand même.",
      pourBandeau: "afficher des vidéos et des contenus d'autres sites (YouTube, Instagram, TikTok…)",
    },
    publicite: {
      nom: "Publicité",
      explication:
        "La pub qui paie l'addition pour que SOS Miam reste gratuit, toujours signalée comme telle. Avec ton accord, nos partenaires publicitaires posent des cookies pour choisir les pubs et compter leurs affichages. Sans ton accord, aucun cookie publicitaire, et le classement des lieux ne bouge pas d'un millimètre.",
      pourBandeau: "afficher de la pub qui nous aide à rester gratuits",
    },
    "mesure-audience": {
      nom: "Mesure d'audience",
      explication:
        "Nos statistiques actuelles se passent de cookie : notre serveur compte les visites tout seul, sans rien déposer chez toi, et elles n'ont pas besoin de ton accord. Cette case ne servira que si, un jour, un outil de mesure en a besoin.",
      pourBandeau: "mesurer l'audience avec un outil extérieur",
    },
  },
  partenaires: {
    "SOS Miam": { role: "Ta connexion, ton refus des statistiques, ta langue, tes choix de cookies et ta position dans la page." },
    Cloudflare: { role: "Protège le site contre les attaques et les robots." },
    "Exemple (aperçu)": {
      nom: "Exemple (aperçu)",
      role: "Partenaire imaginaire, juste pour voir le bandeau : il ne charge rien et ne dépose rien.",
    },
  },
  traceurs: {
    "__Host-sosmiam-session": { finalite: "Te garder connecté.", duree: "90 jours au plus" },
    "__Host-sosmiam-connexion-externe": { finalite: "Vérifier la réponse d'Apple ou de Google.", duree: "10 minutes au plus" },
    "__Host-sosmiam-inscription-externe": { finalite: "Finir une inscription avec Apple ou Google.", duree: "10 minutes au plus" },
    "__Host-sosmiam-confirmation-externe": { finalite: "Relier Apple ou Google à un compte sans mot de passe.", duree: "10 minutes au plus" },
    "__Host-sosmiam-connexion-qr": { finalite: "Attendre que l'app valide « Me connecter avec l'app ».", duree: "2 minutes au plus" },
    "sosmiam-sans-statistiques": { finalite: "Retenir ton refus d'être compté.", duree: "13 mois" },
    "sosmiam-langue": { finalite: "Retenir la langue que tu as choisie.", duree: "1 an" },
    [NOM_COOKIE_CONSENTEMENT]: { finalite: "Retenir tes choix de cookies.", duree: "6 mois" },
    "react-router-scroll-positions": { finalite: "Te ramener où tu étais sur une page (stockage de session).", duree: "Jusqu'à la fermeture de l'onglet" },
    "react-router-manifest-version": { finalite: "Recharger une seule fois après une mise à jour (stockage de session).", duree: "Jusqu'à la fermeture de l'onglet" },
    cf_clearance: { finalite: "Retenir que tu as passé la vérification anti-robots.", duree: "1 an" },
    __cf_bm: { finalite: "Distinguer les humains des robots.", duree: "Environ 30 minutes" },
  },
};

export const TEXTES_CONSENTEMENT_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_CONSENTEMENT>> = {
  fr: TEXTES_CONSENTEMENT,
  en: TEXTES_CONSENTEMENT_ANGLAIS,
};

const { categories: CATEGORIES, partenaires: PARTENAIRES } = TEXTES_CONSENTEMENT;
const traceur = (nom: keyof typeof TEXTES_CONSENTEMENT.traceurs): TraceurConsentement => ({ nom, ...TEXTES_CONSENTEMENT.traceurs[nom] });

export const categoriesConsentement: CategorieConsentement[] = [
  {
    id: "necessaires",
    ...CATEGORIES.necessaires,
    active: true,
    partenaires: [
      {
        nom: "SOS Miam",
        ...PARTENAIRES["SOS Miam"],
        domaines: [],
        traceurs: [
          traceur("__Host-sosmiam-session"),
          traceur("__Host-sosmiam-connexion-externe"),
          traceur("__Host-sosmiam-inscription-externe"),
          traceur("__Host-sosmiam-confirmation-externe"),
          traceur("__Host-sosmiam-connexion-qr"),
          traceur("sosmiam-sans-statistiques"),
          traceur("sosmiam-langue"),
          traceur(NOM_COOKIE_CONSENTEMENT),
          traceur("react-router-scroll-positions"),
          traceur("react-router-manifest-version"),
        ],
      },
      {
        nom: "Cloudflare",
        ...PARTENAIRES.Cloudflare,
        politique: "https://www.cloudflare.com/privacypolicy/",
        domaines: [],
        traceurs: [traceur("cf_clearance"), traceur("__cf_bm")],
      },
    ],
  },
  { id: "contenus-externes", ...CATEGORIES["contenus-externes"], active: false, partenaires: [] },
  { id: "publicite", ...CATEGORIES.publicite, active: false, partenaires: [] },
  { id: "mesure-audience", ...CATEGORIES["mesure-audience"], active: false, partenaires: [] },
];

/**
 * Aperçu du bandeau (« ?apercu-cookies », ou l'hôte apercu.sosmiam.fr) : la catégorie « publicite » devient active avec
 * ce partenaire fictif. Il n'existe pas, ne charge rien et ne dépose rien.
 */
export const partenaireApercu: PartenaireConsentement = {
  ...PARTENAIRES["Exemple (aperçu)"],
  domaines: [],
  traceurs: [],
};
