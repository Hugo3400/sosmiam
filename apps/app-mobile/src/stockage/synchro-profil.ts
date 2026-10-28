// L'état de la synchro du profil d'un compte connecté (utiliserSynchroProfil) : les champs changés sur ce téléphone qui
// ne sont pas encore partis au serveur, les derniers pseudo et avatar lus sur le serveur, le pseudo que l'équipe a mis de
// côté, et l'annonce à montrer sur le profil. Rien de sensible : des noms de champs, des pseudos et des avatars publics,
// jamais le nom, la date de naissance ni la ville (ils restent dans le coffre-fort, avec le profil). AsyncStorage suffit,
// une seule clé.
// Effacé avec le profil (déconnexion, suppression) : les marques d'un compte ne suivent jamais le suivant.
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Les champs du profil que la synchro envoie (la date de naissance, jamais : seule l'équipe la corrige). L'avatar vit à
 * part du profil (stockage/avatar-local.ts), mais son emoji ou son Miami part par le même chemin.
 */
export type ChampSynchro = "prenom" | "nom" | "ville" | "envies" | "pseudo" | "avatar";

/** Un champ à envoyer ; `numero` grandit à chaque marque : une marque posée après un départ n'est pas effacée par sa réponse */
export type MarqueAEnvoyer = { champ: ChampSynchro; numero: number };

/** Ce que la carte du profil annonce (AnnonceProfil), une seule à la fois */
export type AnnonceSynchro =
  | { type: "pseudo-neutre"; pseudo: string }
  | { type: "pseudo-du-serveur"; pseudo: string }
  | { type: "prenom-limite"; jusqua: string | null };

export type SynchroProfil = {
  version: 1;
  /** Faux sur un téléphone d'avant la synchro : la première lecture rattrape ce qui n'est jamais parti */
  premiereFaite: boolean;
  aEnvoyer: MarqueAEnvoyer[];
  /** Le pseudo lu sur le serveur à la dernière lecture (null : pas de pseudo ; absent : jamais lu) */
  pseudoServeur?: string | null;
  /**
   * L'avatar lu sur le serveur à la dernière lecture (null : aucun ; absent : jamais lu sur ce téléphone, même par une
   * version d'avant l'avatar : le rattrapage de l'avatar reste à faire)
   */
  avatarServeur?: string | null;
  retraitPhoto?: boolean;
  /** Ton ancien pseudo, retiré par l'équipe : réservé pour personne jusqu'à `jusqua` (ISO) */
  pseudoMisDeCote: { pseudo: string; jusqua: string } | null;
  annonce: AnnonceSynchro | null;
  /** Dernière réponse du serveur (millisecondes du téléphone) ; 0 si jamais */
  luLe: number;
};

const CLE = "sosmiam.synchro-profil";
// Un état gardé par une version d'avant l'avatar n'a aucune marque « avatar » : il se relit tel quel
const CHAMPS: readonly ChampSynchro[] = ["prenom", "nom", "ville", "envies", "pseudo", "avatar"];

export const creerSynchroProfil = (premiereFaite: boolean): SynchroProfil => ({ version: 1, premiereFaite, aEnvoyer: [], pseudoMisDeCote: null, annonce: null, luLe: 0 });

const texte = (v: unknown): v is string => typeof v === "string" && v !== "";

function lireMarque(brut: unknown): MarqueAEnvoyer | null {
  if (typeof brut !== "object" || brut === null) return null;
  const m = brut as Record<string, unknown>;
  if (!CHAMPS.includes(m.champ as ChampSynchro) || typeof m.numero !== "number" || !Number.isFinite(m.numero)) return null;
  return { champ: m.champ as ChampSynchro, numero: m.numero };
}

function lireAnnonce(brut: unknown): AnnonceSynchro | null {
  if (typeof brut !== "object" || brut === null) return null;
  const a = brut as Record<string, unknown>;
  if ((a.type === "pseudo-neutre" || a.type === "pseudo-du-serveur") && texte(a.pseudo)) return { type: a.type, pseudo: a.pseudo };
  if (a.type === "prenom-limite") return { type: "prenom-limite", jusqua: texte(a.jusqua) ? a.jusqua : null };
  return null;
}

function lireMisDeCote(brut: unknown): SynchroProfil["pseudoMisDeCote"] {
  if (typeof brut !== "object" || brut === null) return null;
  const m = brut as Record<string, unknown>;
  // Passé la réservation, le pseudo redevient un pseudo comme les autres
  if (!texte(m.pseudo) || !texte(m.jusqua) || !(Date.parse(m.jusqua) > Date.now())) return null;
  return { pseudo: m.pseudo, jusqua: m.jusqua };
}

/** Lit l'état gardé, relu sans confiance : ce qui ne va pas reprend sa valeur de départ (rien n'échoue jamais) */
export async function lireSynchroProfil(): Promise<SynchroProfil> {
  try {
    const brut = await AsyncStorage.getItem(CLE);
    if (!brut) return creerSynchroProfil(false);
    const lu = JSON.parse(brut) as Record<string, unknown>;
    if (typeof lu !== "object" || lu === null || lu.version !== 1) return creerSynchroProfil(false);
    const marques = Array.isArray(lu.aEnvoyer) ? lu.aEnvoyer.map(lireMarque).filter((m): m is MarqueAEnvoyer => m !== null) : [];
    const etat: SynchroProfil = {
      version: 1,
      premiereFaite: lu.premiereFaite === true,
      // Une seule marque par champ (la plus récente)
      aEnvoyer: marques.filter((m) => !marques.some((autre) => autre.champ === m.champ && autre.numero > m.numero)),
      pseudoMisDeCote: lireMisDeCote(lu.pseudoMisDeCote),
      annonce: lireAnnonce(lu.annonce),
      luLe: typeof lu.luLe === "number" && Number.isFinite(lu.luLe) ? lu.luLe : 0,
    };
    if (lu.pseudoServeur === null || texte(lu.pseudoServeur)) etat.pseudoServeur = lu.pseudoServeur;
    if (lu.avatarServeur === null || texte(lu.avatarServeur)) etat.avatarServeur = lu.avatarServeur;
    if (lu.retraitPhoto === true) etat.retraitPhoto = true;
    return etat;
  } catch {
    return creerSynchroProfil(false);
  }
}

/** Garde l'état ; si le téléphone n'y arrive pas, tant pis : la prochaine lecture du serveur rattrape presque tout */
export async function enregistrerSynchroProfil(etat: SynchroProfil): Promise<void> {
  try {
    await AsyncStorage.setItem(CLE, JSON.stringify(etat));
  } catch {
    // Rien : l'état en mémoire reste juste jusqu'à la fermeture de l'app
  }
}

export async function effacerSynchroProfil(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CLE);
  } catch {
    // Rien : une marque restée là serait de toute façon remplacée au prochain profil installé
  }
}
