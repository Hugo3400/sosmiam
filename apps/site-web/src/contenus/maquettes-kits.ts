// Les maquettes validées par Hugo le 14 octobre 2026 (affiches, imprimés, visuels réseaux), dans les kits médias du site.
// Les fichiers ne sont pas recopiés : ils sont lus dans presse/ à la racine du dépôt (le dossier de l'Espace presse du
// logiciel de gestion, refait par l'export des maquettes), et servis par la route de chaque kit, seulement s'ils sont
// dans cette liste. Les maquettes à personnaliser (vitrine au nom du lieu, chevalet de table, carte de visite) n'y sont pas.
import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_MAQUETTES_KITS_ANGLAIS } from "./anglais/maquettes-kits.ts";

/** Dossier presse/, depuis le dossier du site (apps/site-web), d'où le serveur est toujours lancé */
export const DOSSIER_PRESSE = "../../presse";

export type KitMaquettes = "ambassadeurs" | "pro" | "lieux";
export type GroupeMaquettes = "affiches" | "imprimes" | "reseaux";

export type FichierMaquette = {
  /** Nom de téléchargement, unique dans un kit (et adresse : /<kit>/<nom>) */
  nom: string;
  /** Chemin dans presse/ */
  chemin: string;
  format: "PNG" | "PDF" | "ZIP";
  /** « A4 », « 40 × 60 cm », « 6 images »… */
  taille: string;
};

export type Maquette = {
  id: string;
  groupe: GroupeMaquettes;
  titre: string;
  texte: string;
  /** Les aperçus (légers, 360 px de large au plus) et ce qu'ils montrent */
  apercus: { nom: string; chemin: string; description: string }[];
  fichiers: FichierMaquette[];
  kits: KitMaquettes[];
  /** Kit des lieux : seulement si le lieu a signé la charte Miam Safe */
  miamSafe?: boolean;
};

type TextesMaquettes = Traduction<typeof TEXTES_MAQUETTES_KITS>;

const apercu = (chemin: string, description: string) => ({ nom: `apercu-${chemin.replace(/\//g, "-")}`, chemin: `apercus/${chemin.replace(/\//g, "-")}`, description });

export const TEXTES_MAQUETTES_KITS = {
  affiches: {
    "affiche-sauve-une-table": {
      titre: "Affiche « Sauve une table »",
      texte: "La mascotte gourmande sur fond jaune, et l'idée de SOS Miam en une phrase.",
      apercu: "Affiche jaune : la mascotte gourmande, « Sauve une table, régale-toi. » et un QR vers sosmiam.fr.",
    },
    "affiche-pepite-a-2-rues": {
      titre: "Affiche « Ta prochaine pépite »",
      texte: "Pour donner envie de découvrir les lieux du coin qu'on ne connaît pas encore.",
      apercu: "Affiche jaune : la mascotte qui fait un clin d'œil, « Ta prochaine pépite est à 2 rues. » et un QR.",
    },
    "affiche-moins-de-chaines": {
      titre: "Affiche « Moins de chaînes »",
      texte: "Pour les indépendants, tenus par des gens passionnés.",
      apercu: "Affiche jaune : la mascotte, « Moins de chaînes, plus de miam. » et un QR.",
    },
    "affiche-salle-vide": {
      titre: "Affiche « Une salle vide »",
      texte: "Le SOS du soir, avec le Capitaine en alerte.",
      apercu: "Affiche jaune : le Capitaine surpris, « Une salle vide, ça te creuse ? » et un QR.",
    },
    "affiche-ambassadeurs-aventure": {
      titre: "Affiche « Deviens ambassadeur »",
      texte: "Pour recruter la Brigade : trois étapes, à ton rythme.",
      apercu: "Affiche noire : la mascotte, « Deviens ambassadeur SOS Miam. », trois étapes et un QR vers ambassadeur.sosmiam.fr.",
    },
    "affiche-ambassadeurs-badges": {
      titre: "Affiche « Les badges »",
      texte: "Les quatre niveaux, de Curieux à Ambassadeur de ville.",
      apercu: "Affiche noire : les quatre badges du programme, « De Curieux à Ambassadeur de ville. » et un QR.",
    },
    "affiche-ambassadeurs-fondateur": {
      titre: "Affiche « Fondateur de ta ville »",
      texte: "Pour trouver les premiers ambassadeurs d'une ville.",
      apercu: "Affiche noire : l'écusson Ambassadeur, « Sois parmi les premiers de ta ville. » et un QR.",
    },
    "affiche-vitrine-on-est-sur-sos-miam": {
      titre: "Affiche de vitrine « On est sur SOS Miam »",
      texte: "Pour ta vitrine ou ta salle : tes clients savent qu'ils te retrouvent sur SOS Miam.",
      apercu: "Affiche jaune : la mascotte, « On est sur SOS Miam ! » et un QR vers sosmiam.fr.",
    },
    "affiche-vitrine-miam-safe": {
      titre: "Affiche de vitrine « Ici, on est Miam Safe »",
      texte: "La phrase à dire au comptoir, et les numéros d'urgence.",
      apercu: "Affiche noire : le bouclier Miam Safe, « Ici, on est Miam Safe », la phrase « Le Capitaine est là ? » et les numéros d'urgence.",
    },
  },
  imprimes: {
    "flyer-a6-grand-public": {
      titre: "Flyer A6 grand public",
      texte: "Recto et verso côte à côte : « Sauve une table », puis comment ça marche.",
      apercu: "Flyer A6 jaune, recto et verso : « Sauve une table, régale-toi. » et les étapes.",
    },
    "flyer-a6-ambassadeurs": {
      titre: "Flyer A6 « Deviens ambassadeur »",
      texte: "Recto et verso côte à côte : rejoindre la Brigade en trois étapes.",
      apercu: "Flyer A6 noir, recto et verso : « Deviens ambassadeur SOS Miam. » et trois étapes.",
    },
    "planche-stickers-a4": {
      titre: "Planche de stickers",
      texte: "Des ronds de 50 mm, avec les traits de coupe : « Sauveur de table », « Miam ! »…",
      apercu: "Planche A4 de stickers ronds : la mascotte, « Sauveur de table », « Miam ! », « J'ai faim de pépites ».",
    },
    "badges-epingle-38mm": {
      titre: "Badges à épingle",
      texte: "Pour un badge de 38 mm (montrés agrandis) : « Sauveur de table », Miam Safe…",
      apercu: "Badges ronds à épingle : la mascotte, « Sauveur de table » et le bouclier Miam Safe.",
    },
  },
  series: {
    "recrutement-carrousel-deviens-fondateur-de-ta-ville": {
      titre: "Carrousel « Deviens fondateur de ta ville »",
      texte: "Ton rôle, ce que tu y gagnes, les places par ville et comment candidater, en cinq images.",
    },
    "recrutement-post-ce-numero-pourrait-etre-le-tien": { titre: "Post « Ce numéro pourrait être le tien »", texte: "La carte de fondateur, pour donner envie de candidater." },
    "recrutement-stories-candidatures-fondateurs": {
      titre: "Stories « Candidatures fondateurs »",
      texte: "Quatre stories, avec de la place en bas pour le sondage ou le lien.",
    },
    "reseaux-carrousel-cest-quoi-sos-miam": { titre: "Carrousel « C'est quoi SOS Miam ? »", texte: "Le concept en six images, pour ceux qui découvrent." },
    "reseaux-carrousel-tu-as-un-lieu": { titre: "Carrousel « Tu as un lieu ? »", texte: "Pour les restos, pâtisseries, bars et sorties : c'est gratuit." },
    "reseaux-carrousel-deviens-ambassadeur": { titre: "Carrousel « Deviens ambassadeur »", texte: "Pour agrandir la Brigade." },
    "reseaux-carrousel-miam-safe": { titre: "Carrousel « Miam Safe »", texte: "Se sentir bien dans un lieu, bientôt dans l'app." },
    "reseaux-carrousel-les-coulisses": { titre: "Carrousel « Les coulisses »", texte: "Comment SOS Miam se construit." },
    "reseaux-carrousel-les-big-sos": { titre: "Carrousel « Les BIG SOS »", texte: "Quand un lieu a vraiment besoin d'un coup de main, avec dignité." },
    "reseaux-carrousel-mythes-et-verites": { titre: "Carrousel « Mythes et vérités »", texte: "Les idées reçues sur SOS Miam, démêlées." },
    "reseaux-carrousel-le-jeu-de-la-pepite": { titre: "Carrousel « Le jeu de la pépite »", texte: "Un petit jeu pour faire parler de ses adresses préférées." },
    "reseaux-stories-compte-a-rebours": { titre: "Stories « Compte à rebours »", texte: "Sept stories pour la semaine d'avant la sortie." },
    "reseaux-stories-sondages": { titre: "Stories « Sondages »", texte: "Deux stories à sondage, pour faire réagir." },
    "reseaux-stories-previens-moi": { titre: "Story « Préviens-moi »", texte: "Pour être prévenu de la sortie de l'app." },
    "reseaux-stories-les-4-categories": { titre: "Stories « Les 4 catégories »", texte: "Restos, pâtisseries, bars et sorties." },
  },
  capitaine: {
    titre: "Capitaine Bouiboui",
    texte: "Le carrousel qui présente la mascotte (sa fiche, ses six humeurs) et sa story.",
    apercus: [
      "« Voici Capitaine Bouiboui », sur fond jaune.",
      "La fiche d'identité du Capitaine : chef de la Brigade, insubmersible.",
      "Story « Capitaine Bouiboui au rapport ! ».",
    ],
    taille: "3 images 1080 × 1350 et une story",
  },
  imageSur: (titre: string, image: number, images: number) => `${titre}, image ${image} sur ${images}`,
  tailleSerie: (images: number, dimensions: string) => `${images} image${images > 1 ? "s" : ""} ${dimensions}`,
  rectoVerso: (dimensions: string) => `recto et verso, ${dimensions}`,
  zips: { affiches: "toutes les affiches et les imprimés", reseaux: "tous les carrousels et stories" },
  groupes: {
    affiches: { titre: "Les affiches", texte: "En A4, A3 et 40 × 60 cm : des PDF prêts pour l'imprimeur, sans marge à ajouter." },
    imprimes: { titre: "Les imprimés", texte: "Flyers, stickers et badges, à faire imprimer tels quels." },
    reseaux: { titre: "Les carrousels et les stories", texte: "Les visuels du compte SOS Miam, série par série. Partage-les en disant que tu es ambassadeur." },
  },
  boutons: {
    telecharger: (fichier: string) => `Télécharger ${fichier}`,
    pdf: (taille: string) => `le PDF ${taille}`,
    serie: "la série (ZIP)",
    png: "le PNG",
    toutTelecharger: (poids: string | null | undefined) => `Tout télécharger (${poids ? `ZIP, ${poids}` : "ZIP"})`,
  },
};

export const TEXTES_MAQUETTES_KITS_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_MAQUETTES_KITS>> = {
  fr: TEXTES_MAQUETTES_KITS,
  en: TEXTES_MAQUETTES_KITS_ANGLAIS,
};

type IdAffiche = keyof typeof TEXTES_MAQUETTES_KITS.affiches;
type IdSerie = keyof typeof TEXTES_MAQUETTES_KITS.series;

/** Une affiche : le PDF en A4, A3 et 40 × 60 cm, et le PNG */
function affiche(T: TextesMaquettes, id: IdAffiche, kits: KitMaquettes[], miamSafe = false): Maquette {
  const { titre, texte, apercu: description } = T.affiches[id];
  return {
    id, groupe: "affiches", titre, texte, kits, miamSafe,
    apercus: [apercu(`affiches/${id}.png`, description)],
    fichiers: [
      { nom: `${id}.pdf`, chemin: `affiches/${id}.pdf`, format: "PDF", taille: "A4" },
      { nom: `${id}-a3.pdf`, chemin: `affiches/${id}-a3.pdf`, format: "PDF", taille: "A3" },
      { nom: `${id}-40x60.pdf`, chemin: `affiches/${id}-40x60.pdf`, format: "PDF", taille: "40 × 60 cm" },
      { nom: `${id}.png`, chemin: `affiches/${id}.png`, format: "PNG", taille: "2382 × 3369 px" },
    ],
  };
}

/**
 * Une série de visuels réseaux (famille « reseaux », ou une campagne comme « recrutement ») : les trois premiers en aperçu,
 * toute la série dans un zip. Un post seul n'a pas de numéro (post-….png) ; les autres images, si (…-1.png).
 */
function serie(T: TextesMaquettes, id: string, images: number, story: boolean, famille = "reseaux"): Maquette {
  const { titre, texte } = T.series[`${famille}-${id}` as IdSerie];
  const fichierImage = (i: number) => (images === 1 && id.startsWith("post-") ? `${famille}/${id}.png` : `${famille}/${id}-${i + 1}.png`);
  return {
    id: `${famille}-${id}`, groupe: "reseaux", titre, texte, kits: ["ambassadeurs"],
    apercus: Array.from({ length: Math.min(images, 3) }, (_, i) => apercu(fichierImage(i), images > 1 ? T.imageSur(titre, i + 1, images) : titre)),
    fichiers: [{ nom: `${famille}-${id}.zip`, chemin: `kits/${famille}-${id}.zip`, format: "ZIP", taille: T.tailleSerie(images, story ? "1080 × 1920" : "1080 × 1350") }],
  };
}

function imprime(T: TextesMaquettes, id: keyof typeof TEXTES_MAQUETTES_KITS.imprimes, kits: KitMaquettes[], fichiers: FichierMaquette[]): Maquette {
  const { titre, texte, apercu: description } = T.imprimes[id];
  return { id, groupe: "imprimes", titre, texte, kits, apercus: [apercu(`imprimes/${id}.png`, description)], fichiers };
}

export function assemblerMaquettesKits(T: TextesMaquettes): Maquette[] {
  return [
    affiche(T, "affiche-sauve-une-table", ["ambassadeurs", "lieux"]),
    affiche(T, "affiche-pepite-a-2-rues", ["ambassadeurs", "lieux"]),
    affiche(T, "affiche-moins-de-chaines", ["ambassadeurs", "lieux"]),
    affiche(T, "affiche-salle-vide", ["ambassadeurs", "lieux"]),
    affiche(T, "affiche-ambassadeurs-aventure", ["ambassadeurs"]),
    affiche(T, "affiche-ambassadeurs-badges", ["ambassadeurs"]),
    affiche(T, "affiche-ambassadeurs-fondateur", ["ambassadeurs"]),
    affiche(T, "affiche-vitrine-on-est-sur-sos-miam", ["lieux", "pro"]),
    affiche(T, "affiche-vitrine-miam-safe", ["lieux"], true),

    imprime(T, "flyer-a6-grand-public", ["ambassadeurs", "pro"], [
      { nom: "flyer-a6-grand-public.png", chemin: "imprimes/flyer-a6-grand-public.png", format: "PNG", taille: T.rectoVerso("2640 × 1779 px") },
    ]),
    imprime(T, "flyer-a6-ambassadeurs", ["ambassadeurs"], [
      { nom: "flyer-a6-ambassadeurs.png", chemin: "imprimes/flyer-a6-ambassadeurs.png", format: "PNG", taille: T.rectoVerso("2640 × 1779 px") },
    ]),
    imprime(T, "planche-stickers-a4", ["ambassadeurs", "lieux"], [
      { nom: "planche-stickers-a4.pdf", chemin: "imprimes/planche-stickers-a4.pdf", format: "PDF", taille: "A4" },
      { nom: "planche-stickers-a4.png", chemin: "imprimes/planche-stickers-a4.png", format: "PNG", taille: "2382 × 3369 px" },
    ]),
    imprime(T, "badges-epingle-38mm", ["ambassadeurs"], [
      { nom: "badges-epingle-38mm.png", chemin: "imprimes/badges-epingle-38mm.png", format: "PNG", taille: "4032 × 936 px" },
    ]),

    serie(T, "carrousel-deviens-fondateur-de-ta-ville", 5, false, "recrutement"),
    serie(T, "post-ce-numero-pourrait-etre-le-tien", 1, false, "recrutement"),
    serie(T, "stories-candidatures-fondateurs", 4, true, "recrutement"),

    serie(T, "carrousel-cest-quoi-sos-miam", 6, false),
    serie(T, "carrousel-tu-as-un-lieu", 6, false),
    serie(T, "carrousel-deviens-ambassadeur", 6, false),
    serie(T, "carrousel-miam-safe", 6, false),
    serie(T, "carrousel-les-coulisses", 6, false),
    serie(T, "carrousel-les-big-sos", 6, false),
    serie(T, "carrousel-mythes-et-verites", 6, false),
    serie(T, "carrousel-le-jeu-de-la-pepite", 6, false),
    serie(T, "stories-compte-a-rebours", 7, true),
    serie(T, "stories-sondages", 2, true),
    serie(T, "stories-previens-moi", 1, true),
    serie(T, "stories-les-4-categories", 4, true),
    {
      id: "capitaine-bouiboui", groupe: "reseaux", titre: T.capitaine.titre, texte: T.capitaine.texte, kits: ["ambassadeurs"],
      apercus: [
        apercu("capitaine/carrousel-capitaine-1-presentation.png", T.capitaine.apercus[0]),
        apercu("capitaine/carrousel-capitaine-2-fiche-identite.png", T.capitaine.apercus[1]),
        apercu("capitaine/story-capitaine-au-rapport.png", T.capitaine.apercus[2]),
      ],
      fichiers: [{ nom: "reseaux-capitaine-bouiboui.zip", chemin: "capitaine/sos-miam-capitaine.zip", format: "ZIP", taille: T.capitaine.taille }],
    },
  ];
}

export function assemblerZipsMaquettes(T: TextesMaquettes): { kit: KitMaquettes; groupe: GroupeMaquettes; fichier: FichierMaquette }[] {
  return [
    { kit: "ambassadeurs", groupe: "affiches", fichier: { nom: "sos-miam-affiches-et-imprimes.zip", chemin: "kits/sos-miam-affiches-et-imprimes.zip", format: "ZIP", taille: T.zips.affiches } },
    { kit: "ambassadeurs", groupe: "reseaux", fichier: { nom: "sos-miam-reseaux.zip", chemin: "reseaux/sos-miam-reseaux.zip", format: "ZIP", taille: T.zips.reseaux } },
  ];
}

export const maquettesKits: Maquette[] = assemblerMaquettesKits(TEXTES_MAQUETTES_KITS);

/** Les zips de tout un groupe, par kit (kit des ambassadeurs seulement) */
export const zipsMaquettes = assemblerZipsMaquettes(TEXTES_MAQUETTES_KITS);

/** Titre et phrase de chaque groupe, dans l'ordre des pages */
export const groupesMaquettes: { groupe: GroupeMaquettes; titre: string; texte: string }[] = (["affiches", "imprimes", "reseaux"] as const).map(
  (groupe) => ({ groupe, ...TEXTES_MAQUETTES_KITS.groupes[groupe] }),
);

/** Les maquettes d'un kit ; pour le kit des lieux, celles de Miam Safe seulement si la charte est signée */
export function listerMaquettesKit(kit: KitMaquettes, miamSafe = true, maquettes: Maquette[] = maquettesKits): Maquette[] {
  return maquettes.filter((m) => m.kits.includes(kit) && (miamSafe || !m.miamSafe));
}

/** Un fichier (ou un aperçu) qu'un kit a le droit de servir, par son nom ; null sinon */
export function trouverFichierMaquette(kit: KitMaquettes, nom: string): FichierMaquette | null {
  for (const m of listerMaquettesKit(kit)) {
    const fichier = m.fichiers.find((f) => f.nom === nom);
    if (fichier) return fichier;
    const vu = m.apercus.find((a) => a.nom === nom);
    if (vu) return { nom: vu.nom, chemin: vu.chemin, format: "PNG", taille: "" };
  }
  return zipsMaquettes.find((z) => z.kit === kit && z.fichier.nom === nom)?.fichier ?? null;
}
