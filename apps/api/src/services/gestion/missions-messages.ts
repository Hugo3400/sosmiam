// Missions et messages des ambassadeurs : l'équipe les crée dans le logiciel de gestion ; l'ambassadeur les voit dans
// son espace (ambassadeur.sosmiam.fr, puis l'app), dit « Je suis sur place », termine ses missions et marque ses messages comme lus.
import type { DetailsErreur } from "../../../../../packages/commun/src/client-api/reponse-api.ts";
import { evaluerPosition } from "../../../../../packages/commun/src/fonctions/visites/evaluer-position.ts";
import { traduireResultatPosition } from "../../../../../packages/commun/src/fonctions/visites/traduire-resultat-position.ts";
import { RAYON_VALIDATION_M } from "../../../../../packages/commun/src/regles/visites.ts";
import type { ErreurService } from "../../../../../packages/commun/src/types/erreurs-service.ts";
import type { LecturePosition } from "../../../../../packages/commun/src/types/position.ts";
import type { Prisma } from "../../base-de-donnees/client-genere/client.ts";
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";

// ─── Côté logiciel de gestion ───

/** type : « verifier-lieu », « verifier-big-sos », « controler-lieu » ou « autre » (null : autre) */
export type SaisieMission = { compteId: number; titre: string; detail: string; lieuId: number | null; echeance: Date | null; type: string | null };

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

/** Ce que l'espace lit d'une mission : son type, l'heure de « Je suis sur place », et le lieu avec son emoji et sa position */
const CHAMPS_MISSION_COMPTE = {
  id: true, titre: true, detail: true, echeance: true, statut: true, compteRendu: true, creeLe: true, faiteLe: true, type: true, presenceVerifieeLe: true,
  lieu: { select: { id: true, nom: true, ville: true, emoji: true, latitude: true, longitude: true } },
} as const;
type MissionDuCompte = Prisma.MissionAmbassadeurGetPayload<{ select: typeof CHAMPS_MISSION_COMPTE }>;

/** La position du lieu en { latitude, longitude }, ou null s'il n'est pas encore placé */
const presenterMission = ({ lieu, ...mission }: MissionDuCompte) => ({
  ...mission,
  lieu: lieu && {
    id: lieu.id, nom: lieu.nom, ville: lieu.ville, emoji: lieu.emoji,
    position: lieu.latitude !== null && lieu.longitude !== null ? { latitude: lieu.latitude, longitude: lieu.longitude } : null,
  },
});

/** Les missions de l'ambassadeur connecté : à faire d'abord, puis les 20 dernières faites ou annulées. */
export async function missionsDuCompte(compteId: number) {
  const missions = await baseDeDonnees.missionAmbassadeur.findMany({
    where: { compteId },
    orderBy: [{ creeLe: "desc" }],
    take: 60,
    select: CHAMPS_MISSION_COMPTE,
  });
  return [...missions.filter((m) => m.statut === "a-faire"), ...missions.filter((m) => m.statut !== "a-faire").slice(0, 20)].map(presenterMission);
}

/** « Je suis sur place » : la mission relue, ou pourquoi ce n'est pas passé (jamais la position du téléphone) */
export type ResultatPresence =
  | { ok: true; mission: ReturnType<typeof presenterMission> }
  | { ok: false; erreur: ErreurService; details?: DetailsErreur };

/**
 * « Je suis sur place » : la mission doit être à ce compte, à faire, pas encore pointée, et son lieu placé sur la carte ; la
 * lecture du téléphone est comparée au lieu avec le même rayon et les mêmes règles que les visites. Seule l'heure est
 * gardée : la position n'est ni écrite, ni journalisée, ni renvoyée (hors zone : la distance arrondie à 100 m, pour le message).
 */
export async function noterPresence(compteId: number, id: number, position: LecturePosition, maintenant = new Date()): Promise<ResultatPresence> {
  const mission = await baseDeDonnees.missionAmbassadeur.findFirst({
    where: { id, compteId },
    select: { statut: true, presenceVerifieeLe: true, lieu: { select: { nom: true, latitude: true, longitude: true, validation: { select: { rayonM: true } } } } },
  });
  if (!mission) return { ok: false, erreur: "introuvable" };
  if (mission.statut !== "a-faire") return { ok: false, erreur: "transition-interdite" };
  if (mission.presenceVerifieeLe) return { ok: false, erreur: "deja-sur-place" };
  const { lieu } = mission;
  if (!lieu || lieu.latitude === null || lieu.longitude === null) return { ok: false, erreur: "lieu-sans-position" };

  const { resultat, distanceM } = evaluerPosition(position, { latitude: lieu.latitude, longitude: lieu.longitude }, lieu.validation?.rayonM ?? RAYON_VALIDATION_M);
  const erreur = traduireResultatPosition(resultat);
  if (erreur === "hors-zone") return { ok: false, erreur, details: { distanceM: Math.round(distanceM / 100) * 100, lieu: lieu.nom } };
  if (erreur === "position-imprecise" && position.precision !== null) return { ok: false, erreur, details: { precisionM: Math.round(position.precision) } };
  if (erreur) return { ok: false, erreur };

  // Une seule heure par mission : deux appuis en même temps, ou une mission terminée entre-temps, ne l'écrasent pas
  const { count } = await baseDeDonnees.missionAmbassadeur.updateMany({
    where: { id, compteId, statut: "a-faire", presenceVerifieeLe: null },
    data: { presenceVerifieeLe: maintenant },
  });
  const relue = await baseDeDonnees.missionAmbassadeur.findFirst({ where: { id, compteId }, select: CHAMPS_MISSION_COMPTE });
  if (!relue) return { ok: false, erreur: "introuvable" };
  if (count === 0) return { ok: false, erreur: relue.statut === "a-faire" ? "deja-sur-place" : "transition-interdite" };
  return { ok: true, mission: presenterMission(relue) };
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
