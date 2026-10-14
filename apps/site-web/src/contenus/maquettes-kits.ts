// Les maquettes validées par Hugo le 14 octobre 2026 (affiches, imprimés, visuels réseaux), dans les kits médias du site.
// Les fichiers ne sont pas recopiés : ils sont lus dans presse/ à la racine du dépôt (le dossier de l'Espace presse du
// logiciel de gestion, refait par l'export des maquettes), et servis par la route de chaque kit, seulement s'ils sont
// dans cette liste. Les maquettes à personnaliser (vitrine au nom du lieu, chevalet de table, carte de visite) n'y sont pas.

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

const apercu = (chemin: string, description: string) => ({ nom: `apercu-${chemin.replace(/\//g, "-")}`, chemin: `apercus/${chemin.replace(/\//g, "-")}`, description });

/** Une affiche : le PDF en A4, A3 et 40 × 60 cm, et le PNG */
function affiche(id: string, titre: string, texte: string, description: string, kits: KitMaquettes[], miamSafe = false): Maquette {
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

/** Une série de visuels réseaux : les trois premiers en aperçu, toute la série dans un zip */
function serie(id: string, titre: string, texte: string, images: number, story: boolean): Maquette {
  return {
    id, groupe: "reseaux", titre, texte, kits: ["ambassadeurs"],
    apercus: Array.from({ length: Math.min(images, 3) }, (_, i) => apercu(`reseaux/${id}-${i + 1}.png`, `${titre}, image ${i + 1} sur ${images}`)),
    fichiers: [{ nom: `reseaux-${id}.zip`, chemin: `kits/reseaux-${id}.zip`, format: "ZIP", taille: `${images} image${images > 1 ? "s" : ""} ${story ? "1080 × 1920" : "1080 × 1350"}` }],
  };
}

export const maquettesKits: Maquette[] = [
  // Affiches grand public : « Bientôt dans l'app », QR vers sosmiam.fr
  affiche("affiche-sauve-une-table", "Affiche « Sauve une table »", "La mascotte gourmande sur fond jaune, et l'idée de SOS Miam en une phrase.", "Affiche jaune : la mascotte gourmande, « Sauve une table, régale-toi. » et un QR vers sosmiam.fr.", ["ambassadeurs", "lieux"]),
  affiche("affiche-pepite-a-2-rues", "Affiche « Ta prochaine pépite »", "Pour donner envie de découvrir les lieux du coin qu'on ne connaît pas encore.", "Affiche jaune : la mascotte qui fait un clin d'œil, « Ta prochaine pépite est à 2 rues. » et un QR.", ["ambassadeurs", "lieux"]),
  affiche("affiche-moins-de-chaines", "Affiche « Moins de chaînes »", "Pour les indépendants, tenus par des gens passionnés.", "Affiche jaune : la mascotte, « Moins de chaînes, plus de miam. » et un QR.", ["ambassadeurs", "lieux"]),
  affiche("affiche-salle-vide", "Affiche « Une salle vide »", "Le SOS du soir, avec le Capitaine en alerte.", "Affiche jaune : le Capitaine surpris, « Une salle vide, ça te creuse ? » et un QR.", ["ambassadeurs", "lieux"]),
  // Affiches pour recruter des ambassadeurs : QR vers ambassadeur.sosmiam.fr
  affiche("affiche-ambassadeurs-aventure", "Affiche « Deviens ambassadeur »", "Pour recruter la Brigade : trois étapes, à ton rythme.", "Affiche noire : la mascotte, « Deviens ambassadeur SOS Miam. », trois étapes et un QR vers ambassadeur.sosmiam.fr.", ["ambassadeurs"]),
  affiche("affiche-ambassadeurs-badges", "Affiche « Les badges »", "Les quatre niveaux, de Curieux à Ambassadeur de ville.", "Affiche noire : les quatre badges du programme, « De Curieux à Ambassadeur de ville. » et un QR.", ["ambassadeurs"]),
  affiche("affiche-ambassadeurs-fondateur", "Affiche « Fondateur de ta ville »", "Pour trouver les premiers ambassadeurs d'une ville.", "Affiche noire : l'écusson Ambassadeur, « Sois parmi les premiers de ta ville. » et un QR.", ["ambassadeurs"]),
  // Vitrine des lieux
  affiche("affiche-vitrine-on-est-sur-sos-miam", "Affiche de vitrine « On est sur SOS Miam »", "Pour ta vitrine ou ta salle : tes clients savent qu'ils te retrouvent sur SOS Miam.", "Affiche jaune : la mascotte, « On est sur SOS Miam ! » et un QR vers sosmiam.fr.", ["lieux", "pro"]),
  affiche("affiche-vitrine-miam-safe", "Affiche de vitrine « Ici, on est Miam Safe »", "La phrase à dire au comptoir, et les numéros d'urgence.", "Affiche noire : le bouclier Miam Safe, « Ici, on est Miam Safe », la phrase « Le Capitaine est là ? » et les numéros d'urgence.", ["lieux"], true),

  // Imprimés
  {
    id: "flyer-a6-grand-public", groupe: "imprimes", titre: "Flyer A6 grand public", texte: "Recto et verso côte à côte : « Sauve une table », puis comment ça marche.", kits: ["ambassadeurs", "pro"],
    apercus: [apercu("imprimes/flyer-a6-grand-public.png", "Flyer A6 jaune, recto et verso : « Sauve une table, régale-toi. » et les étapes.")],
    fichiers: [{ nom: "flyer-a6-grand-public.png", chemin: "imprimes/flyer-a6-grand-public.png", format: "PNG", taille: "recto et verso, 2640 × 1779 px" }],
  },
  {
    id: "flyer-a6-ambassadeurs", groupe: "imprimes", titre: "Flyer A6 « Deviens ambassadeur »", texte: "Recto et verso côte à côte : rejoindre la Brigade en trois étapes.", kits: ["ambassadeurs"],
    apercus: [apercu("imprimes/flyer-a6-ambassadeurs.png", "Flyer A6 noir, recto et verso : « Deviens ambassadeur SOS Miam. » et trois étapes.")],
    fichiers: [{ nom: "flyer-a6-ambassadeurs.png", chemin: "imprimes/flyer-a6-ambassadeurs.png", format: "PNG", taille: "recto et verso, 2640 × 1779 px" }],
  },
  {
    id: "planche-stickers-a4", groupe: "imprimes", titre: "Planche de stickers", texte: "Des ronds de 50 mm, avec les traits de coupe : « Sauveur de table », « Miam ! »…", kits: ["ambassadeurs", "lieux"],
    apercus: [apercu("imprimes/planche-stickers-a4.png", "Planche A4 de stickers ronds : la mascotte, « Sauveur de table », « Miam ! », « J'ai faim de pépites ».")],
    fichiers: [
      { nom: "planche-stickers-a4.pdf", chemin: "imprimes/planche-stickers-a4.pdf", format: "PDF", taille: "A4" },
      { nom: "planche-stickers-a4.png", chemin: "imprimes/planche-stickers-a4.png", format: "PNG", taille: "2382 × 3369 px" },
    ],
  },
  {
    id: "badges-epingle-38mm", groupe: "imprimes", titre: "Badges à épingle", texte: "Pour un badge de 38 mm (montrés agrandis) : « Sauveur de table », Miam Safe…", kits: ["ambassadeurs"],
    apercus: [apercu("imprimes/badges-epingle-38mm.png", "Badges ronds à épingle : la mascotte, « Sauveur de table » et le bouclier Miam Safe.")],
    fichiers: [{ nom: "badges-epingle-38mm.png", chemin: "imprimes/badges-epingle-38mm.png", format: "PNG", taille: "4032 × 936 px" }],
  },

  // Visuels réseaux (kit des ambassadeurs)
  serie("carrousel-cest-quoi-sos-miam", "Carrousel « C'est quoi SOS Miam ? »", "Le concept en six images, pour ceux qui découvrent.", 6, false),
  serie("carrousel-tu-as-un-lieu", "Carrousel « Tu as un lieu ? »", "Pour les restos, pâtisseries, bars et sorties : c'est gratuit.", 6, false),
  serie("carrousel-deviens-ambassadeur", "Carrousel « Deviens ambassadeur »", "Pour agrandir la Brigade.", 6, false),
  serie("carrousel-miam-safe", "Carrousel « Miam Safe »", "Se sentir bien dans un lieu, bientôt dans l'app.", 6, false),
  serie("carrousel-les-coulisses", "Carrousel « Les coulisses »", "Comment SOS Miam se construit.", 6, false),
  serie("carrousel-les-big-sos", "Carrousel « Les BIG SOS »", "Quand un lieu a vraiment besoin d'un coup de main, avec dignité.", 6, false),
  serie("carrousel-mythes-et-verites", "Carrousel « Mythes et vérités »", "Les idées reçues sur SOS Miam, démêlées.", 6, false),
  serie("carrousel-le-jeu-de-la-pepite", "Carrousel « Le jeu de la pépite »", "Un petit jeu pour faire parler de ses adresses préférées.", 6, false),
  serie("stories-compte-a-rebours", "Stories « Compte à rebours »", "Sept stories pour la semaine d'avant la sortie.", 7, true),
  serie("stories-sondages", "Stories « Sondages »", "Deux stories à sondage, pour faire réagir.", 2, true),
  serie("stories-previens-moi", "Story « Préviens-moi »", "Pour être prévenu de la sortie de l'app.", 1, true),
  serie("stories-les-4-categories", "Stories « Les 4 catégories »", "Restos, pâtisseries, bars et sorties.", 4, true),
  {
    id: "capitaine-bouiboui", groupe: "reseaux", titre: "Capitaine Bouiboui", texte: "Le carrousel qui présente la mascotte (sa fiche, ses six humeurs) et sa story.", kits: ["ambassadeurs"],
    apercus: [
      apercu("capitaine/carrousel-capitaine-1-presentation.png", "« Voici Capitaine Bouiboui », sur fond jaune."),
      apercu("capitaine/carrousel-capitaine-2-fiche-identite.png", "La fiche d'identité du Capitaine : chef de la Brigade, insubmersible."),
      apercu("capitaine/story-capitaine-au-rapport.png", "Story « Capitaine Bouiboui au rapport ! »."),
    ],
    fichiers: [{ nom: "reseaux-capitaine-bouiboui.zip", chemin: "capitaine/sos-miam-capitaine.zip", format: "ZIP", taille: "3 images 1080 × 1350 et une story" }],
  },
];

/** Les zips de tout un groupe, par kit (kit des ambassadeurs seulement) */
export const zipsMaquettes: { kit: KitMaquettes; groupe: GroupeMaquettes; fichier: FichierMaquette }[] = [
  { kit: "ambassadeurs", groupe: "affiches", fichier: { nom: "sos-miam-affiches-et-imprimes.zip", chemin: "kits/sos-miam-affiches-et-imprimes.zip", format: "ZIP", taille: "toutes les affiches et les imprimés" } },
  { kit: "ambassadeurs", groupe: "reseaux", fichier: { nom: "sos-miam-reseaux.zip", chemin: "reseaux/sos-miam-reseaux.zip", format: "ZIP", taille: "tous les carrousels et stories" } },
];

/** Titre et phrase de chaque groupe, dans l'ordre des pages */
export const groupesMaquettes: { groupe: GroupeMaquettes; titre: string; texte: string }[] = [
  { groupe: "affiches", titre: "Les affiches", texte: "En A4, A3 et 40 × 60 cm : des PDF prêts pour l'imprimeur, sans marge à ajouter." },
  { groupe: "imprimes", titre: "Les imprimés", texte: "Flyers, stickers et badges, à faire imprimer tels quels." },
  { groupe: "reseaux", titre: "Les carrousels et les stories", texte: "Les visuels du compte SOS Miam, série par série. Partage-les en disant que tu es ambassadeur." },
];

/** Les maquettes d'un kit ; pour le kit des lieux, celles de Miam Safe seulement si la charte est signée */
export function listerMaquettesKit(kit: KitMaquettes, miamSafe = true): Maquette[] {
  return maquettesKits.filter((m) => m.kits.includes(kit) && (miamSafe || !m.miamSafe));
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
