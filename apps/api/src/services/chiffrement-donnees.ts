// Chiffrement des données sensibles des comptes de l'app (nom, date de naissance), décidé le 8 octobre 2026 : AES-256-GCM,
// clé de 32 octets HORS de la base. La clé est lue UNE fois au démarrage, depuis le fichier donné par SOS_MIAM_CLE_DONNEES
// (par défaut /root/sos-miam-secrets/cle-donnees-comptes : le base64 de 32 octets, lisible par root seul). Sans clé,
// l'API démarre quand même : les adresses qui en ont besoin répondent 503 « chiffrement-indisponible ». La clé n'est
// jamais écrite dans un journal, ni rendue par une adresse.
//
// Changement de clé (docs/procedure-changement-cle.md) : chaque chiffré porte la version de sa clé (« v2:… » ; les
// anciens « v1:… » sont ceux de la toute première clé). SOS_MIAM_CLE_DONNEES_VERSION donne la version de la clé courante
// (1 par défaut) ; pendant un changement, SOS_MIAM_CLE_DONNEES_ANCIENNE donne le fichier de l'ancienne clé (même forme,
// version = la courante moins 1). Lire essaie la clé de la version écrite, puis les autres ; écrire prend toujours la
// courante ; la tâche de nuit rechiffre les comptes (services/rechiffrement-comptes.ts).
import { chiffrerDonnee } from "../fonctions/securite/chiffrer-donnee.ts";
import { dechiffrerDonnee } from "../fonctions/securite/dechiffrer-donnee.ts";
import { deriverSousCle } from "../fonctions/securite/deriver-sous-cle.ts";
import { lireFichierCle } from "../fonctions/securite/lire-fichier-cle.ts";
import { lireVersionChiffre } from "../fonctions/securite/lire-version-chiffre.ts";

export const FICHIER_CLE_DONNEES_DEFAUT = "/root/sos-miam-secrets/cle-donnees-comptes";

/** Champs chiffrés : le nom du champ est authentifié avec la donnée (une valeur recopiée ailleurs ne se lit plus) */
export type ChampChiffre = "nom" | "dateNaissance";

/** Une clé et sa version (1 : la toute première) */
export type CleVersionnee = { version: number; cle: Uint8Array };

export type ChiffrementDonnees = {
  /** Toujours avec la clé courante : « v<versionCle>:iv:tag:donnees » */
  chiffrer: (texte: string, champ: ChampChiffre) => string;
  /** La clé de la version écrite d'abord, puis les autres (courante, anciennes) ; erreur si aucune ne convient */
  dechiffrer: (chiffre: string, champ: ChampChiffre) => string;
  /** Sous-clé de 32 octets propre à un usage (HKDF-SHA256, ce contexte) : la clé maître elle-même ne sort jamais d'ici */
  deriverCle: (contexte: string) => Buffer;
  /** Version de la clé courante (1 tant que la clé n'a jamais changé) */
  versionCle: number;
  /** Versions des anciennes clés encore acceptées, de la plus récente à la plus ancienne ; vide hors changement de clé */
  versionsAnciennes: number[];
  /** Sous-clés des anciennes clés pour ce contexte (même ordre que versionsAnciennes) ; vide hors changement de clé */
  deriverClesAnciennes: (contexte: string) => Buffer[];
  /** Sous-clé d'une version donnée (courante ou ancienne) pour ce contexte ; null si cette version n'est plus là */
  deriverCleVersion: (contexte: string, version: number) => Buffer | null;
  /** Vrai si ce chiffré n'a pas été écrit avec la clé courante (à rechiffrer) */
  estAncien: (chiffre: string) => boolean;
};

/** Le chiffrement avec cette clé (32 octets) ; les tests passent une clé de test. `anciennes` : pendant un changement de clé. */
export function creerChiffrementDonnees(cle: Uint8Array, options: { version?: number; anciennes?: CleVersionnee[] } = {}): ChiffrementDonnees {
  if (cle.length !== 32) throw new Error("La clé de chiffrement doit faire 32 octets");
  const versionCle = options.version ?? 1;
  if (!Number.isInteger(versionCle) || versionCle < 1 || versionCle > 999) throw new Error("Version de clé invalide (1 à 999)");
  const anciennes = (options.anciennes ?? []).map(({ version, cle: autre }) => {
    if (autre.length !== 32) throw new Error("Une ancienne clé doit faire 32 octets");
    if (!Number.isInteger(version) || version < 1 || version >= versionCle) throw new Error("Une ancienne clé a une version plus petite que la courante");
    return { version, cle: Buffer.from(autre) };
  }).sort((a, b) => b.version - a.version);
  const courante = { version: versionCle, cle: Buffer.from(cle) };
  const toutes = [courante, ...anciennes];
  return {
    chiffrer: (texte, champ) => chiffrerDonnee(texte, courante.cle, champ, versionCle),
    dechiffrer: (chiffre, champ) => {
      const version = lireVersionChiffre(chiffre);
      const ordre = [...toutes.filter((c) => c.version === version), ...toutes.filter((c) => c.version !== version)];
      let derniere: unknown;
      for (const essai of ordre) {
        try {
          return dechiffrerDonnee(chiffre, essai.cle, champ);
        } catch (erreur) {
          derniere = erreur;
        }
      }
      throw derniere instanceof Error ? derniere : new Error("Donnée chiffrée illisible");
    },
    deriverCle: (contexte) => deriverSousCle(courante.cle, contexte),
    versionCle,
    versionsAnciennes: anciennes.map((a) => a.version),
    deriverClesAnciennes: (contexte) => anciennes.map((a) => deriverSousCle(a.cle, contexte)),
    deriverCleVersion: (contexte, version) => {
      const trouvee = toutes.find((c) => c.version === version);
      return trouvee ? deriverSousCle(trouvee.cle, contexte) : null;
    },
    estAncien: (chiffre) => lireVersionChiffre(chiffre) !== versionCle,
  };
}

export type OptionsChargement = {
  /** Fichier de l'ancienne clé ; par défaut SOS_MIAM_CLE_DONNEES_ANCIENNE (absent ou vide : pas d'ancienne clé) */
  cheminAncienne?: string | null;
  /** Version de la clé courante, telle qu'écrite dans l'environnement ; par défaut SOS_MIAM_CLE_DONNEES_VERSION (vide : 1) */
  version?: string;
};

/**
 * Lit la clé (et l'éventuelle ancienne) au démarrage. Rend null (avec un message clair au journal, sans rien des clés) si
 * le fichier de la clé manque, est lisible par d'autres comptes que son propriétaire, ou ne contient pas le base64 de 32
 * octets ; de même pour l'ancienne clé quand son fichier existe mais est mal protégé ou mal écrit, ou quand la version
 * courante ne laisse pas de place à une ancienne. Fichier de l'ancienne clé introuvable : un avertissement, pas d'ancienne clé.
 */
export function chargerChiffrementDonnees(
  chemin = process.env.SOS_MIAM_CLE_DONNEES || FICHIER_CLE_DONNEES_DEFAUT,
  options: OptionsChargement = {},
): ChiffrementDonnees | null {
  const indisponible = (raison: string, fichier = chemin) => {
    console.error(`Chiffrement des données des comptes INDISPONIBLE (${raison}) : ${fichier}. Inscription de l'app et profil répondent 503 « chiffrement-indisponible ».`);
    return null;
  };
  const lecture = lireFichierCle(chemin);
  if (!lecture.ok) return indisponible(lecture.raison);

  const texteVersion = (options.version ?? process.env.SOS_MIAM_CLE_DONNEES_VERSION ?? "").trim();
  const version = texteVersion === "" ? 1 : /^[1-9]\d{0,2}$/.test(texteVersion) ? Number(texteVersion) : null;
  if (version === null) return indisponible("SOS_MIAM_CLE_DONNEES_VERSION doit être un nombre entier de 1 à 999");

  const cheminAncienne = (options.cheminAncienne === undefined ? process.env.SOS_MIAM_CLE_DONNEES_ANCIENNE : options.cheminAncienne)?.trim() || null;
  const anciennes: CleVersionnee[] = [];
  if (cheminAncienne) {
    const ancienne = lireFichierCle(cheminAncienne);
    if (!ancienne.ok && ancienne.absent) {
      console.warn(`Ancienne clé des données introuvable (${cheminAncienne}) : pas d'ancienne clé. Retire SOS_MIAM_CLE_DONNEES_ANCIENNE si le changement de clé est fini.`);
    } else if (!ancienne.ok) {
      return indisponible(`ancienne clé : ${ancienne.raison}`, cheminAncienne);
    } else if (ancienne.cle.equals(lecture.cle)) {
      console.error(`Ancienne clé des données IDENTIQUE à la clé courante (${cheminAncienne}) : ignorée. La nouvelle clé n'a pas été posée ?`);
    } else if (version < 2) {
      return indisponible("une ancienne clé est réglée : SOS_MIAM_CLE_DONNEES_VERSION doit valoir au moins 2 (la version de la nouvelle clé)", cheminAncienne);
    } else {
      anciennes.push({ version: version - 1, cle: ancienne.cle });
    }
  }
  return creerChiffrementDonnees(lecture.cle, { version, anciennes });
}
