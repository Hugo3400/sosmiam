// Kit média des ambassadeurs, réservé aux ambassadeurs validés (statut « actif ») : fichiers, couleurs, polices, textes
// prêts à poster et règles (kit de marque de Hugo). Les fichiers sont dans apps/site-web/kit-media/ (pas dans public/,
// servi à tout le monde) et se téléchargent par /kit-media/<nom> (routes/ressources/telecharger-kit.ts), seulement
// s'ils sont dans la liste ci-dessous. Pour les refaire : bash scripts/generer-kit-media.sh, qui capture chaque visuel
// sur la route de rendu du serveur de développement (/rendu-kit/<id>). Aucune ville, aucune promesse.
import { couleursMarque as c } from "~/composants/marque/couleurs-marque";

/** Dossier des fichiers, depuis le dossier du site (apps/site-web), d'où le serveur est toujours lancé */
export const DOSSIER_KIT_MEDIA = "kit-media";

/** Le zip de tout le kit (avec a-lire.txt, les règles), refait par le script */
export const NOM_ZIP_KIT_MEDIA = "kit-media-sos-miam.zip";

/** Lien des textes prêts à poster : les visites qu'il amène sont comptées dans la campagne « ambassadeurs » */
export const LIEN_KIT_MEDIA = "https://sosmiam.fr/?utm_campaign=ambassadeurs";

export type DossierKit = "visuels" | "logos" | "mascotte" | "badges";

export type IdVisuelKit =
  | "story-je-suis-ambassadeur" | "post-je-suis-ambassadeur"
  | "story-sauve-une-table" | "post-sauve-une-table"
  | "story-tu-as-un-lieu" | "post-tu-as-un-lieu"
  | "logo-fond-clair" | "logo-fond-sombre" | "bouee-seule"
  | "mascotte-miam" | "mascotte-clin" | "mascotte-surprise"
  | "badge-curieux" | "badge-denicheur" | "badge-ambassadeur-de-quartier" | "badge-ambassadeur-de-ville"
  | "ecusson-ambassadeur";

export type VisuelKit = {
  /** Nom des fichiers sans l'extension, et adresse de rendu : /rendu-kit/<id> */
  id: IdVisuelKit;
  dossier: DossierKit;
  titre: string;
  /** Ce que montre l'image (texte de remplacement de son aperçu) */
  description: string;
  /** Taille du PNG, en pixels */
  largeur: number;
  hauteur: number;
  /** Fond transparent (logos, mascotte, badges) ; les visuels à poster ont leur propre fond */
  transparent: boolean;
  /** Aussi en SVG : les dessins sans texte, nets à toutes les tailles */
  svg: boolean;
  /** Aperçu sur fond sombre (le logo crème) */
  fondSombre?: boolean;
};

const STORY = { largeur: 1080, hauteur: 1920, transparent: false, svg: false };
const POST = { largeur: 1080, hauteur: 1350, transparent: false, svg: false };
const DESSIN = { largeur: 1024, hauteur: 1024, transparent: true };

/** Les visuels du kit, dans l'ordre de la page. Chacun donne un PNG, et un SVG si `svg`. */
export const visuelsKitMedia: VisuelKit[] = [
  {
    id: "story-je-suis-ambassadeur", dossier: "visuels", titre: "Story « Je suis ambassadeur »", ...STORY,
    description: "Story jaune : l'écusson au ruban « Ambassadeur » et le titre « Je suis ambassadeur SOS Miam ».",
  },
  {
    id: "post-je-suis-ambassadeur", dossier: "visuels", titre: "Post « Je suis ambassadeur »", ...POST,
    description: "Post jaune : l'écusson au ruban « Ambassadeur » et le titre « Je suis ambassadeur SOS Miam ».",
  },
  {
    id: "story-sauve-une-table", dossier: "visuels", titre: "Story « Sauve une table »", ...STORY,
    description: "Story crème : la mascotte gourmande et le titre « Sauve une table, régale-toi. »",
  },
  {
    id: "post-sauve-une-table", dossier: "visuels", titre: "Post « Sauve une table »", ...POST,
    description: "Post crème : la mascotte gourmande et le titre « Sauve une table, régale-toi. »",
  },
  {
    id: "story-tu-as-un-lieu", dossier: "visuels", titre: "Story « Tu as un lieu ? »", ...STORY,
    description: "Story noire : les pictos resto, pâtisserie, bar et sortie, et le titre « Tu as un lieu ? C'est gratuit. »",
  },
  {
    id: "post-tu-as-un-lieu", dossier: "visuels", titre: "Post « Tu as un lieu ? »", ...POST,
    description: "Post noir : les pictos resto, pâtisserie, bar et sortie, et le titre « Tu as un lieu ? C'est gratuit. »",
  },
  {
    id: "logo-fond-clair", dossier: "logos", titre: "Logo pour fond clair", largeur: 2000, hauteur: 520, transparent: true, svg: true,
    description: "Le logo SOS Miam : « SOS » en noir avec la bouée à la place du O, « Miam » en rouge tomate.",
  },
  {
    id: "logo-fond-sombre", dossier: "logos", titre: "Logo pour fond sombre", largeur: 2000, hauteur: 520, transparent: true, svg: true,
    fondSombre: true,
    description: "Le logo SOS Miam avec « SOS » en crème, pour un fond sombre.",
  },
  {
    id: "bouee-seule", dossier: "logos", titre: "La bouée seule", ...DESSIN, svg: true,
    description: "La bouée qui sourit, seule : pour les tout petits formats.",
  },
  {
    id: "mascotte-miam", dossier: "mascotte", titre: "Mascotte « Miam »", ...DESSIN, svg: true,
    description: "La mascotte : la bouée gourmande, bouche grande ouverte, sur son disque jaune clair.",
  },
  {
    id: "mascotte-clin", dossier: "mascotte", titre: "Mascotte « Clin d'œil »", ...DESSIN, svg: true,
    description: "La mascotte qui fait un clin d'œil et tire la langue, sur son disque jaune clair.",
  },
  {
    id: "mascotte-surprise", dossier: "mascotte", titre: "Mascotte « Surprise »", ...DESSIN, svg: true,
    description: "La mascotte surprise, yeux ronds et bouche en O, sur son disque jaune clair.",
  },
  {
    id: "badge-curieux", dossier: "badges", titre: "Badge Curieux (niveau 1)", ...DESSIN, svg: false,
    description: "Badge rond crème avec deux grands yeux, niveau 1.",
  },
  {
    id: "badge-denicheur", dossier: "badges", titre: "Badge Dénicheur (niveau 2)", ...DESSIN, svg: false,
    description: "Badge rond jaune clair avec une loupe sur un cœur, niveau 2.",
  },
  {
    id: "badge-ambassadeur-de-quartier", dossier: "badges", titre: "Badge Ambassadeur de quartier (niveau 3)", ...DESSIN, svg: false,
    description: "Badge rond jaune avec une boutique et son store rayé, niveau 3.",
  },
  {
    id: "badge-ambassadeur-de-ville", dossier: "badges", titre: "Badge Ambassadeur de ville (niveau 4)", ...DESSIN, svg: false,
    description: "Badge rond noir avec des immeubles jaunes et une étoile, niveau 4.",
  },
  {
    id: "ecusson-ambassadeur", dossier: "badges", titre: "Écusson Ambassadeur", ...DESSIN, svg: false,
    description: "Écusson noir et jaune : couverts croisés, bouée et ruban rouge « AMBASSADEUR ».",
  },
];

export type FichierKit = {
  /** Nom du fichier, qui est aussi son adresse de téléchargement : /kit-media/<nom> */
  nom: string;
  /** Chemin dans apps/site-web/kit-media/ */
  chemin: string;
  titre: string;
  format: "PNG" | "SVG" | "ZIP";
  /** Pour un PNG : « 1080 × 1920 px » */
  taille: string | null;
  /** Visuel dessiné par la route de rendu (aucun pour le zip) */
  visuel: IdVisuelKit | null;
};

/** Tous les fichiers téléchargeables, un par ligne : c'est la liste blanche de /kit-media/<nom> */
export const fichiersKitMedia: FichierKit[] = [
  ...visuelsKitMedia.flatMap((v): FichierKit[] => [
    { nom: `${v.id}.png`, chemin: `${v.dossier}/${v.id}.png`, titre: v.titre, format: "PNG", taille: `${v.largeur}\u00a0×\u00a0${v.hauteur}\u00a0px`, visuel: v.id },
    ...(v.svg ? [{ nom: `${v.id}.svg`, chemin: `${v.dossier}/${v.id}.svg`, titre: v.titre, format: "SVG" as const, taille: null, visuel: v.id }] : []),
  ]),
  { nom: NOM_ZIP_KIT_MEDIA, chemin: NOM_ZIP_KIT_MEDIA, titre: "Tout le kit média", format: "ZIP", taille: null, visuel: null },
];

/** Les familles de fichiers, dans l'ordre de la page */
export const dossiersKitMedia: { dossier: DossierKit; titre: string; texte: string }[] = [
  { dossier: "visuels", titre: "Les visuels à poster", texte: "Des stories (1080\u00a0×\u00a01920) et des posts (1080\u00a0×\u00a01350), prêts à partager tels quels." },
  { dossier: "logos", titre: "Les logos", texte: "Fond transparent. Garde autour du logo une marge au moins égale à la largeur de la bouée." },
  { dossier: "mascotte", titre: "La mascotte", texte: "La bouée qui sourit, en trois humeurs. Fond transparent." },
  { dossier: "badges", titre: "Les badges", texte: "Les quatre niveaux du programme et l'écusson Ambassadeur. Fond transparent." },
];

/** « Comment ça marche ? » en haut de la page (mêmes comptes que contenus/liens-publics.ts) */
export const etapesKitMedia = [
  "Choisis une image.",
  "Copie un texte.",
  "Poste et identifie-nous (@sos.miam sur TikTok, @official.sosmiam sur Instagram).",
];

/** Les couleurs de la marque (les mêmes que les dessins : composants/marque/couleurs-marque.ts) */
export const couleursKitMedia = [
  { nom: "Jaune SOS", hex: c.jaune, usage: "La couleur de SOS Miam : la bouée, les fonds, les boutons." },
  { nom: "Tomate", hex: c.tomate, usage: "« Miam » et les petites touches qui attirent l'œil." },
  { nom: "Encre", hex: c.encre, usage: "Le texte et les contours." },
  { nom: "Jaune clair", hex: c.jauneClair, usage: "Les fonds doux." },
  { nom: "Crème", hex: c.creme, usage: "Les fonds de page." },
  { nom: "Blanc", hex: c.blanc, usage: "Les cartes, et le texte sur fond sombre." },
];

/** Les deux polices, gratuites sur Google Fonts */
export const policesKitMedia: { nom: string; usage: string; lien: string; titre: boolean }[] = [
  { nom: "Bricolage Grotesque", usage: "Pour les titres, en très gras (800).", lien: "https://fonts.google.com/specimen/Bricolage+Grotesque", titre: true },
  { nom: "Inter", usage: "Pour le texte.", lien: "https://fonts.google.com/specimen/Inter", titre: false },
];

/** Textes prêts à poster : simples, deux emojis au plus, toujours le lien et #SOSMiam */
export const textesKitMedia: { titre: string; texte: string }[] = [
  {
    titre: "Je suis ambassadeur",
    texte: `Je suis ambassadeur SOS Miam ! 🎉
Je déniche les restos, pâtisseries, bars et sorties indépendants qui méritent plus de monde, pour te les faire découvrir.
SOS Miam arrive bientôt partout en France : ${LIEN_KIT_MEDIA}
#SOSMiam`,
  },
  {
    titre: "Sauve une table",
    texte: `Une salle trop calme un mardi soir, une pépite qui vient d'ouvrir : ces lieux ont besoin de monde. Et toi, tu as faim. 😋
Sauve une table, régale-toi : c'est SOS Miam, bientôt partout en France.
${LIEN_KIT_MEDIA}
#SOSMiam`,
  },
  {
    titre: "Tu as un lieu ?",
    texte: `Tu as un resto, une pâtisserie, un bar ou un lieu de sortie indépendant ? 🍽️
Inscris-le sur SOS Miam : c'est gratuit, sans abonnement et sans commission.
${LIEN_KIT_MEDIA}
#SOSMiam`,
  },
  {
    titre: "Ta pépite",
    texte: `Ton resto, ton bar ou ta pâtisserie préférés, ceux que trop peu de gens connaissent : c'est lequel ? Dis-le-moi en commentaire ! 👀
Je suis ambassadeur SOS Miam : on fait découvrir les lieux indépendants, bientôt partout en France.
${LIEN_KIT_MEDIA}
#SOSMiam`,
  },
  {
    titre: "Deviens ambassadeur",
    texte: `Toi aussi, tu as l'œil pour dénicher les bonnes adresses ? Deviens ambassadeur SOS Miam, dès 18 ans : une aventure de passionnés, à ton rythme. ✨
${LIEN_KIT_MEDIA}
#SOSMiam`,
  },
];

/** Les règles du kit de marque. Elles accompagnent aussi le zip (a-lire.txt). */
export const reglesKitMedia = {
  peux: [
    "Partager les visuels et les textes du kit pour parler de SOS Miam, sur tes réseaux ou autour de toi.",
    "Écrire tes propres textes, avec tes mots à toi.",
    "Dire que tu es ambassadeur SOS Miam.",
    "Poser le logo sur un fond clair, ou sa version crème sur un fond sombre, avec autour une marge au moins égale à la largeur de la bouée.",
    "Utiliser la bouée seule quand le logo ferait moins de 120 px de large.",
    "Parler d'un lieu qui t'a offert quelque chose (un repas, un verre…), en écrivant clairement « Collaboration commerciale ».",
  ],
  peuxPas: [
    "Déformer, recolorer ou redessiner le logo, la mascotte ou les badges.",
    "Te faire passer pour SOS Miam : tu parles en ton nom, comme ambassadeur.",
    "Promettre quoi que ce soit au nom de SOS Miam (une réduction, une place, une date de sortie…).",
    "Te faire payer par un lieu que tu mets en avant.",
    "Parler d'un lieu en difficulté pour faire pitié : on en parle avec dignité.",
    "Reprendre la photo ou la vidéo de quelqu'un sans son accord.",
    "Utiliser le kit pour autre chose que parler de SOS Miam (le vendre, l'utiliser pour une autre marque…).",
  ],
};
