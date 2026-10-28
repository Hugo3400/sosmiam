import { MESSAGES_SERVICE_PAR_LANGUE } from "@sos-miam/commun/contenus/messages-services";
import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { MESSAGES_INFOS_PAR_LANGUE } from "~/contenus/annonces-profil";
import { TEXTES_REGLAGES_INFOS_PAR_LANGUE } from "~/contenus/textes-reglages-infos";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { RefusInfos } from "~/hooks/utiliser-profil";

/**
 * Où dire un refus de Mes infos : sous la case en cause (`champ`), ou dans une alerte (null, et pour la ville, qui n'a pas
 * de place pour une erreur). `bloquant` : le même texte tapé ne pourra pas passer (Enregistrer reste grisé tant qu'il ne
 * change pas) ; « pas de réseau » ne bloque rien, on peut réessayer tel quel.
 */
export type DescriptionRefusInfos = { champ: "prenom" | "pseudo" | "nom" | "ville" | null; texte: string; bloquant: boolean };

/** Le refus de Mes infos (serveur, ou pseudo sans réseau) en une phrase au tutoiement, rangée sous la bonne case */
export function decrireRefusInfos(refus: RefusInfos, langue: Langue, champ?: string): DescriptionRefusInfos {
  const messagesService = choisirTextes(MESSAGES_SERVICE_PAR_LANGUE, langue);
  const messagesInfos = choisirTextes(MESSAGES_INFOS_PAR_LANGUE, langue);
  if (refus === "pseudo-pris") {
    const { titre, texte } = messagesService["pseudo-pris"];
    return { champ: "pseudo", texte: lierPonctuation(choisirTextes(TEXTES_REGLAGES_INFOS_PAR_LANGUE, langue).pseudoPris(titre, texte)), bloquant: true };
  }
  if (refus === "pseudo-mis-de-cote") return { champ: "pseudo", texte: lierPonctuation(messagesInfos.pseudoMisDeCote), bloquant: true };
  if (refus === "pseudo-sans-reseau") return { champ: "pseudo", texte: lierPonctuation(messagesInfos.pseudoSansReseau), bloquant: false };
  if (refus === "champ-invalide") {
    if (champ === "prenom") return { champ: "prenom", texte: lierPonctuation(messagesInfos.prenomInterdit), bloquant: true };
    if (champ === "pseudo") return { champ: "pseudo", texte: lierPonctuation(messagesInfos.pseudoInterdit), bloquant: true };
    if (champ === "nom") return { champ: "nom", texte: lierPonctuation(messagesInfos.nomTropLong), bloquant: true };
    if (champ === "ville") return { champ: "ville", texte: messagesService["champ-invalide"].texte, bloquant: false };
  }
  return { champ: null, texte: messagesService[refus].texte, bloquant: false };
}
