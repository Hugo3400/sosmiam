// Limitation d'un compte (décision de Hugo du 15 octobre 2026, docs/decisions.md, « Modération des avis et limitation d'un
// compte ») : l'équipe la décide dans le logiciel de gestion, avec un motif des règles de la communauté et le pourquoi
// écrit pour la personne. Elle coupe seulement ce que les AUTRES voient (ce que seule l'équipe lit reste permis) ; la
// personne peut contester une fois, pendant la limitation, et une autre personne de l'équipe réexamine. Effacée 1 an après
// sa fin ou sa levée. Base : limitations-comptes.ts ; mémoire (tests) : limitations-comptes-en-memoire.ts.
// Aucune donnée sur la personne de l'équipe qui décide : le journal du logiciel suffit.
import { MOTIFS_MODERATION, type MotifModeration } from "../../../../packages/commun/src/contenus/motifs-moderation.ts";
import { reculerDeMois } from "../fonctions/dates/reculer-de-mois.ts";

/** Le pourquoi écrit pour la personne, et sa contestation : 10 à 1 000 caractères (espaces autour retirés) */
export const LONGUEUR_MIN_TEXTE_LIMITATION = 10;
export const LONGUEUR_MAX_TEXTE_LIMITATION = 1000;
/** Une limitation finie ou levée est effacée 12 mois après */
export const MOIS_CONSERVATION_LIMITATION = 12;

/** Une ligne de limitations_comptes */
export type LimitationLue = {
  id: number;
  compteId: number;
  /** Un code de MOTIFS_MODERATION */
  motif: string;
  motivation: string;
  debut: Date;
  /** null : jusqu'à nouvel ordre */
  fin: Date | null;
  leveeLe: Date | null;
  contestation: string | null;
  contesteLe: Date | null;
  reexamineLe: Date | null;
  creeLe: Date;
};

/** Ce que rend estLimite pour un compte limité : jusqu'à quand (null : jusqu'à nouvel ordre) et pourquoi */
export type LimitationActive = { jusqua: Date | null; motif: string };

export type NouvelleLimitation = {
  compteId: number;
  motif: string;
  /** Le pourquoi, écrit pour la personne (10 à 1 000 caractères) */
  motivation: string;
  /** Absent : maintenant */
  debut?: Date;
  /** Absent ou null : jusqu'à nouvel ordre ; sinon, après le début */
  fin?: Date | null;
};

export type ResultatLimiter =
  | { ok: true; limitation: LimitationLue }
  | { ok: false; erreur: "champ-invalide"; champ: "motif" | "motivation" | "debut" | "fin" }
  /** compte-inconnu : pas de compte à cet id ; deja-limite : une limitation en cours ou à venir (la lever d'abord) ;
   * indisponible : la table n'existe pas encore (migration pas appliquée) */
  | { ok: false; erreur: "compte-inconnu" | "deja-limite" | "indisponible" };

/** Lever ou réexaminer : la limitation à jour (avec son compteId, pour prévenir la personne), ou pourquoi c'est refusé */
export type ResultatGesteLimitation =
  | { ok: true; limitation: LimitationLue }
  /** introuvable : pas de limitation à cet id ; deja-terminee : déjà levée ou finie (lever) ; sans-contestation et
   * deja-reexaminee (réexaminer) */
  | { ok: false; erreur: "introuvable" | "deja-terminee" | "sans-contestation" | "deja-reexaminee" };

export type ResultatContestationLimitation =
  | { ok: true; limitation: LimitationLue }
  | { ok: false; erreur: "aucune-limitation" | "deja-conteste" };

/** Ce que les routes (comptes, espace pro, partie sociale) et le logiciel de gestion demandent aux limitations */
export type ServicesLimitations = {
  /** Le compte est-il limité à `maintenant` (maintenant par défaut) ? null sinon (et si la table n'existe pas) */
  estLimite: (compteId: number, maintenant?: Date) => Promise<LimitationActive | null>;
  /** La limitation en cours (celle qui finit le plus tard), sinon la prochaine à venir, sinon null */
  lireLimitationDuCompte: (compteId: number, maintenant?: Date) => Promise<LimitationLue | null>;
  /** La contestation de la personne (texte déjà vérifié), une fois, sur sa limitation EN COURS */
  contesterLimitation: (compteId: number, texte: string, maintenant?: Date) => Promise<ResultatContestationLimitation>;
  /** Pour le logiciel de gestion : limite le compte (vérifie motif, motivation et dates) */
  limiterCompte: (nouvelle: NouvelleLimitation, maintenant?: Date) => Promise<ResultatLimiter>;
  /** Pour le logiciel de gestion : lève une limitation en cours ou à venir */
  leverLimitation: (id: number, maintenant: Date) => Promise<ResultatGesteLimitation>;
  /** Pour le logiciel de gestion : note le réexamen d'une contestation ; `lever` : levée en même temps (si elle court encore) */
  reexaminerLimitation: (id: number, maintenant: Date, options?: { lever?: boolean }) => Promise<ResultatGesteLimitation>;
  /** Pour le logiciel de gestion : toutes les limitations d'un compte, les plus récentes d'abord */
  listerLimitationsDuCompte: (compteId: number) => Promise<LimitationLue[]>;
  /** Pour le logiciel de gestion : les contestations pas encore réexaminées, les plus anciennes d'abord */
  listerContestationsAReexaminer: () => Promise<LimitationLue[]>;
  /** Ménage de nuit : efface les limitations finies ou levées depuis plus d'un an ; rend leur nombre */
  effacerLimitationsAnciennes: (maintenant: Date) => Promise<number>;
};

/** Vraie si la limitation court à `maintenant` : commencée, pas levée, sans fin ou avec une fin à venir */
export function estLimitationActive(l: Pick<LimitationLue, "debut" | "fin" | "leveeLe">, maintenant: Date): boolean {
  const t = maintenant.getTime();
  return l.debut.getTime() <= t && l.leveeLe === null && (l.fin === null || l.fin.getTime() > t);
}

/** Vraie si la limitation n'a pas encore commencé (et n'a pas été levée d'avance) */
export function estLimitationAVenir(l: Pick<LimitationLue, "debut" | "leveeLe">, maintenant: Date): boolean {
  return l.leveeLe === null && l.debut.getTime() > maintenant.getTime();
}

/** Fin d'une limitation pour trier : sans fin, la plus lointaine */
const finTriee = (l: Pick<LimitationLue, "fin">) => l.fin?.getTime() ?? Number.POSITIVE_INFINITY;

/** Parmi les limitations d'un compte : celle en cours qui finit le plus tard, sinon la prochaine à venir, sinon null */
export function choisirLimitationEnVigueur<L extends Pick<LimitationLue, "debut" | "fin" | "leveeLe">>(lignes: L[], maintenant: Date): L | null {
  const actives = lignes.filter((l) => estLimitationActive(l, maintenant)).sort((a, b) => finTriee(b) - finTriee(a));
  if (actives[0]) return actives[0];
  return lignes.filter((l) => estLimitationAVenir(l, maintenant)).sort((a, b) => a.debut.getTime() - b.debut.getTime())[0] ?? null;
}

/** Ce que rend estLimite d'une limitation */
export const resumerLimitationActive = (l: Pick<LimitationLue, "fin" | "motif">): LimitationActive => ({ jusqua: l.fin, motif: l.motif });

const estDateValable = (date: unknown): date is Date => date instanceof Date && !Number.isNaN(date.getTime());

/** Vérifie une nouvelle limitation ; rend la ligne à écrire (motivation nettoyée, début posé) ou le champ en faute */
export function validerNouvelleLimitation(
  nouvelle: NouvelleLimitation, maintenant: Date,
): { ok: true; ligne: { compteId: number; motif: MotifModeration; motivation: string; debut: Date; fin: Date | null } } | Extract<ResultatLimiter, { erreur: "champ-invalide" }> {
  const invalide = (champ: "motif" | "motivation" | "debut" | "fin") => ({ ok: false, erreur: "champ-invalide", champ }) as const;
  if (!(MOTIFS_MODERATION as readonly string[]).includes(nouvelle.motif)) return invalide("motif");
  const motivation = typeof nouvelle.motivation === "string" ? nouvelle.motivation.trim() : "";
  if (motivation.length < LONGUEUR_MIN_TEXTE_LIMITATION || motivation.length > LONGUEUR_MAX_TEXTE_LIMITATION) return invalide("motivation");
  const debut = nouvelle.debut ?? maintenant;
  if (!estDateValable(debut)) return invalide("debut");
  const fin = nouvelle.fin ?? null;
  if (fin !== null && (!estDateValable(fin) || fin.getTime() <= debut.getTime())) return invalide("fin");
  return { ok: true, ligne: { compteId: nouvelle.compteId, motif: nouvelle.motif as MotifModeration, motivation, debut, fin } };
}

/** Avant ce moment, une limitation finie ou levée part au ménage (1 an) */
export const calculerLimiteConservation = (maintenant: Date) => reculerDeMois(maintenant, MOIS_CONSERVATION_LIMITATION);

/** Vraie si la limitation est finie ou levée avant `limite` (à effacer) */
export function estLimitationAEffacer(l: Pick<LimitationLue, "fin" | "leveeLe">, limite: Date): boolean {
  return (l.leveeLe !== null && l.leveeLe.getTime() <= limite.getTime()) || (l.fin !== null && l.fin.getTime() <= limite.getTime());
}

/** Vraie si un id ou un compteId a la forme d'un identifiant de la base */
export const estIdentifiant = (id: unknown): id is number => typeof id === "number" && Number.isSafeInteger(id) && id > 0;
