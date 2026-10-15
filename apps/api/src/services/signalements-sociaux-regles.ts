// Les signalements des contenus sociaux et les décisions de la modération vues dans l'app (spécification sociale A.7, B.10,
// B.10 bis, D.2), contrat commun des services Prisma (signalements-sociaux.ts, instantanes-signalements.ts,
// decisions-moderation-app.ts) et de leur double en mémoire (signalements-sociaux-en-memoire.ts).
// - Un signalement garde qui l'a fait (pour le prévenir de la décision, et un seul par personne et par contenu), l'auteur du
//   contenu (pour le prévenir dès le masquage et le laisser contester) et un INSTANTANÉ chiffré du contenu, écrit dans la
//   même transaction : la modération lit l'instantané, jamais le contenu vivant.
// - Ce qu'on a signalé (commentaire, message, liste) est caché pour soi, partout, tant que le signalement existe : lu depuis
//   Signalement, jamais par ElementMasque.
// - « choquant » sur un commentaire, un message ou une liste le masque pour tout le monde en attendant la modération,
//   SEULEMENT si celui qui signale a un e-mail vérifié, un compte de 7 jours et si ce texte n'a jamais eu de signalement
//   rejeté (réponse de Hugo du 14/10/2026, I.18 a) ; sinon il passe en tête de file sans rien masquer.
// - On ne dit jamais qui a signalé, ni son explication, à l'auteur.
// La décision elle-même (retenu, rejeté, cloche « contenu-retire » et « signalement-decide ») est écrite par le logiciel de
// gestion (session Logiciel, services/gestion/moderation.ts) ; la contestation venue de l'app passe par contesterSignalement.
// Un avis ou la réponse d'un lieu à un avis masqué par l'équipe à la relecture (décision du 15/10/2026) a aussi sa ligne
// Signalement (cible « avis » ou « reponse-avis », cibleId : l'id de l'avis, statut « retenu », sans signaleParId), écrite par
// le logiciel : elle entre dans les décisions de son auteur (auteurContenuId) et se conteste pareil.
import type { CibleDecisionModeration, DecisionModerationApi, SignalementSocialValide } from "../../../../packages/commun/src/types/signalement.ts";
import type { ContenuSignale } from "../fonctions/social/construire-instantane.ts";
import { presenterDecisionModeration, type LigneDecisionModeration } from "../fonctions/social/presenter-decision-moderation.ts";
import { CIBLES_SIGNALEMENT_SOCIAL, DUREE_CONTESTATION_JOURS } from "../../../../packages/commun/src/regles/signalement.ts";
import type { EffetSocial } from "./effets-sociaux-regles.ts";

/** Ce qui se cache pour soi une fois signalé */
export type CibleCacheeSiSignalee = "commentaire" | "message" | "liste";
export const CIBLES_CACHEES_SI_SIGNALEES: readonly CibleCacheeSiSignalee[] = ["commentaire", "message", "liste"];

export interface ServicesSignalementsSociaux {
  /**
   * Il faut VOIR le contenu (message : membre, après ton arrivée, auteur sans blocage ; liste visible ; commentaire visible ;
   * profil sans blocage ; sortie dont tu es participant ou invité ; groupe dont tu es membre), et ne pas en être l'auteur ;
   * sinon contenu-inconnu. Un signalement par personne et par contenu (sous le verrou de son compte) : deja. Trouve
   * auteurContenuId ; écrit l'instantané et fichierMedia dans la même transaction ; jamais d'ElementMasque.
   */
  signaler(compteId: number, s: SignalementSocialValide, maintenant: Date): Promise<
    { ok: true; deja: boolean; masquePourTous: boolean; effets: EffetSocial[] } | { ok: false; erreur: "contenu-inconnu" }>;
  /** Les cibleId que j'ai signalés (commentaire, message ou liste), 500 au plus, les plus récents d'abord : cachés pour moi */
  listerMiens(compteId: number, cible: CibleCacheeSiSignalee): Promise<string[]>;
  /** Pour les lectures des autres domaines (messages, listes) : lesquels de ces cibleIds j'ai signalés */
  lireSignalesPar(compteId: number, cible: CibleCacheeSiSignalee, cibleIds: readonly string[]): Promise<Set<string>>;
}

export type RefusContestation = "decision-inconnue" | "deja-contestee" | "contestation-hors-delai";

export interface ServicesDecisionsModeration {
  /**
   * 50 au plus, les plus récentes d'abord : les décisions sur TES contenus (une ligne par contenu et par décision ; « masque »
   * tant qu'il est masqué en attendant la modération ; tes avis et tes réponses d'un lieu masqués par l'équipe compris) et
   * sur TES signalements jugés (contenus sociaux seulement). Jamais qui a signalé
   */
  listerDecisions(compteId: number, maintenant: Date): Promise<DecisionModerationApi[]>;
  /**
   * L'auteur conteste la dernière décision « retenu » sur son contenu, celui qui a signalé un rejet de SON signalement ; une
   * fois par décision, dans les 6 mois. Appelle contesterSignalement (session Logiciel) : le logiciel réexamine
   */
  contester(compteId: number, signalementId: number, texte: string, maintenant: Date): Promise<{ ok: true } | { ok: false; erreur: RefusContestation }>;
}

/** Ce que la lecture d'un contenu signalable rend : de quoi écrire le signalement et son instantané */
export type ContenuLu = {
  contenu: ContenuSignale;
  /** Qui l'a écrit (réponse du lieu : son gérant ; liste : son auteur ; profil : son compte ; sortie : l'organisateur ; groupe : son créateur) */
  auteurContenuId: number | null;
  /** Commentaire : le lieu de la publication ; sinon null */
  lieuId: number | null;
  /** Photo ou note vocale encore là : son fichier chiffré, gardé tant que le signalement est ouvert, ou jugé (ou réexaminé)
   *  depuis moins de 183 jours (signalementsGardantLeurFichier, services/effacer-conversations.ts) */
  fichierMedia: string | null;
};

/** Ce qu'on écrit dans Signalement (B.10) ; l'instantané s'y ajoute avec l'id, dans la même transaction */
export type NouveauSignalementSocial = Pick<SignalementSocialValide, "cible" | "cibleId" | "raison" | "precision" | "explication"> & {
  signaleParId: number | null;
  auteurContenuId: number | null;
  lieuId: number | null;
  source: "app" | "lieu";
  fichierMedia: string | null;
};

/** Ce qui est caché pour soi par GET /app/signalements/miens */
export const MAX_SIGNALES_LUS = 500;
/** Décisions rendues par GET /app/moderation/mes-decisions */
export const MAX_DECISIONS = 50;
/** Lignes lues pour les construire (les plus récentes) */
export const MAX_LIGNES_DECISIONS = 500;

/** « contenu-masque » pour l'auteur, dès le masquage (sans acteur : jamais qui a signalé ; cible : le signalement) */
export function ecrireEffetMasque(auteurContenuId: number | null, signalementId: number, detail: "choquant" | "masque-par-le-lieu"): EffetSocial[] {
  if (auteurContenuId === null) return [];
  return [{ quoi: "cloche", notification: { compteId: auteurContenuId, type: "contenu-masque", acteurId: null, cible: { type: "signalement", id: String(signalementId) }, detail } }];
}

/** Un signalement tel que les décisions le lisent */
export type LigneSignalementDecision = LigneDecisionModeration & {
  cibleId: string;
  signaleParId: number | null;
  auteurContenuId: number | null;
  creeLe: Date;
};

const estJuge = (s: { statut: string }) => s.statut === "retenu" || s.statut === "rejete";
/** Ce qu'on signale par l'app : un avis ou une réponse d'un lieu n'a jamais de « signalement » à toi, seulement un auteur */
const estSignalableParLApp = (cible: CibleDecisionModeration) => (CIBLES_SIGNALEMENT_SOCIAL as readonly string[]).includes(cible);
/** La dernière décision d'un contenu : la plus récente (à égalité, le plus ancien signalement, celui de la décision groupée) */
function lireDerniereDecision<T extends LigneSignalementDecision>(lignes: readonly T[]): T | null {
  let dernier: T | null = null;
  for (const s of lignes) {
    if (!estJuge(s) || !s.traiteLe) continue;
    if (!dernier || s.traiteLe > dernier.traiteLe! || (s.traiteLe.getTime() === dernier.traiteLe!.getTime() && s.id < dernier.id)) dernier = s;
  }
  return dernier;
}

/**
 * Les décisions d'un compte (B.10 bis), à partir des signalements qui le concernent :
 * - auteur : une ligne par contenu ; « masque » s'il est masqué maintenant et qu'un signalement attend (le plus ancien) ;
 *   sinon la dernière décision ;
 * - qui a signalé : chacun de ses signalements jugés (contenus sociaux seulement).
 * `estMasque(cible, cibleId)` : l'état du contenu vivant (suspendu, ou masqué par le lieu). Un avis ou une réponse d'un lieu
 * n'attend jamais : l'équipe le masque en décidant (« retenu » d'emblée), on montre donc la décision.
 */
export function choisirDecisions(lignes: readonly LigneSignalementDecision[], compteId: number, estMasque: (cible: CibleDecisionModeration, cibleId: string) => boolean): DecisionModerationApi[] {
  const parContenu = new Map<string, LigneSignalementDecision[]>();
  for (const s of lignes) {
    if (s.auteurContenuId !== compteId) continue;
    const cle = `${s.cible}:${s.cibleId}`;
    parContenu.set(cle, [...(parContenu.get(cle) ?? []), s]);
  }
  const choisies: { decision: DecisionModerationApi; date: number }[] = [];
  for (const groupe of parContenu.values()) {
    const { cible, cibleId } = groupe[0]!;
    const enAttente = groupe.filter((s) => s.statut === "a-traiter").sort((a, b) => a.id - b.id);
    const dernier = lireDerniereDecision(groupe);
    if (enAttente.length > 0 && estMasque(cible, cibleId)) choisies.push({ decision: presenterDecisionModeration(enAttente[0]!, "auteur"), date: enAttente[0]!.creeLe.getTime() });
    else if (dernier) choisies.push({ decision: presenterDecisionModeration(dernier, "auteur"), date: dernier.traiteLe!.getTime() });
  }
  for (const s of lignes) {
    if (s.signaleParId === compteId && s.auteurContenuId !== compteId && estSignalableParLApp(s.cible) && estJuge(s) && s.traiteLe) {
      choisies.push({ decision: presenterDecisionModeration(s, "signale"), date: s.traiteLe.getTime() });
    }
  }
  return choisies.sort((a, b) => b.date - a.date).slice(0, MAX_DECISIONS).map((c) => c.decision);
}

const JOUR_MS = 24 * 60 * 60 * 1000;

/**
 * Qui peut contester quoi (B.10 bis) : `ligne` est le signalement demandé, `duContenu` tous les signalements du même contenu.
 * - L'auteur du contenu : la dernière décision sur ce contenu, si elle est « retenu » ; une seule contestation à la fois, et
 *   une seule par décision (une décision réexaminée ne se conteste plus).
 * - Celui qui a signalé : SON signalement d'un contenu social, s'il a été rejeté ; une fois.
 * Un avis ou une réponse d'un lieu masqué par l'équipe se conteste par son auteur, comme un contenu social retiré.
 * - Dans les 6 mois après la décision (contestation-hors-delai) ; sinon decision-inconnue (pas la tienne, pas encore jugée).
 * Rend l'id du signalement à contester.
 */
export function verifierContestation(
  ligne: LigneSignalementDecision | null, duContenu: readonly LigneSignalementDecision[], compteId: number, maintenant: Date,
): { ok: true; id: number } | { ok: false; erreur: RefusContestation } {
  if (!ligne) return { ok: false, erreur: "decision-inconnue" };
  let visee: LigneSignalementDecision;
  if (ligne.auteurContenuId === compteId) {
    const dernier = lireDerniereDecision(duContenu.filter((s) => s.auteurContenuId === compteId));
    if (!dernier || dernier.statut !== "retenu") return { ok: false, erreur: "decision-inconnue" };
    if (dernier.contesteLe !== null || duContenu.some((s) => s.contesteLe !== null && s.reexamineLe === null)) return { ok: false, erreur: "deja-contestee" };
    visee = dernier;
  } else if (ligne.signaleParId === compteId && estSignalableParLApp(ligne.cible)) {
    if (ligne.statut !== "rejete" || !ligne.traiteLe) return { ok: false, erreur: "decision-inconnue" };
    if (ligne.contesteLe !== null) return { ok: false, erreur: "deja-contestee" };
    visee = ligne;
  } else {
    return { ok: false, erreur: "decision-inconnue" };
  }
  if (maintenant.getTime() > visee.traiteLe!.getTime() + DUREE_CONTESTATION_JOURS * JOUR_MS) return { ok: false, erreur: "contestation-hors-delai" };
  return { ok: true, id: visee.id };
}
