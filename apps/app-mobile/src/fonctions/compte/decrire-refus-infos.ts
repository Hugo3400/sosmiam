import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import { MESSAGES_INFOS } from "~/contenus/annonces-profil";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { RefusInfos } from "~/hooks/utiliser-profil";

/**
 * Où dire un refus de Mes infos : sous la case en cause (`champ`), ou dans une alerte (null, et pour la ville, qui n'a pas
 * de place pour une erreur). `bloquant` : le même texte tapé ne pourra pas passer (Enregistrer reste grisé tant qu'il ne
 * change pas) ; « pas de réseau » ne bloque rien, on peut réessayer tel quel.
 */
export type DescriptionRefusInfos = { champ: "prenom" | "pseudo" | "nom" | "ville" | null; texte: string; bloquant: boolean };

/** Le refus de Mes infos (serveur, ou pseudo sans réseau) en une phrase au tutoiement, rangée sous la bonne case */
export function decrireRefusInfos(refus: RefusInfos, champ?: string): DescriptionRefusInfos {
  if (refus === "pseudo-pris") {
    const { titre, texte } = MESSAGES_SERVICE["pseudo-pris"];
    return { champ: "pseudo", texte: lierPonctuation(`${titre} ! ${texte}`), bloquant: true };
  }
  if (refus === "pseudo-mis-de-cote") return { champ: "pseudo", texte: lierPonctuation(MESSAGES_INFOS.pseudoMisDeCote), bloquant: true };
  if (refus === "pseudo-sans-reseau") return { champ: "pseudo", texte: lierPonctuation(MESSAGES_INFOS.pseudoSansReseau), bloquant: false };
  if (refus === "champ-invalide") {
    if (champ === "prenom") return { champ: "prenom", texte: lierPonctuation(MESSAGES_INFOS.prenomInterdit), bloquant: true };
    if (champ === "pseudo") return { champ: "pseudo", texte: lierPonctuation(MESSAGES_INFOS.pseudoInterdit), bloquant: true };
    if (champ === "nom") return { champ: "nom", texte: lierPonctuation(MESSAGES_INFOS.nomTropLong), bloquant: true };
    if (champ === "ville") return { champ: "ville", texte: MESSAGES_SERVICE["champ-invalide"].texte, bloquant: false };
  }
  return { champ: null, texte: MESSAGES_SERVICE[refus].texte, bloquant: false };
}
