// Kit média des lieux, dans l'espace pro (pro.sosmiam.fr, /lieu/:id/kit) : de quoi dire « on est sur SOS Miam » sur ses
// réseaux et en vitrine, et le matériel Miam Safe pour les lieux qui ont signé la charte. Réservé aux comptes rattachés à
// un lieu (gérant ou équipe, rattachement validé). Les fichiers sont dans apps/site-web/kit-media-lieux/ (pas dans public/),
// servis par /kit-media-lieux/<nom> (routes/ressources/telecharger-kit-lieux.ts). Pour les refaire :
// npm run site:kit-media-lieux (scripts/generer-kit-media-lieux.sh), qui capture chaque visuel sur la route de rendu du
// serveur de développement (/rendu-kit-lieux/<id>). Aucune promesse : ni de monde, ni de classement, ni de sécurité.
import { PHRASE_MIAM_SAFE } from "../../../../packages/commun/src/regles/miam-safe.ts";
import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_KIT_MEDIA_LIEUX_ANGLAIS } from "~/contenus/anglais/kit-media-lieux";

/** Dossier des fichiers, depuis le dossier du site (apps/site-web), d'où le serveur est toujours lancé */
export const DOSSIER_KIT_MEDIA_LIEUX = "kit-media-lieux";

/** Le zip de tout le kit (avec a-lire.txt : les textes et les règles), refait par le script */
export const NOM_ZIP_KIT_MEDIA_LIEUX = "kit-media-lieux-sos-miam.zip";

export type IdVisuelKitLieux =
  | "story-on-est-sur-sos-miam" | "post-on-est-sur-sos-miam"
  | "story-lieu-miam-safe" | "post-lieu-miam-safe"
  | "autocollant-sos-miam" | "autocollant-miam-safe"
  | "memo-equipe-miam-safe"
  | "logo-fond-clair" | "logo-fond-sombre";

/** Les familles du kit, dans l'ordre de la page */
export type GroupeKitLieux = "reseaux" | "vitrine" | "equipe" | "logos";

/** Taille d'une page : en pixels (le PNG, et le dessin) et, pour ce qui s'imprime, en millimètres (le PDF, à 300 dpi) */
export type FormatKitLieux = { nom: string; largeur: number; hauteur: number; largeurMm: number; hauteurMm: number };

export const formatsKitLieux = {
  story: { nom: "Story", largeur: 1080, hauteur: 1920, largeurMm: 0, hauteurMm: 0 },
  post: { nom: "Post", largeur: 1080, hauteur: 1350, largeurMm: 0, hauteurMm: 0 },
  /** Autocollant rond de 10 cm, sur un carré (à découper en suivant le cercle) */
  autocollant: { nom: "10 × 10 cm", largeur: 1181, hauteur: 1181, largeurMm: 100, hauteurMm: 100 },
  A5: { nom: "A5", largeur: 1748, hauteur: 2480, largeurMm: 148, hauteurMm: 210 },
  logo: { nom: "Logo", largeur: 2000, hauteur: 520, largeurMm: 0, hauteurMm: 0 },
} as const satisfies Record<string, FormatKitLieux>;

export type VisuelKitLieux = {
  /** Adresse de rendu : /rendu-kit-lieux/<id> (avec ?impression=1 : la version PDF, à la taille du papier) */
  id: IdVisuelKitLieux;
  groupe: GroupeKitLieux;
  titre: string;
  /** Ce que montre le fichier (texte de remplacement de son aperçu) */
  description: string;
  format: FormatKitLieux;
  /** Produit aussi en PDF, à imprimer */
  pdf: boolean;
  /** Seulement pour les lieux qui ont signé la charte Miam Safe */
  miamSafe?: true;
};

export const TEXTES_KIT_MEDIA_LIEUX = {
  visuels: {
    "story-on-est-sur-sos-miam": {
      titre: "Story « On est sur SOS Miam »",
      description: "Story jaune : le Capitaine qui dit « Miam », « On est sur SOS Miam ! » et sosmiam.fr.",
    },
    "post-on-est-sur-sos-miam": {
      titre: "Post « On est sur SOS Miam »",
      description: "Post jaune : le Capitaine qui dit « Miam », « On est sur SOS Miam ! » et sosmiam.fr.",
    },
    "story-lieu-miam-safe": {
      titre: "Story « Ici, on est Miam Safe »",
      description: "Story noire : le bouclier Miam Safe, « Ici, on est Miam Safe » et la phrase « Le Capitaine est là ? » à dire au comptoir.",
    },
    "post-lieu-miam-safe": {
      titre: "Post « Ici, on est Miam Safe »",
      description: "Post noir : le bouclier Miam Safe, « Ici, on est Miam Safe » et la phrase « Le Capitaine est là ? » à dire au comptoir.",
    },
    "autocollant-sos-miam": {
      titre: "Autocollant de vitrine « On est sur SOS Miam »",
      description: "Rond jaune de 10 cm : le logo, « On est sur SOS Miam » et sosmiam.fr. À imprimer sur du papier autocollant, puis à découper.",
    },
    "autocollant-miam-safe": {
      titre: "Autocollant de vitrine « Lieu Miam Safe »",
      description: "Rond noir de 10 cm : le bouclier Miam Safe, « Lieu Miam Safe » et la phrase « Le Capitaine est là ? ».",
    },
    "memo-equipe-miam-safe": {
      titre: "Mémo d'équipe Miam Safe (A5)",
      description: "Mémo A5 à garder derrière le comptoir : la phrase, l'écran à reconnaître, les quatre gestes, quoi faire quand une alerte arrive, et les numéros des secours.",
    },
    "logo-fond-clair": {
      titre: "Logo pour fond clair",
      description: "Le logo SOS Miam, « SOS » en noir et « Miam » en tomate, sur fond transparent.",
    },
    "logo-fond-sombre": {
      titre: "Logo pour fond sombre",
      description: "Le logo SOS Miam, « SOS » en crème et « Miam » en tomate, sur fond transparent.",
    },
  } satisfies Record<IdVisuelKitLieux, { titre: string; description: string }>,
  zip: "Tout le kit média du lieu",
  groupes: {
    reseaux: { titre: "Pour tes réseaux", texte: "Des stories (1080 × 1920) et des posts (1080 × 1350), prêts à partager tels quels." },
    vitrine: { titre: "Pour ta vitrine", texte: "Des autocollants ronds de 10 cm : imprime le PDF sur du papier autocollant, puis découpe en suivant le cercle." },
    equipe: { titre: "Pour ton équipe", texte: "À imprimer et à garder derrière le comptoir." },
    logos: { titre: "Les logos", texte: "Fond transparent. Garde autour du logo une marge au moins égale à la largeur de la bouée." },
  } satisfies Record<GroupeKitLieux, { titre: string; texte: string }>,
  miamSafe: {
    signee: "Ton lieu a signé la charte Miam Safe : ces visuels sont pour toi.",
    pasSignee: "Ces visuels sont réservés aux lieux qui ont signé la charte Miam Safe. Signe-la d'abord, depuis la page Miam Safe de ton lieu.",
  },
  ecrireTextes: (nomLieu: string, lien: string): { titre: string; texte: string; miamSafe?: true }[] => [
    {
      titre: "On est sur SOS Miam",
      texte: `${nomLieu} est sur SOS Miam ! 🛟
SOS Miam fait découvrir les lieux indépendants du coin. Viens nous voir, et ajoute-nous à tes favoris :
${lien}
#SOSMiam`,
    },
    {
      titre: "Ta pépite du quartier",
      texte: `Tu cherches une adresse indépendante près de chez toi ? Retrouve ${nomLieu} sur SOS Miam, avec nos horaires et nos infos pratiques. 😋
${lien}
#SOSMiam`,
    },
    {
      titre: "Ici, on est Miam Safe",
      texte: `Chez ${nomLieu}, notre équipe a signé la charte Miam Safe. 🛡
Pas à l'aise pendant ta visite ? Dis simplement au comptoir : « ${PHRASE_MIAM_SAFE} ». On vient te voir, discrètement.
${lien}
#SOSMiam`,
      miamSafe: true,
    },
  ],
  regles: {
    peux: [
      "Poster les visuels et les textes du kit sur les réseaux de ton lieu, et les adapter avec tes mots.",
      "Imprimer les autocollants et le mémo autant que tu veux, pour ta vitrine, tes tables et ton équipe.",
      "Mettre le logo SOS Miam sur ton site ou tes réseaux, sur un fond clair (ou sa version crème sur un fond sombre).",
    ],
    peuxPas: [
      "Utiliser les visuels Miam Safe si ton lieu n'a pas signé la charte, ou après l'avoir quittée.",
      "Présenter Miam Safe comme une protection ou une garantie : c'est un coup de main pour alerter ton équipe, rien de plus.",
      "Laisser croire à un partenariat payant, à une note ou à une place dans un classement : SOS Miam est gratuit et ne vend aucune mise en avant.",
      "Déformer, recolorer ou redessiner le logo, la mascotte ou le bouclier.",
      "Utiliser le kit pour autre chose que dire que ton lieu est sur SOS Miam.",
    ],
  },
};

export const TEXTES_KIT_MEDIA_LIEUX_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_KIT_MEDIA_LIEUX>> = {
  fr: TEXTES_KIT_MEDIA_LIEUX,
  en: TEXTES_KIT_MEDIA_LIEUX_ANGLAIS,
};

const T = TEXTES_KIT_MEDIA_LIEUX;

/** Les visuels du kit, dans l'ordre de la page. Chacun donne un PNG, et un PDF s'il s'imprime. */
export const visuelsKitMediaLieux: VisuelKitLieux[] = [
  { id: "story-on-est-sur-sos-miam", groupe: "reseaux", ...T.visuels["story-on-est-sur-sos-miam"], format: formatsKitLieux.story, pdf: false },
  { id: "post-on-est-sur-sos-miam", groupe: "reseaux", ...T.visuels["post-on-est-sur-sos-miam"], format: formatsKitLieux.post, pdf: false },
  { id: "story-lieu-miam-safe", groupe: "reseaux", ...T.visuels["story-lieu-miam-safe"], format: formatsKitLieux.story, pdf: false, miamSafe: true },
  { id: "post-lieu-miam-safe", groupe: "reseaux", ...T.visuels["post-lieu-miam-safe"], format: formatsKitLieux.post, pdf: false, miamSafe: true },
  { id: "autocollant-sos-miam", groupe: "vitrine", ...T.visuels["autocollant-sos-miam"], format: formatsKitLieux.autocollant, pdf: true },
  { id: "autocollant-miam-safe", groupe: "vitrine", ...T.visuels["autocollant-miam-safe"], format: formatsKitLieux.autocollant, pdf: true, miamSafe: true },
  { id: "memo-equipe-miam-safe", groupe: "equipe", ...T.visuels["memo-equipe-miam-safe"], format: formatsKitLieux.A5, pdf: true, miamSafe: true },
  { id: "logo-fond-clair", groupe: "logos", ...T.visuels["logo-fond-clair"], format: formatsKitLieux.logo, pdf: false },
  { id: "logo-fond-sombre", groupe: "logos", ...T.visuels["logo-fond-sombre"], format: formatsKitLieux.logo, pdf: false },
];

export type FichierKitLieux = {
  /** Nom du fichier, qui est aussi son adresse de téléchargement : /kit-media-lieux/<nom> */
  nom: string;
  /** Chemin dans apps/site-web/kit-media-lieux/ */
  chemin: string;
  titre: string;
  format: "PNG" | "PDF" | "ZIP";
  /** « 1080 × 1920 px » pour un PNG, « 10 × 10 cm » pour un PDF */
  taille: string | null;
  /** Visuel dessiné par la route de rendu (aucun pour le zip) */
  visuel: IdVisuelKitLieux | null;
};

const nbsp = " ";

/** Tous les fichiers du kit des lieux, un par ligne : c'est la liste blanche de /kit-media-lieux/<nom> */
export const fichiersKitMediaLieux: FichierKitLieux[] = [
  ...visuelsKitMediaLieux.flatMap((v): FichierKitLieux[] => [
    { nom: `${v.id}.png`, chemin: `${v.id}.png`, titre: v.titre, format: "PNG", taille: `${v.format.largeur}${nbsp}×${nbsp}${v.format.hauteur}${nbsp}px`, visuel: v.id },
    ...(v.pdf ? [{ nom: `${v.id}.pdf`, chemin: `${v.id}.pdf`, titre: v.titre, format: "PDF" as const, taille: v.format.nom.replaceAll(" ", nbsp), visuel: v.id }] : []),
  ]),
  { nom: NOM_ZIP_KIT_MEDIA_LIEUX, chemin: NOM_ZIP_KIT_MEDIA_LIEUX, titre: T.zip, format: "ZIP", taille: null, visuel: null },
];

/** Les familles de fichiers, dans l'ordre de la page */
export const groupesKitMediaLieux: { groupe: GroupeKitLieux; titre: string; texte: string }[] = (["reseaux", "vitrine", "equipe", "logos"] as const).map(
  (groupe) => ({ groupe, ...T.groupes[groupe] }),
);

/** Le texte de la fiche Miam Safe, en tête des visuels Miam Safe */
export const texteMiamSafeKitLieux = T.miamSafe;

/** Le visuel « Ici, on est Miam Safe » et l'autocollant */
export const texteLieuMiamSafe = {
  titre: "Ici, on est Miam Safe",
  intro: "Pas à l’aise ? Dis au comptoir :",
  phrase: PHRASE_MIAM_SAFE,
  suite: "Notre équipe vient te voir, discrètement.",
};

/** Le mémo d'équipe Miam Safe (A5) : les mêmes gestes que la charte, en très court */
export const texteMemoEquipe = {
  surtitre: "Miam Safe · mémo d'équipe",
  siOnTeDit: "Si on te dit",
  ouEcran: "ou si on te montre cet écran, la personne a besoin d'aide, sans que ça se voie.",
  gestes: [
    { titre: "Réponds calmement :", texte: "« Oui, viens, je t'emmène le voir. »" },
    { titre: "Mets la personne à l'abri", texte: "hors de la salle, dans un endroit calme." },
    { titre: "Écoute et demande", texte: "ce qu'il lui faut : un taxi, appeler un proche, les secours." },
    { titre: "Pas d'annonce, pas d'esclandre.", texte: "Ne confronte pas seul la personne qui pose problème." },
  ],
  alerte: "Alerte sur ton téléphone pro ? Appuie sur « On arrive », puis va voir à l'endroit indiqué.",
  danger: "Danger réel : n'attends pas.",
  numeros: "17 · 18 · 15 · 112 · 114",
};

/** Textes prêts à poster par le lieu. `lien` : l'adresse de sa fiche sur sosmiam.fr. */
export function ecrireTextesKitLieux(nomLieu: string, lien: string): { titre: string; texte: string; miamSafe?: true }[] {
  return T.ecrireTextes(nomLieu, lien);
}

/** Les règles du kit des lieux. Elles accompagnent aussi le zip (a-lire.txt). */
export const reglesKitMediaLieux = T.regles;
