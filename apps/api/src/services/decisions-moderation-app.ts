// Les décisions de la modération vues dans l'app, dans la base (contrat dans signalements-sociaux-regles.ts ; règlement
// européen sur les services numériques, art. 17 et 20). Lecture seule, sauf la contestation, qui passe par
// contesterSignalement de la session Logiciel (services/gestion/moderation.ts) : c'est le logiciel qui réexamine.
import { CIBLES_SIGNALEMENT_SOCIAL } from "../../../../packages/commun/src/regles/signalement.ts";
import type { CibleSignalementSocial } from "../../../../packages/commun/src/types/signalement.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import {
  choisirDecisions, MAX_LIGNES_DECISIONS, verifierContestation, type LigneSignalementDecision, type ServicesDecisionsModeration,
} from "./signalements-sociaux-regles.ts";

const SELECTION = {
  id: true, cible: true, cibleId: true, statut: true, motif: true, motivation: true, traiteLe: true, contesteLe: true, reexamineLe: true,
  signaleParId: true, auteurContenuId: true, creeLe: true,
} as const;
const SOCIALES = { in: [...CIBLES_SIGNALEMENT_SOCIAL] };
const lire = (s: { cible: string } & Omit<LigneSignalementDecision, "cible">): LigneSignalementDecision => ({ ...s, cible: s.cible as CibleSignalementSocial });

export function creerDecisionsModerationApp(
  o: { contesterSignalement: (id: number, texte: string, maintenant: Date) => Promise<boolean> }, base = baseDeDonnees,
): ServicesDecisionsModeration {
  /** Les contenus masqués maintenant (suspendus, ou masqués par le lieu), parmi ceux qui ont un signalement en attente */
  async function lireMasques(lignes: readonly LigneSignalementDecision[]): Promise<Set<string>> {
    const ids = (cible: string) => [...new Set(lignes.filter((s) => s.cible === cible && s.statut === "a-traiter").map((s) => Number(s.cibleId)))].filter(Number.isSafeInteger);
    const [commentaires, messages, listes] = await Promise.all([
      base.commentairePublication.findMany({ where: { id: { in: ids("commentaire") }, OR: [{ suspenduLe: { not: null } }, { masqueParLieuLe: { not: null } }] }, select: { id: true } }),
      base.messageConversation.findMany({ where: { id: { in: ids("message") }, suspenduLe: { not: null } }, select: { id: true } }),
      base.listeLieux.findMany({ where: { id: { in: ids("liste") }, suspendueLe: { not: null } }, select: { id: true } }),
    ]);
    return new Set([
      ...commentaires.map((c) => `commentaire:${c.id}`), ...messages.map((m) => `message:${m.id}`), ...listes.map((l) => `liste:${l.id}`),
    ]);
  }

  return {
    async listerDecisions(compteId) {
      const lignes = (await base.signalement.findMany({
        where: { cible: SOCIALES, OR: [{ auteurContenuId: compteId }, { signaleParId: compteId, statut: { in: ["retenu", "rejete"] } }] },
        select: SELECTION,
        orderBy: [{ creeLe: "desc" }, { id: "desc" }],
        take: MAX_LIGNES_DECISIONS,
      })).map(lire);
      const masques = await lireMasques(lignes.filter((s) => s.auteurContenuId === compteId));
      return choisirDecisions(lignes, compteId, (cible, cibleId) => masques.has(`${cible}:${cibleId}`));
    },

    async contester(compteId, signalementId, texte, maintenant) {
      const brute = await base.signalement.findFirst({ where: { id: signalementId, cible: SOCIALES }, select: SELECTION });
      const ligne = brute ? lire(brute) : null;
      const duContenu = ligne && ligne.auteurContenuId === compteId
        ? (await base.signalement.findMany({ where: { cible: ligne.cible, cibleId: ligne.cibleId }, select: SELECTION })).map(lire)
        : [];
      const verdict = verifierContestation(ligne, duContenu, compteId, maintenant);
      if (!verdict.ok) return verdict;
      if (!(await o.contesterSignalement(verdict.id, texte, maintenant))) return { ok: false, erreur: "decision-inconnue" };
      return { ok: true };
    },
  };
}
