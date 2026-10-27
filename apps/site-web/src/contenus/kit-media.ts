// Kit média des ambassadeurs, réservé aux ambassadeurs validés (statut « actif ») : fichiers, couleurs, polices, textes
// prêts à poster et règles (kit de marque de Hugo). Les fichiers sont dans apps/site-web/kit-media/ (pas dans public/,
// servi à tout le monde) et se téléchargent par /kit-media/<nom> (routes/ressources/telecharger-kit.ts), seulement
// s'ils sont dans la liste ci-dessous. Pour les refaire : npm run site:kit-media (scripts/generer-kit-media.sh), qui
// capture chaque visuel sur la route de rendu du serveur de développement (/rendu-kit/<id>). Aucune ville, aucune promesse.
import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { couleursMarque as c } from "~/composants/marque/couleurs-marque";
import { TEXTES_KIT_MEDIA_ANGLAIS } from "~/contenus/anglais/kit-media";

/** Dossier des fichiers, depuis le dossier du site (apps/site-web), d'où le serveur est toujours lancé */
export const DOSSIER_KIT_MEDIA = "kit-media";

/** Le zip de tout le kit (avec a-lire.txt : les règles et les textes prêts à poster), refait par le script */
export const NOM_ZIP_KIT_MEDIA = "kit-media-sos-miam.zip";

/** Lien des textes prêts à poster : les visites qu'il amène sont comptées dans la campagne « ambassadeurs » */
export const LIEN_KIT_MEDIA = "https://sosmiam.fr/?utm_campaign=ambassadeurs";

export type DossierKit = "visuels" | "logos" | "mascotte" | "badges";

export type IdVisuelKit =
  | "story-je-suis-ambassadeur" | "post-je-suis-ambassadeur"
  | "story-sauve-une-table" | "post-sauve-une-table"
  | "story-tu-as-un-lieu" | "post-tu-as-un-lieu"
  | "story-miam-safe" | "post-miam-safe"
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
  /** Aussi en SVG : les dessins sans texte, nets à toutes les tailles */
  svg: boolean;
  /** Aperçu sur fond sombre (le logo crème) */
  fondSombre?: boolean;
};

const STORY = { largeur: 1080, hauteur: 1920, svg: false };
const POST = { largeur: 1080, hauteur: 1350, svg: false };
const DESSIN = { largeur: 1024, hauteur: 1024 };

const VISUELS: Omit<VisuelKit, "titre" | "description">[] = [
  { id: "story-je-suis-ambassadeur", dossier: "visuels", ...STORY },
  { id: "post-je-suis-ambassadeur", dossier: "visuels", ...POST },
  { id: "story-sauve-une-table", dossier: "visuels", ...STORY },
  { id: "post-sauve-une-table", dossier: "visuels", ...POST },
  { id: "story-tu-as-un-lieu", dossier: "visuels", ...STORY },
  { id: "post-tu-as-un-lieu", dossier: "visuels", ...POST },
  { id: "story-miam-safe", dossier: "visuels", ...STORY },
  { id: "post-miam-safe", dossier: "visuels", ...POST },
  { id: "logo-fond-clair", dossier: "logos", largeur: 2000, hauteur: 520, svg: true },
  { id: "logo-fond-sombre", dossier: "logos", largeur: 2000, hauteur: 520, svg: true, fondSombre: true },
  { id: "bouee-seule", dossier: "logos", ...DESSIN, svg: true },
  { id: "mascotte-miam", dossier: "mascotte", ...DESSIN, svg: true },
  { id: "mascotte-clin", dossier: "mascotte", ...DESSIN, svg: true },
  { id: "mascotte-surprise", dossier: "mascotte", ...DESSIN, svg: true },
  { id: "badge-curieux", dossier: "badges", ...DESSIN, svg: false },
  { id: "badge-denicheur", dossier: "badges", ...DESSIN, svg: false },
  { id: "badge-ambassadeur-de-quartier", dossier: "badges", ...DESSIN, svg: false },
  { id: "badge-ambassadeur-de-ville", dossier: "badges", ...DESSIN, svg: false },
  { id: "ecusson-ambassadeur", dossier: "badges", ...DESSIN, svg: false },
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

export const COULEURS_KIT_MEDIA = [c.jaune, c.tomate, c.encre, c.jauneClair, c.creme, c.blanc];

export const POLICES_KIT_MEDIA = [
  { nom: "Bricolage Grotesque", lien: "https://fonts.google.com/specimen/Bricolage+Grotesque", titre: true },
  { nom: "Inter", lien: "https://fonts.google.com/specimen/Inter", titre: false },
];

export const TEXTES_KIT_MEDIA = {
  meta: { titre: "Ton kit média — SOS Miam" },
  visuels: {
    "story-je-suis-ambassadeur": {
      titre: "Story « Je suis ambassadeur »",
      description: "Story jaune : l'écusson au ruban « Ambassadeur » et le titre « Je suis ambassadeur SOS Miam ».",
    },
    "post-je-suis-ambassadeur": {
      titre: "Post « Je suis ambassadeur »",
      description: "Post jaune : l'écusson au ruban « Ambassadeur » et le titre « Je suis ambassadeur SOS Miam ».",
    },
    "story-sauve-une-table": {
      titre: "Story « Sauve une table »",
      description: "Story crème : la mascotte gourmande et le titre « Sauve une table, régale-toi. »",
    },
    "post-sauve-une-table": {
      titre: "Post « Sauve une table »",
      description: "Post crème : la mascotte gourmande et le titre « Sauve une table, régale-toi. »",
    },
    "story-tu-as-un-lieu": {
      titre: "Story « Tu as un lieu ? »",
      description: "Story noire : les pictos resto, pâtisserie, bar et sortie, et le titre « Tu as un lieu ? C'est gratuit. »",
    },
    "post-tu-as-un-lieu": {
      titre: "Post « Tu as un lieu ? »",
      description: "Post noir : les pictos resto, pâtisserie, bar et sortie, et le titre « Tu as un lieu ? C'est gratuit. »",
    },
    "story-miam-safe": {
      titre: "Story « Miam Safe »",
      description: "Story noire : « Bientôt dans l'app », le Capitaine qui fait un clin d'œil, « Miam Safe » et la phrase « Le Capitaine est là ? ».",
    },
    "post-miam-safe": {
      titre: "Post « Miam Safe »",
      description: "Post noir : « Bientôt dans l'app », le Capitaine qui fait un clin d'œil, « Miam Safe » et la phrase « Le Capitaine est là ? ».",
    },
    "logo-fond-clair": {
      titre: "Logo pour fond clair",
      description: "Le logo SOS Miam : « SOS » en noir avec la bouée à la place du O, « Miam » en rouge tomate.",
    },
    "logo-fond-sombre": { titre: "Logo pour fond sombre", description: "Le logo SOS Miam avec « SOS » en crème, pour un fond sombre." },
    "bouee-seule": { titre: "La bouée seule", description: "La bouée qui sourit, seule : pour les tout petits formats." },
    "mascotte-miam": { titre: "Mascotte « Miam »", description: "La mascotte : la bouée gourmande, bouche grande ouverte, sur son disque jaune clair." },
    "mascotte-clin": { titre: "Mascotte « Clin d'œil »", description: "La mascotte qui fait un clin d'œil et tire la langue, sur son disque jaune clair." },
    "mascotte-surprise": { titre: "Mascotte « Surprise »", description: "La mascotte surprise, yeux ronds et bouche en O, sur son disque jaune clair." },
    "badge-curieux": { titre: "Badge Curieux (niveau 1)", description: "Badge rond crème avec deux grands yeux, niveau 1." },
    "badge-denicheur": { titre: "Badge Dénicheur (niveau 2)", description: "Badge rond jaune clair avec une loupe sur un cœur, niveau 2." },
    "badge-ambassadeur-de-quartier": {
      titre: "Badge Ambassadeur de quartier (niveau 3)",
      description: "Badge rond jaune avec une boutique et son store rayé, niveau 3.",
    },
    "badge-ambassadeur-de-ville": {
      titre: "Badge Ambassadeur de ville (niveau 4)",
      description: "Badge rond noir avec des immeubles jaunes et une étoile, niveau 4.",
    },
    "ecusson-ambassadeur": { titre: "Écusson Ambassadeur", description: "Écusson noir et jaune : couverts croisés, bouée et ruban rouge « AMBASSADEUR »." },
  },
  toutLeKit: "Tout le kit média",
  dossiers: {
    visuels: { titre: "Les visuels à poster", texte: "Des stories (1080\u00a0×\u00a01920) et des posts (1080\u00a0×\u00a01350), prêts à partager tels quels." },
    logos: { titre: "Les logos", texte: "Fond transparent. Garde autour du logo une marge au moins égale à la largeur de la bouée." },
    mascotte: { titre: "La mascotte", texte: "La bouée qui sourit, en trois humeurs. Fond transparent." },
    badges: { titre: "Les badges", texte: "Les quatre niveaux du programme et l'écusson Ambassadeur. Fond transparent." },
  },
  etapes: [
    "Choisis une image.",
    "Copie un texte.",
    "Poste et identifie-nous (@sos.miam sur TikTok, @official.sosmiam sur Instagram).",
  ],
  couleurs: [
    { nom: "Jaune SOS", usage: "La couleur de SOS Miam : la bouée, les fonds, les boutons." },
    { nom: "Tomate", usage: "« Miam » et les petites touches qui attirent l'œil." },
    { nom: "Encre", usage: "Le texte et les contours." },
    { nom: "Jaune clair", usage: "Les fonds doux." },
    { nom: "Crème", usage: "Les fonds de page." },
    { nom: "Blanc", usage: "Les cartes, et le texte sur fond sombre." },
  ],
  usagesPolices: ["Pour les titres, en très gras (800).", "Pour le texte."],
  textes: [
    {
      titre: "Je suis ambassadeur",
      texte: (lien: string) => `Je suis ambassadeur SOS Miam ! 🎉
Je déniche les restos, pâtisseries, bars et sorties indépendants qui méritent plus de monde, pour te les faire découvrir.
SOS Miam arrive bientôt partout en France : ${lien}
#SOSMiam`,
    },
    {
      titre: "Sauve une table",
      texte: (lien: string) => `Une salle trop calme un mardi soir, une pépite qui vient d'ouvrir : ces lieux ont besoin de monde. Et toi, tu as faim. 😋
Sauve une table, régale-toi : c'est SOS Miam, bientôt partout en France.
${lien}
#SOSMiam`,
    },
    {
      titre: "Tu as un lieu ?",
      texte: (lien: string) => `Tu as un resto, une pâtisserie, un bar ou un lieu de sortie indépendant ? 🍽️
Inscris-le sur SOS Miam : c'est gratuit, sans abonnement et sans commission.
${lien}
#SOSMiam`,
    },
    {
      titre: "Miam Safe",
      texte: (lien: string) => `Bientôt dans l'app SOS Miam : Miam Safe. 🛟
Pas à l'aise dans un lieu ? Un coup de main pour alerter l'équipe, discrètement. Dans les lieux qui ont signé la charte, une phrase suffit au comptoir : « Le Capitaine est là ? »
${lien}
#SOSMiam`,
    },
    {
      titre: "Ta pépite",
      texte: (lien: string) => `Ta pépite à toi, le resto, le bar ou la pâtisserie que trop peu de gens connaissent : c'est laquelle ? Dis-le-moi en commentaire ! 👀
Je suis ambassadeur SOS Miam : on fait découvrir les lieux indépendants, bientôt partout en France.
${lien}
#SOSMiam`,
    },
    {
      titre: "Deviens ambassadeur",
      texte: (lien: string) => `Toi aussi, tu as l'œil pour dénicher les bonnes adresses ? Deviens ambassadeur SOS Miam, dès 18 ans : une aventure de passionnés, à ton rythme. ✨
${lien}
#SOSMiam`,
    },
  ],
  regles: {
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
  },
  page: {
    retour: "Mon espace",
    titre: "Ton kit média",
    introDebut: "Des visuels prêts à poster, des textes à copier, nos logos et notre mascotte : tout ce qu'il faut pour parler de SOS Miam autour de toi. Un œil sur ",
    lienRegles: "les règles",
    introFin: " avant de poster, et c'est parti !",
    commentCaMarche: "Comment ça marche ?",
    toutDUnCoup: "Tout le kit d'un coup : images, logos, mascotte, badges, textes et règles, dans un seul fichier.",
    toutTelecharger: (poids: string | null | undefined) => `Tout télécharger${poids ? ` (ZIP, ${poids})` : " (ZIP)"}`,
    titreTextes: "Les textes prêts à poster",
    texteTextes: "Copie, colle, poste : le lien et #SOSMiam sont déjà dedans. Tu peux aussi les changer à ta sauce.",
    couleurs: "Les couleurs",
    polices: "Les polices",
    textePolices: "Gratuites, à installer si tu fais tes propres visuels.",
    regles: "Les règles du kit",
    texteRegles: "Le kit sert à parler de SOS Miam, en ton nom, comme ambassadeur. Quelques règles pour que ça reste juste et sympa pour tout le monde.",
  },
  carte: {
    telecharger: (format: string) => `Télécharger le ${format}`,
    netPartout: "net à toutes les tailles",
  },
  copier: {
    bouton: "Copier",
    copie: "Copié !",
    rate: "La copie n'a pas marché : sélectionne le texte à la main.",
    leTexte: (titre: string) => `le texte « ${titre} »`,
    leCode: (nom: string) => `le code de la couleur ${nom}`,
  },
  polices: {
    exemple: "Sauve une table, régale-toi.",
    telecharger: "La télécharger sur Google Fonts",
  },
  colonnesRegles: { peux: "Tu peux", peuxPas: "Tu ne peux pas" },
};

export const TEXTES_KIT_MEDIA_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_KIT_MEDIA>> = {
  fr: TEXTES_KIT_MEDIA,
  en: TEXTES_KIT_MEDIA_ANGLAIS,
};

export const visuelsKitMedia: VisuelKit[] = VISUELS.map((visuel) => ({ ...visuel, ...TEXTES_KIT_MEDIA.visuels[visuel.id] }));

/** Tous les fichiers téléchargeables, un par ligne : c'est la liste blanche de /kit-media/<nom> */
export const fichiersKitMedia: FichierKit[] = [
  ...visuelsKitMedia.flatMap((v): FichierKit[] => [
    { nom: `${v.id}.png`, chemin: `${v.dossier}/${v.id}.png`, titre: v.titre, format: "PNG", taille: `${v.largeur}\u00a0×\u00a0${v.hauteur}\u00a0px`, visuel: v.id },
    ...(v.svg ? [{ nom: `${v.id}.svg`, chemin: `${v.dossier}/${v.id}.svg`, titre: v.titre, format: "SVG" as const, taille: null, visuel: v.id }] : []),
  ]),
  { nom: NOM_ZIP_KIT_MEDIA, chemin: NOM_ZIP_KIT_MEDIA, titre: TEXTES_KIT_MEDIA.toutLeKit, format: "ZIP", taille: null, visuel: null },
];

/** Les familles de fichiers, dans l'ordre de la page */
export const dossiersKitMedia: { dossier: DossierKit; titre: string; texte: string }[] = (["visuels", "logos", "mascotte", "badges"] as const).map(
  (dossier) => ({ dossier, ...TEXTES_KIT_MEDIA.dossiers[dossier] }),
);

/** « Comment ça marche ? » en haut de la page (mêmes comptes que contenus/liens-publics.ts) */
export const etapesKitMedia = TEXTES_KIT_MEDIA.etapes;

/** Les couleurs de la marque (les mêmes que les dessins : composants/marque/couleurs-marque.ts) */
export const couleursKitMedia = COULEURS_KIT_MEDIA.map((hex, i) => ({ nom: TEXTES_KIT_MEDIA.couleurs[i].nom, hex, usage: TEXTES_KIT_MEDIA.couleurs[i].usage }));

/** Les deux polices, gratuites sur Google Fonts */
export const policesKitMedia: { nom: string; usage: string; lien: string; titre: boolean }[] = POLICES_KIT_MEDIA.map((police, i) => ({
  nom: police.nom, usage: TEXTES_KIT_MEDIA.usagesPolices[i], lien: police.lien, titre: police.titre,
}));

/** Textes prêts à poster : simples, deux emojis au plus, toujours le lien et #SOSMiam */
export const textesKitMedia: { titre: string; texte: string }[] = TEXTES_KIT_MEDIA.textes.map(({ titre, texte }) => ({ titre, texte: texte(LIEN_KIT_MEDIA) }));

/** Les règles du kit de marque. Elles accompagnent aussi le zip (a-lire.txt). */
export const reglesKitMedia = TEXTES_KIT_MEDIA.regles;
