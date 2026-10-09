// Lecteurs des champs du profil de l'app (inscription « app » et PATCH /comptes/moi/profil). Les règles de forme viennent
// de packages/commun (estPseudoValide, nomPublicContientMotInterdit), importées telles quelles, jamais recopiées.
// Un champ qui ne va pas lève ChampInvalide (400 « champ-invalide » avec son nom).
import { estPseudoValide } from "../../../../packages/commun/src/validation/est-pseudo-valide.ts";
import { nomPublicContientMotInterdit } from "../../../../packages/commun/src/validation/nom-public-contient-mot-interdit.ts";
import type { CategorieEnvie } from "../../../../packages/commun/src/types/profil.ts";
import type { ChiffrementDonnees } from "../services/chiffrement-donnees.ts";
import { lireLigneFacultative } from "./comptes-champs.ts";
import { ChampInvalide } from "./gestion/lire-champs.ts";

/**
 * Catégories d'envies gardées sur le serveur : toutes celles de l'app SAUF « regimes » (religion, santé : RGPD article 9,
 * elles restent sur le téléphone sans accord explicite). Envoyer « regimes » est refusé.
 */
export const CATEGORIES_ENVIES_SERVEUR = ["lieux", "cuisines", "boissons", "bars", "musique", "jeux", "moments"] as const satisfies readonly Exclude<CategorieEnvie, "regimes">[];
/** Un choix d'envie : un identifiant court de l'app (« restos », « food-trucks ») */
const FORME_ENVIE = /^[a-z0-9][a-z0-9-]{0,39}$/;
const ENVIES_PAR_CATEGORIE_MAX = 60;
/** Colonnes chiffrées : VARCHAR(200) en base */
const LONGUEUR_CHIFFREE_MAX = 200;
const NOM_MAX = 60;
const AVATAR_MAX = 16;
const segmenteur = new Intl.Segmenter("fr", { granularity: "grapheme" });

/** Envies : { categorie: ["id", …] } sans « regimes », chaque liste sans doublon (60 au plus). */
export function lireEnvies(valeur: unknown): Record<string, string[]> {
  if (typeof valeur !== "object" || valeur === null || Array.isArray(valeur)) throw new ChampInvalide("envies");
  const envies: Record<string, string[]> = {};
  for (const [categorie, liste] of Object.entries(valeur)) {
    if (!(CATEGORIES_ENVIES_SERVEUR as readonly string[]).includes(categorie)) throw new ChampInvalide("envies");
    if (!Array.isArray(liste) || liste.length > ENVIES_PAR_CATEGORIE_MAX) throw new ChampInvalide("envies");
    if (!liste.every((id): id is string => typeof id === "string" && FORME_ENVIE.test(id))) throw new ChampInvalide("envies");
    envies[categorie] = [...new Set(liste)];
  }
  return envies;
}

/** Envies telles que gardées, relues sans confiance (une ancienne valeur bizarre donne {} plutôt qu'une erreur). */
export function relireEnvies(valeur: unknown): Record<string, string[]> {
  try {
    return valeur === null || valeur === undefined ? {} : lireEnvies(valeur);
  } catch {
    return {};
  }
}

/**
 * Pseudo choisi : sans espaces autour, sans « @ » devant, en minuscules ; forme de estPseudoValide et sans gros mot
 * (nomPublicContientMotInterdit), sinon champ invalide.
 */
export function lirePseudo(valeur: unknown): string {
  const pseudo = normaliserPseudo(valeur);
  if (!estPseudoValide(pseudo) || nomPublicContientMotInterdit(pseudo)) throw new ChampInvalide("pseudo");
  return pseudo;
}

/** Pseudo nettoyé (sans « @ », en minuscules), ou "" si ce n'est pas un texte. */
export function normaliserPseudo(valeur: unknown): string {
  return typeof valeur === "string" ? valeur.trim().replace(/^@/, "").toLowerCase() : "";
}

/** Avatar : un seul emoji (une seule « lettre » à l'écran, 16 caractères au plus) ; null ou "" : effacé. */
export function lireAvatar(valeur: unknown): string | null {
  if (valeur === null || valeur === "") return null;
  if (typeof valeur !== "string") throw new ChampInvalide("avatar");
  const avatar = valeur.trim();
  const graphemes = [...segmenteur.segment(avatar)].length;
  if (avatar.length > AVATAR_MAX || graphemes !== 1 || !/\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(avatar)) {
    throw new ChampInvalide("avatar");
  }
  return avatar;
}

/** Nom (facultatif, 60 caractères au plus) CHIFFRÉ ; null : pas de nom. */
export function lireNomChiffre(corps: Record<string, unknown>, chiffrement: ChiffrementDonnees): string | null {
  const nom = lireLigneFacultative(corps, "nom", NOM_MAX);
  if (nom === null) return null;
  const chiffre = chiffrement.chiffrer(nom, "nom");
  // Beaucoup d'emojis ou de caractères rares : la valeur chiffrée ne tiendrait pas dans sa colonne
  if (chiffre.length > LONGUEUR_CHIFFREE_MAX) throw new ChampInvalide("nom");
  return chiffre;
}
