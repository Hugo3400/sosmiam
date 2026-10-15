// Les liens de l'en-tête de sosmiam.fr (composants/mise-en-page/EnTete et MenuMobile).
// « site » dit où vit la page : l'en-tête en fait une adresse complète vers les espaces (fonctions/hotes/creer-adresse-lien.ts).
// Pas de lien vers les aperçus (/preview) : c'est le Discord qui y renvoie.
import type { EspaceDuLien } from "~/fonctions/hotes/creer-adresse-lien";

export type LienEnTete = {
  texte: string;
  /** Chemin sur son site (« /faq », « /programme ») ; « /#comment » : une section de l'accueil */
  adresse: string;
  site: EspaceDuLien;
  /** La section de l'accueil visée (« comment ») : le lien est mis en valeur quand elle est à l'écran */
  section?: string;
  /** Une petite phrase sous le lien, dans le menu des petits écrans (une ligne sur un téléphone : 40 signes environ) */
  detail: string;
};

export type GroupeEnTete = { titre: string; liens: LienEnTete[] };

const app: LienEnTete = { texte: "L'app", adresse: "/#comment", site: "principal", section: "comment", detail: "Comment ça marche, en trois gestes" };
const lieux: LienEnTete = { texte: "Les lieux", adresse: "/#adresses", site: "principal", section: "adresses", detail: "Des pépites qui méritent plus de monde" };
const bigSos: LienEnTete = { texte: "BIG SOS", adresse: "/#big-sos", site: "principal", section: "big-sos", detail: "Un coup dur ? La Brigade à la rescousse" };
const faq: LienEnTete = { texte: "FAQ", adresse: "/faq", site: "principal", detail: "Tes questions, même les plus farfelues" };
const ambassadeurs: LienEnTete = { texte: "Ambassadeurs", adresse: "/programme", site: "ambassadeur", detail: "Fais découvrir tes pépites, dès 18 ans" };
const pros: LienEnTete = { texte: "Pros", adresse: "/bienvenue", site: "pro", detail: "Ton lieu sur SOS Miam, et c'est gratuit" };

/** « Mon compte » : à droite de la barre des grands écrans, et dans « Rejoindre » du menu des petits écrans */
export const lienMonCompte: LienEnTete = { texte: "Mon compte", adresse: "/mon-compte", site: "principal", detail: "Un seul compte pour l'app et les espaces" };

/** Le bouton de l'en-tête : la newsletter, en bas de l'accueil (« on te prévient quand l'app arrive près de chez toi ») */
export const lienPreviensMoi = { texte: "Préviens-moi", adresse: "/#inscription" };

/** Le milieu de la barre des grands écrans : cinq liens au plus. La FAQ est dans le menu des petits écrans et au pied de page. */
export const liensBarre: LienEnTete[] = [app, lieux, bigSos, ambassadeurs, pros];

/** Le menu des petits écrans, rangé en deux groupes */
export const groupesMenu: GroupeEnTete[] = [
  { titre: "Découvrir", liens: [app, lieux, bigSos, faq] },
  { titre: "Rejoindre", liens: [ambassadeurs, pros, lienMonCompte] },
];
