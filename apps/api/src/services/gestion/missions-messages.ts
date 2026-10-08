// Missions et messages des ambassadeurs : l'équipe les crée dans le logiciel de gestion ; l'ambassadeur les voit dans
// son espace (ambassadeur.sosmiam.fr, puis l'app), termine ses missions et marque ses messages comme lus.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";

// ─── Côté logiciel de gestion ───

export type SaisieMission = { compteId: number; titre: string; detail: string; lieuId: number | null; echeance: Date | null };

export async function listerMissions(statut: string) {
  return baseDeDonnees.missionAmbassadeur.findMany({
    where: statut ? { statut } : {},
    orderBy: statut === "a-faire" ? [{ echeance: { sort: "asc", nulls: "last" } }, { creeLe: "asc" }] : [{ creeLe: "desc" }],
    take: 200,
    include: { compte: { select: { id: true, prenom: true, ambassadeur: { select: { ville: true } } } }, lieu: { select: { id: true, nom: true, emoji: true } } },
  });
}

export async function creerMission(saisie: SaisieMission) {
  const ambassadeur = await baseDeDonnees.ambassadeur.findUnique({ where: { compteId: saisie.compteId }, select: { statut: true } });
  if (ambassadeur?.statut !== "actif") return null;
  return baseDeDonnees.missionAmbassadeur.create({ data: saisie, include: { compte: { select: { prenom: true } } } });
}

/** Annule une mission (ou la remet « à faire »). */
export async function changerStatutMission(id: number, statut: "a-faire" | "annulee") {
  const { count } = await baseDeDonnees.missionAmbassadeur.updateMany({ where: { id }, data: { statut, ...(statut === "a-faire" ? { faiteLe: null } : {}) } });
  return count > 0;
}

export async function supprimerMission(id: number) {
  const { count } = await baseDeDonnees.missionAmbassadeur.deleteMany({ where: { id } });
  return count > 0;
}

/** Messages envoyés, avec le nombre de lectures (et, pour un message à tous, le nombre d'ambassadeurs actifs). */
export async function listerMessages() {
  const [messages, actifs] = await Promise.all([
    baseDeDonnees.messageAmbassadeur.findMany({
      orderBy: { creeLe: "desc" },
      take: 100,
      include: { compte: { select: { id: true, prenom: true } }, _count: { select: { lectures: true } } },
    }),
    baseDeDonnees.ambassadeur.count({ where: { statut: "actif" } }),
  ]);
  return messages.map((message) => ({ ...message, destinataires: message.compteId ? 1 : actifs }));
}

/** Envoie un message à un ambassadeur, ou à tous (compteId null). Null si le destinataire n'est pas un ambassadeur. */
export async function envoyerMessage(compteId: number | null, titre: string, texte: string) {
  if (compteId !== null && !(await baseDeDonnees.ambassadeur.findUnique({ where: { compteId }, select: { compteId: true } }))) return null;
  return baseDeDonnees.messageAmbassadeur.create({ data: { compteId, titre, texte } });
}

export async function supprimerMessage(id: number) {
  const { count } = await baseDeDonnees.messageAmbassadeur.deleteMany({ where: { id } });
  return count > 0;
}

// ─── Côté espace ambassadeur (le compte connecté, vérifié par le middleware des comptes) ───

/** Les missions de l'ambassadeur connecté : à faire d'abord, puis les 20 dernières faites ou annulées. */
export async function missionsDuCompte(compteId: number) {
  const missions = await baseDeDonnees.missionAmbassadeur.findMany({
    where: { compteId },
    orderBy: [{ creeLe: "desc" }],
    take: 60,
    select: { id: true, titre: true, detail: true, echeance: true, statut: true, compteRendu: true, creeLe: true, faiteLe: true, lieu: { select: { id: true, nom: true, ville: true } } },
  });
  return [...missions.filter((m) => m.statut === "a-faire"), ...missions.filter((m) => m.statut !== "a-faire").slice(0, 20)];
}

/** L'ambassadeur termine une mission, avec son compte rendu. Faux si ce n'est pas la sienne ou si elle n'est plus à faire. */
export async function terminerMission(compteId: number, id: number, compteRendu: string, maintenant = new Date()) {
  const { count } = await baseDeDonnees.missionAmbassadeur.updateMany({
    where: { id, compteId, statut: "a-faire" },
    data: { statut: "faite", compteRendu, faiteLe: maintenant },
  });
  return count > 0;
}

/** Les messages de l'ambassadeur connecté (les siens et ceux à tous, envoyés depuis son inscription), avec « lu ». */
export async function messagesDuCompte(compteId: number) {
  const compte = await baseDeDonnees.compte.findUnique({ where: { id: compteId }, select: { creeLe: true } });
  if (!compte) return [];
  const messages = await baseDeDonnees.messageAmbassadeur.findMany({
    where: { OR: [{ compteId }, { compteId: null, creeLe: { gte: compte.creeLe } }] },
    orderBy: { creeLe: "desc" },
    take: 50,
    select: { id: true, titre: true, texte: true, creeLe: true, lectures: { where: { compteId }, select: { luLe: true } } },
  });
  return messages.map(({ lectures, ...message }) => ({ ...message, luLe: lectures[0]?.luLe ?? null }));
}

/** Marque un message comme lu (seulement s'il est bien pour ce compte). */
export async function marquerMessageLu(compteId: number, id: number) {
  const message = await baseDeDonnees.messageAmbassadeur.findFirst({ where: { id, OR: [{ compteId }, { compteId: null }] }, select: { id: true } });
  if (!message) return false;
  await baseDeDonnees.lectureMessage.upsert({ where: { messageId_compteId: { messageId: id, compteId } }, create: { messageId: id, compteId }, update: {} });
  return true;
}
