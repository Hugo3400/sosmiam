// La modération des contenus sociaux de l'app dans le logiciel de gestion (spécification sociale F.2, décisions de Hugo du
// 14 octobre 2026) : l'équipe juge l'INSTANTANÉ chiffré pris au moment du signalement, jamais le contenu vivant (elle n'a
// pas la clé des messages non signalés) ; la décision retire ou remet en ligne le commentaire, le message ou la liste, et la
// cloche prévient l'auteur (« contenu-retire ») et ceux qui ont signalé (« signalement-decide »), comme le veut le règlement
// européen sur les services numériques. Profil, sortie et groupe : l'équipe agit à la main (avatar, titre, compte).
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import type { Prisma } from "../../base-de-donnees/client-genere/client.ts";
import { SIGNALEMENT_OUVERT, supprimerMediasLibres } from "../effacer-conversations.ts";
import type { NouvelleNotificationCloche } from "../effets-sociaux-regles.ts";
import type { StockageMediasChat } from "../stockage-medias-chat.ts";
import type { ModerationSociale } from "./cibles-moderation.ts";

export type { ModerationSociale } from "./cibles-moderation.ts";

type Transaction = Prisma.TransactionClient;
const UN_AN = 365 * 86_400_000;

/** L'instantané d'un signalement, déchiffré pour l'équipe ; « sans-cle » sans clé des données, « illisible » s'il ne se relit pas */
export function lireInstantane(social: ModerationSociale | undefined, s: { id: number; instantaneChiffre: string | null }) {
  if (!s.instantaneChiffre) return null;
  if (!social?.chiffrement) return { etat: "sans-cle" as const };
  try {
    return { etat: "lu" as const, contenu: JSON.parse(social.chiffrement.dechiffrerInstantane(s.instantaneChiffre, s.id)) as Record<string, unknown> };
  } catch {
    return { etat: "illisible" as const };
  }
}

/** Les lieux cités par des instantanés (lieuId, lieux), avec leur nom : la modération les relit dans la base */
export async function lireLieuxDesInstantanes(contenus: (Record<string, unknown> | undefined)[]) {
  const ids = new Set<number>();
  for (const c of contenus) {
    if (!c) continue;
    if (typeof c.lieuId === "number") ids.add(c.lieuId);
    if (Array.isArray(c.lieux)) for (const id of c.lieux) if (typeof id === "number") ids.add(id);
  }
  if (ids.size === 0) return {};
  const lieux = await baseDeDonnees.lieu.findMany({ where: { id: { in: [...ids] } }, select: { id: true, nom: true, emoji: true, ville: true } });
  return Object.fromEntries(lieux.map((lieu) => [lieu.id, lieu]));
}

/**
 * Signalements abusifs (F.2) : pour chaque personne qui signale, sa part de signalements rejetés sur 12 mois (sur ceux déjà
 * jugés) et son nombre de signalements du mois. Rien n'est bloqué tout seul : l'équipe regarde.
 */
export async function lireHistoriqueSignaleurs(ids: number[], maintenant = new Date()) {
  if (ids.length === 0) return {};
  const debutMois = new Date(Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth(), 1));
  const [annee, mois] = await Promise.all([
    baseDeDonnees.signalement.groupBy({ by: ["signaleParId", "statut"], where: { signaleParId: { in: ids }, creeLe: { gte: new Date(maintenant.getTime() - UN_AN) } }, _count: { _all: true } }),
    baseDeDonnees.signalement.groupBy({ by: ["signaleParId"], where: { signaleParId: { in: ids }, creeLe: { gte: debutMois } }, _count: { _all: true } }),
  ]);
  return Object.fromEntries(ids.map((id) => {
    const lignes = annee.filter((l) => l.signaleParId === id);
    const juges = lignes.filter((l) => l.statut !== "a-traiter").reduce((total, l) => total + l._count._all, 0);
    const rejetes = lignes.find((l) => l.statut === "rejete")?._count._all ?? 0;
    return [id, { juges, rejetes, partRejets: juges ? Math.round((rejetes / juges) * 100) : null, ceMois: mois.find((m) => m.signaleParId === id)?._count._all ?? 0 }];
  }));
}

/**
 * Dans la transaction de la décision : ce qu'elle fait au contenu. « retenu » : le commentaire, le message ou la liste est
 * retiré (le fichier d'un message aussi, rendu pour être supprimé après la transaction). « rejete » : le masquage du
 * signalement est levé (et le masquage par le lieu pour un signalement venu du lieu) ; un réexamen qui donne raison à
 * l'auteur remet aussi en ligne ce qui avait été retiré. Rien pour un profil, une sortie ou un groupe (à la main).
 */
export async function appliquerDecisionSociale(
  tx: Transaction,
  s: { cible: string; cibleId: string; source: string },
  decision: "retenu" | "rejete",
  reexamen: boolean,
  maintenant: Date,
): Promise<{ fichier: string | null }> {
  const id = Number(s.cibleId);
  if (!Number.isSafeInteger(id)) return { fichier: null };
  if (s.cible === "commentaire") {
    await tx.commentairePublication.updateMany({
      where: { id },
      data: decision === "retenu"
        ? { retireLe: maintenant }
        : { suspenduLe: null, ...(s.source === "lieu" ? { masqueParLieuLe: null } : {}), ...(reexamen ? { retireLe: null } : {}) },
    });
  } else if (s.cible === "liste") {
    await tx.listeLieux.updateMany({ where: { id }, data: decision === "retenu" ? { retireeLe: maintenant } : { suspendueLe: null, ...(reexamen ? { retireeLe: null } : {}) } });
  } else if (s.cible === "message") {
    const message = await tx.messageConversation.findUnique({ where: { id }, select: { conversationId: true, fichier: true } });
    if (!message) return { fichier: null };
    await tx.messageConversation.update({
      where: { id },
      data: decision === "retenu" ? { retireLe: maintenant, fichier: null } : { suspenduLe: null, ...(reexamen ? { retireLe: null } : {}) },
    });
    // L'app relit la discussion quand sa version bouge : le message y devient « retiré », ou revient
    await tx.conversation.update({ where: { id: message.conversationId }, data: { version: { increment: 1 }, modifieLe: maintenant } });
    return { fichier: decision === "retenu" ? message.fichier : null };
  }
  return { fichier: null };
}

/**
 * Après la décision : la cloche de l'auteur (« contenu-retire », avec le motif) et de chaque personne qui a signalé
 * (« signalement-decide », retenu ou rejeté), sur son propre signalement ; puis le fichier d'un message retiré. Jamais
 * bloquant : la décision est déjà enregistrée.
 */
export async function prevenirApresDecision(
  social: ModerationSociale | undefined,
  decides: { id: number; signaleParId: number | null; auteurContenuId: number | null }[],
  decision: "retenu" | "rejete",
  motif: string | null,
  fichier: string | null,
  maintenant: Date,
) {
  if (!social) return;
  const notes: NouvelleNotificationCloche[] = [];
  const auteur = decides.find((s) => s.auteurContenuId !== null);
  if (decision === "retenu" && auteur?.auteurContenuId) {
    notes.push({ compteId: auteur.auteurContenuId, type: "contenu-retire", acteurId: null, cible: { type: "signalement", id: String(auteur.id) }, ...(motif ? { detail: motif } : {}) });
  }
  for (const s of decides) {
    if (s.signaleParId && !notes.some((n) => n.type === "signalement-decide" && n.compteId === s.signaleParId)) {
      notes.push({ compteId: s.signaleParId, type: "signalement-decide", acteurId: null, cible: { type: "signalement", id: String(s.id) }, detail: decision });
    }
  }
  await social.cloche.noter(notes, maintenant).catch((erreur: unknown) => console.error("Modération : cloche non écrite :", (erreur as Error).message));
  if (fichier) await supprimerMediasLibres([fichier], social.medias);
}

/** Le média d'un signalement encore ouvert (photo, note vocale), déchiffré ; null s'il n'y en a pas (ou plus) */
export async function lireMediaSignale(id: number, social: ModerationSociale | undefined) {
  if (!social?.chiffrement) return { etat: "sans-cle" as const };
  const s = await baseDeDonnees.signalement.findFirst({ where: { AND: [{ id, fichierMedia: { not: null } }, SIGNALEMENT_OUVERT] }, select: { id: true, fichierMedia: true, instantaneChiffre: true } });
  if (!s?.fichierMedia) return null;
  const chiffre = await social.medias.lire(s.fichierMedia);
  if (!chiffre) return null;
  const instantane = lireInstantane(social, s);
  const media = instantane?.etat === "lu" ? (instantane.contenu.media as { typeMime?: unknown } | null) : null;
  return { etat: "lu" as const, octets: social.chiffrement.dechiffrerOctets(chiffre, s.fichierMedia), type: typeof media?.typeMime === "string" ? media.typeMime : "application/octet-stream" };
}

/**
 * Ménage de nuit (F.2, E.1 7 bis) : les signalements jugés depuis plus d'un an (décision ou réexamen), publications comprises,
 * partent avec leur instantané ; jamais un signalement contesté et pas encore réexaminé. Les fichiers qu'ils gardaient sont
 * supprimés s'il n'y a plus de message ni de signalement ouvert pour eux. Rend le nombre de signalements effacés.
 */
export async function effacerSignalementsAnciens(medias: StockageMediasChat | null, maintenant = new Date()): Promise<number> {
  const limite = new Date(maintenant.getTime() - UN_AN);
  const ou: Prisma.SignalementWhereInput = {
    statut: { in: ["retenu", "rejete"] },
    NOT: { contesteLe: { not: null }, reexamineLe: null },
    OR: [{ reexamineLe: { lt: limite } }, { reexamineLe: null, traiteLe: { lt: limite } }],
  };
  const avecFichier = await baseDeDonnees.signalement.findMany({ where: { ...ou, fichierMedia: { not: null } }, select: { fichierMedia: true } });
  const { count } = await baseDeDonnees.signalement.deleteMany({ where: ou });
  const fichiers = avecFichier.flatMap((s) => (s.fichierMedia ? [s.fichierMedia] : []));
  if (medias && fichiers.length) {
    const vivants = new Set((await baseDeDonnees.messageConversation.findMany({ where: { fichier: { in: fichiers } }, select: { fichier: true } })).map((m) => m.fichier));
    await supprimerMediasLibres(fichiers.filter((f) => !vivants.has(f)), medias);
  }
  return count;
}
