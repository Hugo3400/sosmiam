// Photos et notes vocales du chat, rangées CHIFFRÉES (services/chiffrement-social.ts) sur le disque, dans un dossier à part
// (DOSSIER_MEDIAS_CHAT, 0700 ; fichiers 0600), jamais dans /var/www/medias que Cloudflare met en cache publiquement : elles
// ne sortent que par GET /app/conversations/:id/messages/:messageId/media (spécification sociale A.0, D.1). Le nom d'un
// fichier est TIRÉ AU HASARD par l'API (« <uuid v4>.bin ») ; tout autre nom est refusé ou ignoré : jamais un chemin, ni un
// nom venu de l'app, et on ne sert que les noms écrits en base. Le disque est celui de PostgreSQL : quotas de B.12
// (verifierQuotasMediasChat, nombres de packages/commun/src/regles/chat.ts) et part libre relue avant chaque écriture.
import { randomUUID } from "node:crypto";
import { chmod, mkdir, readdir, readFile, stat, statfs, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

import {
  MAX_MEDIAS_PAR_JOUR,
  PART_LIBRE_MIN_DISQUE,
  PLAFOND_MEDIAS_SERVEUR_JOUR_OCTETS,
  QUOTA_MEDIAS_COMPTE_OCTETS,
} from "../../../../packages/commun/src/regles/chat.ts";

export const DOSSIER_MEDIAS_CHAT = process.env.DOSSIER_MEDIAS_CHAT || "/var/lib/sos-miam/medias-chat";
/** Le seul nom de fichier qu'on écrit, lit ou supprime : « <uuid v4 en minuscules>.bin » */
export const FORME_FICHIER_MEDIA_CHAT = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.bin$/;
/** 503 « stockage-plein » : en-tête Retry-After (B.12) */
export const ATTENTE_STOCKAGE_PLEIN_SECONDES = 3600;
/** Le signal « disque presque plein » part une fois par heure au plus */
const INTERVALLE_ALERTE_DISQUE_MS = 3_600_000;

export type FichierMediaChat = { fichier: string; modifieLe: Date };

export type StockageMediasChat = {
  /** Un nom neuf, tiré au hasard : le seul genre de nom qu'on écrit (le contexte du chiffré, « fichier:<nom> », en dépend) */
  tirerNom: () => string;
  /** Écrit un fichier déjà chiffré, en 0600 ; erreur si le nom n'a pas la forme ou si ce fichier existe déjà */
  ecrire: (fichier: string, octets: Uint8Array) => Promise<void>;
  /** null : nom sans la forme, ou fichier absent (effacé par le ménage) */
  lire: (fichier: string) => Promise<Buffer | null>;
  /** Supprime ces fichiers (absents ou mal nommés : ignorés) ; rend le nombre de fichiers vraiment supprimés */
  supprimer: (fichiers: readonly string[]) => Promise<number>;
  /** Part libre du disque (0 à 1), par fs.statfs ; 0 si elle ne se lit pas (on n'écrit pas à l'aveugle) */
  lirePartLibre: () => Promise<number>;
  /** Ménage des fichiers orphelins : les noms du dossier dans l'ordre, après `apres`, `nombre` au plus, avec leur date */
  lister: (apres: string | null, nombre: number) => Promise<FichierMediaChat[]>;
};

export type CompteursMediasChat = {
  /** Médias envoyés par ce compte depuis 24 h (lus sous le verrou du compte : SELECT … FROM comptes … FOR UPDATE) */
  envoisCompte24h: number;
  /** Octets des photos et vocaux de ce compte dont le fichier existe encore (somme des `taille`) */
  octetsCompte: number;
  /** Octets reçus de tous les comptes ensemble depuis 24 h */
  octetsServeur24h: number;
  /** lirePartLibre() */
  partLibre: number;
};

/**
 * Quotas durables d'un nouveau média de `taille` octets (B.12). « stockage-plein » (503, Retry-After
 * ATTENTE_STOCKAGE_PLEIN_SECONDES) : moins de 15 % de disque libre, ou plus de 20 Go reçus de tous les comptes en 24 h ;
 * « trop-de-medias » (409) : 50 médias en 24 h, ou 1 Go gardé pour ce compte.
 */
export function verifierQuotasMediasChat(taille: number, c: CompteursMediasChat): "ok" | "trop-de-medias" | "stockage-plein" {
  if (!(c.partLibre >= PART_LIBRE_MIN_DISQUE) || c.octetsServeur24h + taille > PLAFOND_MEDIAS_SERVEUR_JOUR_OCTETS) return "stockage-plein";
  if (c.envoisCompte24h >= MAX_MEDIAS_PAR_JOUR || c.octetsCompte + taille > QUOTA_MEDIAS_COMPTE_OCTETS) return "trop-de-medias";
  return "ok";
}

const tirerNom = () => `${randomUUID()}.bin`;
const estNomValide = (fichier: unknown): fichier is string => typeof fichier === "string" && FORME_FICHIER_MEDIA_CHAT.test(fichier);
const exigerNom = (fichier: string) => {
  if (!estNomValide(fichier)) throw new Error("Nom de fichier de média refusé (seuls les noms tirés par l'API passent)");
  return fichier;
};
const codeErreur = (erreur: unknown) => (erreur as NodeJS.ErrnoException | null)?.code;

export type OptionsStockageMediasChat = {
  /** Appelé quand la part libre passe sous PART_LIBRE_MIN_DISQUE, une fois par heure au plus (ligne du journal du logiciel) */
  quandDisquePresquePlein?: (partLibre: number) => void;
  horloge?: () => number;
};

/** Le vrai stockage, dans `dossier` (créé en 0700 au premier besoin) */
export function creerStockageMediasChat(dossier = DOSSIER_MEDIAS_CHAT, o: OptionsStockageMediasChat = {}): StockageMediasChat {
  const horloge = o.horloge ?? Date.now;
  let preparation: Promise<void> | null = null;
  const preparer = () => {
    preparation ??= (async () => {
      await mkdir(dossier, { recursive: true, mode: 0o700 });
      await chmod(dossier, 0o700);
    })().catch((erreur: unknown) => {
      preparation = null;
      throw erreur;
    });
    return preparation;
  };
  let derniereAlerte = Number.NEGATIVE_INFINITY;
  const chemin = (fichier: string) => join(dossier, exigerNom(fichier));

  return {
    tirerNom,
    ecrire: async (fichier, octets) => {
      const cible = chemin(fichier);
      await preparer();
      try {
        await writeFile(cible, octets, { mode: 0o600, flag: "wx" });
      } catch (erreur) {
        // « wx » : un fichier qui existait n'est jamais écrasé ; un fichier commencé puis interrompu (disque plein) part
        if (codeErreur(erreur) !== "EEXIST") await unlink(cible).catch(() => undefined);
        throw erreur;
      }
    },
    lire: async (fichier) => {
      if (!estNomValide(fichier)) return null;
      try {
        return await readFile(join(dossier, fichier));
      } catch (erreur) {
        if (codeErreur(erreur) === "ENOENT") return null;
        throw erreur;
      }
    },
    supprimer: async (fichiers) => {
      let supprimes = 0;
      const valides = [...new Set(fichiers.filter(estNomValide))];
      for (let debut = 0; debut < valides.length; debut += 50) {
        const resultats = await Promise.all(valides.slice(debut, debut + 50).map((fichier) => unlink(join(dossier, fichier)).then(
          () => true,
          (erreur: unknown) => {
            if (codeErreur(erreur) === "ENOENT") return false;
            throw erreur;
          },
        )));
        supprimes += resultats.filter(Boolean).length;
      }
      return supprimes;
    },
    lirePartLibre: async () => {
      let part = 0;
      try {
        await preparer();
        const disque = await statfs(dossier);
        part = disque.blocks > 0 ? Math.min(1, Math.max(0, disque.bavail / disque.blocks)) : 0;
      } catch {
        part = 0;
      }
      if (part < PART_LIBRE_MIN_DISQUE && o.quandDisquePresquePlein && horloge() - derniereAlerte >= INTERVALLE_ALERTE_DISQUE_MS) {
        derniereAlerte = horloge();
        o.quandDisquePresquePlein(part);
      }
      return part;
    },
    lister: async (apres, nombre) => {
      let noms: string[];
      try {
        noms = await readdir(dossier);
      } catch (erreur) {
        if (codeErreur(erreur) === "ENOENT") return [];
        throw erreur;
      }
      const choisis = noms.filter((nom) => estNomValide(nom) && (apres === null || nom > apres)).sort().slice(0, Math.max(0, Math.floor(nombre)));
      const liste: FichierMediaChat[] = [];
      for (const fichier of choisis) {
        try {
          liste.push({ fichier, modifieLe: (await stat(join(dossier, fichier))).mtime });
        } catch (erreur) {
          if (codeErreur(erreur) !== "ENOENT") throw erreur;
        }
      }
      return liste;
    },
  };
}

export type StockageMediasChatEnMemoire = StockageMediasChat & {
  /** Ce qui a été écrit, pour les tests */
  fichiers: Map<string, { octets: Buffer; modifieLe: Date }>;
  reglerPartLibre: (part: number) => void;
};

/** Le double des tests : mêmes règles de noms, rien sur le disque ; `partLibre` 1 par défaut */
export function creerStockageMediasChatEnMemoire(o: { partLibre?: number; horloge?: () => number } = {}): StockageMediasChatEnMemoire {
  const horloge = o.horloge ?? Date.now;
  const fichiers = new Map<string, { octets: Buffer; modifieLe: Date }>();
  let partLibre = o.partLibre ?? 1;
  return {
    fichiers,
    reglerPartLibre: (part) => void (partLibre = part),
    tirerNom,
    ecrire: async (fichier, octets) => {
      if (fichiers.has(exigerNom(fichier))) throw new Error("Ce fichier de média existe déjà");
      fichiers.set(fichier, { octets: Buffer.from(octets), modifieLe: new Date(horloge()) });
    },
    lire: async (fichier) => {
      const trouve = estNomValide(fichier) ? fichiers.get(fichier) : undefined;
      return trouve ? Buffer.from(trouve.octets) : null;
    },
    supprimer: async (liste) => [...new Set(liste.filter(estNomValide))].filter((fichier) => fichiers.delete(fichier)).length,
    lirePartLibre: async () => partLibre,
    lister: async (apres, nombre) => [...fichiers]
      .filter(([fichier]) => apres === null || fichier > apres)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .slice(0, Math.max(0, Math.floor(nombre)))
      .map(([fichier, { modifieLe }]) => ({ fichier, modifieLe })),
  };
}
