// La mémoire de la synchro du profil (services/synchro-profil.ts) : ses réglages, ce qu'elle garde pendant un lancement, et
// les marques « à envoyer » des champs changés sur le téléphone.
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { ChangementsInfos } from "~/hooks/utiliser-profil";
import { creerSynchroProfil, type AnnonceSynchro, type ChampSynchro, type SynchroProfil } from "~/stockage/synchro-profil";

/** Nouveaux essais sans réseau : 30 s, puis 2 min, puis toutes les 10 min (ou ce que dit Retry-After), app ouverte */
export const ATTENTES_MS = [30_000, 120_000, 600_000];
/** Au retour dans l'app, le profil est relu si la dernière lecture date de plus d'une minute */
export const RELECTURE_MS = 60_000;
/** Un pseudo retiré par l'équipe reste réservé pour personne pendant 30 jours */
export const RESERVATION_MS = 30 * 24 * 3600_000;
/** Pas de réponse, ou le serveur trébuche : on réessaie plus tard, rien n'est perdu */
export const PASSAGERES = new Set<ErreurService>(["hors-ligne", "trop-de-demandes", "chiffrement-indisponible", "service-indisponible", "erreur-serveur"]);
/** Le serveur trébuche autant de fois de suite : plus d'essai tout seul avant le prochain retour dans l'app */
export const ECHECS_SERVEUR_MAX = 3;
/** Garde-fou : jamais plus de demandes d'affilée pour une même synchro */
export const TOURS_MAX = 6;

export type Memoire = {
  /** L'état gardé sur le téléphone est relu (rien ne part avant) */
  pret: boolean;
  etat: SynchroProfil;
  /** Dernier numéro de marque donné */
  numero: number;
  essais: number;
  /** « Trop de demandes » : rien ne part avant cet instant */
  pasAvant: number;
  echecsServeur: number;
  /** Une lecture (GET) est demandée ; un envoi (PATCH) en tient lieu, sa réponse est le profil entier */
  relire: boolean;
  pompePrevue: boolean;
  /** Mes infos attend son tour : la synchro de fond lui cède la place */
  infosEnAttente: number;
  /** La ville inconnue du serveur est déjà repartie une fois pendant ce lancement */
  villeReparee: boolean;
  /** Le serveur vient de refuser l'avatar : la prochaine lecture lui rend la valeur du serveur, sans rattrapage */
  avatarRefuse: boolean;
};

export type VueSynchro = { annonce: AnnonceSynchro | null; pseudoMisDeCote: string | null };

export const memoireVide = (etat: SynchroProfil = creerSynchroProfil(false)): Memoire => ({
  pret: false, etat, numero: 0, essais: 0, pasAvant: 0, echecsServeur: 0, relire: false, pompePrevue: false, infosEnAttente: 0, villeReparee: false,
  avatarRefuse: false,
});

/** Une marque par champ, avec un nouveau numéro (une marque d'avant est remplacée) */
export function marquer(memoire: Memoire, champs: Iterable<ChampSynchro>) {
  for (const champ of new Set(champs)) {
    memoire.numero += 1;
    memoire.etat.aEnvoyer = [...memoire.etat.aEnvoyer.filter((m) => m.champ !== champ), { champ, numero: memoire.numero }];
  }
}

/** Les marques de ces champs posées avant le départ (numéro ≤ `depart`) s'en vont ; celles d'après restent */
export function oublierMarques(memoire: Memoire, champs: Iterable<ChampSynchro>, depart: number) {
  const liste = new Set(champs);
  memoire.etat.aEnvoyer = memoire.etat.aEnvoyer.filter((m) => !(liste.has(m.champ) && m.numero <= depart));
}

export const champsDe = (c: ChangementsInfos): ChampSynchro[] => (["prenom", "pseudo", "nom", "ville"] as const).filter((champ) => c[champ] !== undefined);
export const rienAChanger = (c: ChangementsInfos) => champsDe(c).length === 0;
