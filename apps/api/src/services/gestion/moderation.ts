// File de modération : les signalements envoyés depuis l'app, et ce qu'on en a décidé (voir docs/decisions.md,
// « Signalements et modération »). Une décision vaut pour tous les signalements encore ouverts sur le même contenu :
// on juge la publication, pas chaque signalement.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { appliquerDecisionSociale, lireHistoriqueSignaleurs, lireInstantane, lireLieuxDesInstantanes, prevenirApresDecision, retirerPhotoDuProfilRetenu, type ModerationSociale } from "./moderation-sociale.ts";
import type { Prisma } from "../../base-de-donnees/client-genere/client.ts";
import type { AvisGestion, ResultatRetablir } from "../avis-gestion.ts";
import { PREFIXE_AVATAR_PHOTO } from "../../../../../packages/commun/src/regles/photo-profil.ts";
import { appliquerDecisionCommunaute } from "../communaute-moderation.ts";
import { creerStockageMediasChat } from "../stockage-medias-chat.ts";
import { CIBLES_AVIS, CIBLES_COMMUNAUTE } from "./cibles-moderation.ts";
import type { MotifModeration } from "./motifs-moderation.ts";

/** Même liste que RAISONS_AVEC_MASQUAGE_IMMEDIAT (packages/commun/src/regles/signalement.ts), que l'API ne peut pas encore importer */
export const RAISONS_AVEC_MASQUAGE_IMMEDIAT = ["choquant"];


/** Un autre poste a pris la décision pendant la nôtre : tout est annulé (rétablissement d'un avis compris) */
class DejaDecide extends Error {}

const avatarEnPhoto = (instantane: ReturnType<typeof lireInstantane> | undefined) =>
  instantane?.etat === "lu" && typeof instantane.contenu.avatar === "string" && instantane.contenu.avatar.startsWith(PREFIXE_AVATAR_PHOTO);

/** Contestée et pas encore réexaminée */
const CONTESTES = { contesteLe: { not: null }, reexamineLe: null } as const;

/**
 * La file : les signalements d'un statut (ou contestés), éventuellement d'une seule cible. Une publication est montrée telle
 * qu'elle est ; un contenu social, par son INSTANTANÉ déchiffré (jamais le contenu vivant), avec les noms des lieux qu'il
 * cite et l'historique de la personne qui a signalé.
 */
export async function listerSignalements(statut: string, social?: ModerationSociale, cible = "") {
  const [signalements, compteurs, contestes] = await Promise.all([
    baseDeDonnees.signalement.findMany({
      where: { ...(statut === "conteste" ? CONTESTES : statut ? { statut } : {}), ...(cible ? { cible } : {}) },
      orderBy: { creeLe: statut === "a-traiter" || statut === "conteste" ? "asc" : "desc" },
      take: 300,
    }),
    baseDeDonnees.signalement.groupBy({ by: ["statut"], _count: { _all: true } }),
    baseDeDonnees.signalement.count({ where: CONTESTES }),
  ]);
  // Ce qui a été signalé, pour juger sans changer d'écran
  const idsPublications = [...new Set(signalements.filter((s) => s.cible === "publication").map((s) => Number(s.cibleId)).filter(Number.isInteger))];
  const publications = await baseDeDonnees.publication.findMany({
    where: { id: { in: idsPublications } },
    select: {
      id: true, legende: true, statut: true, suspendue: true, auteurType: true, auteurPseudo: true, partenariat: true,
      lieu: { select: { nom: true, emoji: true } },
      medias: { select: { id: true, type: true, fichier: true }, orderBy: [{ type: "asc" }, { ordre: "asc" }] },
    },
  });
  const parId = new Map(publications.map((publication) => [String(publication.id), publication]));
  // Avis et réponses des lieux masqués par l'équipe (relecture) : montrés tels qu'ils sont, pour un réexamen
  const idsAvis = [...new Set(signalements.filter((s) => (CIBLES_AVIS as readonly string[]).includes(s.cible)).map((s) => Number(s.cibleId)).filter(Number.isInteger))];
  const avis = idsAvis.length
    ? await baseDeDonnees.avis.findMany({
      where: { id: { in: idsAvis } },
      select: { id: true, note: true, texte: true, signature: true, statut: true, reponseTexte: true, reponseStatut: true, photo: true, lieu: { select: { nom: true, emoji: true } } },
    })
    : [];
  const avisParId = new Map(avis.map(({ photo, ...a }) => [String(a.id), { ...a, avecPhoto: photo !== null }]));
  const instantanes = new Map(signalements.map((s) => [s.id, lireInstantane(social, s)]));
  const [lieux, signaleurs] = await Promise.all([
    lireLieuxDesInstantanes([...instantanes.values()].map((i) => (i?.etat === "lu" ? i.contenu : undefined))),
    lireHistoriqueSignaleurs([...new Set(signalements.flatMap((s) => (s.signaleParId ? [s.signaleParId] : [])))]),
  ]);
  const enrichis = signalements.map(({ instantaneChiffre: _chiffre, fichierMedia, ...signalement }) => ({
    ...signalement,
    urgent: RAISONS_AVEC_MASQUAGE_IMMEDIAT.includes(signalement.raison),
    publication: signalement.cible === "publication" ? parId.get(signalement.cibleId) ?? null : null,
    avis: (CIBLES_AVIS as readonly string[]).includes(signalement.cible) ? avisParId.get(signalement.cibleId) ?? null : null,
    instantane: instantanes.get(signalement.id) ?? null,
    avecMedia: fichierMedia !== null || (signalement.cible === "profil" && avatarEnPhoto(instantanes.get(signalement.id))),
    signaleur: signalement.signaleParId ? signaleurs[signalement.signaleParId] ?? null : null,
  }));
  // Les signalements graves encore ouverts passent en tête de file
  if (statut === "a-traiter") enrichis.sort((a, b) => Number(b.urgent) - Number(a.urgent));
  return {
    compteurs: { ...Object.fromEntries(compteurs.map((groupe) => [groupe.statut, groupe._count._all])), conteste: contestes },
    signalements: enrichis,
    lieux,
  };
}

export type DecisionModeration = { decision: "retenu" | "rejete"; note: string | null; motif: MotifModeration | null; motivation: string | null };

/**
 * Décide d'un signalement, et du même coup de tous ceux encore ouverts sur le même contenu (ou réexamine une décision
 * contestée). « retenu » : la publication, le commentaire, le message ou la liste est retiré pour de bon, avec la règle
 * enfreinte et le pourquoi pour l'auteur. « rejete » : il reste ou revient en ligne. Ensuite, la cloche prévient l'auteur et
 * ceux qui ont signalé (moderation-sociale.ts). Null si le signalement n'existe pas ; « deja-decide » si la décision est déjà
 * prise et pas contestée, ou si un autre poste vient de la prendre (écriture conditionnelle dans la transaction : de deux
 * décisions en même temps, une seule passe). Avis ou réponse masqués à la relecture : un réexamen qui donne raison à
 * l'auteur les remet en ligne DANS la même transaction (verrous compte → avis → signalements, comme trancherAvis).
 */
export async function deciderSignalement(
  id: number, { decision, note, motif, motivation }: DecisionModeration, social?: ModerationSociale, maintenant = new Date(), avis?: AvisGestion,
) {
  const signalement = await baseDeDonnees.signalement.findUnique({ where: { id } });
  if (!signalement) return null;
  const reexamen = signalement.statut !== "a-traiter";
  if (reexamen && !(signalement.contesteLe && !signalement.reexamineLe)) return "deja-decide" as const;
  const prendre = (transaction: Prisma.TransactionClient) => transaction.signalement
    .updateMany({ where: reexamen ? { id, ...CONTESTES } : { id, statut: "a-traiter" }, data: { traiteLe: maintenant } })
    .then(({ count }) => { if (count === 0) throw new DejaDecide(); });
  const decider = async (transaction: Prisma.TransactionClient) => {
    let retabli: ResultatRetablir | null = null;
    const idAvis = Number(signalement.cibleId);
    if (avis && decision === "rejete" && reexamen && (CIBLES_AVIS as readonly string[]).includes(signalement.cible) && Number.isSafeInteger(idAvis)) {
      retabli = signalement.cible === "avis" ? await avis.retablirAvisDans(transaction, idAvis, maintenant) : await avis.retablirReponseAvisDans(transaction, idAvis, maintenant);
    }
    await prendre(transaction);
    const idPublication = Number(signalement.cibleId);
    if (signalement.cible === "publication" && Number.isInteger(idPublication)) {
      await transaction.publication.updateMany({
        where: { id: idPublication },
        data: decision === "retenu" ? { statut: "masquee", suspendue: false } : { suspendue: false },
      });
      // Réexamen qui donne raison à l'auteur : la publication retirée revient en ligne
      if (decision === "rejete" && reexamen) await transaction.publication.updateMany({ where: { id: idPublication, statut: "masquee" }, data: { statut: "publiee" } });
    }
    const { fichier } = await appliquerDecisionSociale(transaction, signalement, decision, reexamen, maintenant);
    const communaute = (CIBLES_COMMUNAUTE as readonly string[]).includes(signalement.cible)
      ? await appliquerDecisionCommunaute(transaction, signalement, decision, reexamen, maintenant, social?.medias ?? creerStockageMediasChat())
      : null;
    const memeContenu = { cible: signalement.cible, cibleId: signalement.cibleId };
    const concernes = { OR: [{ id }, { ...memeContenu, statut: "a-traiter" }, ...(reexamen ? [{ ...memeContenu, ...CONTESTES }] : [])] };
    const decides = await transaction.signalement.findMany({ where: concernes, select: { id: true, signaleParId: true, auteurContenuId: true } });
    const { count } = await transaction.signalement.updateMany({
      where: concernes,
      data: {
        statut: decision, decision: note, traiteLe: maintenant,
        motif: decision === "retenu" ? motif : null, motivation,
        ...(reexamen ? { reexamineLe: maintenant } : {}),
      },
    });
    return { cible: signalement.cible, cibleId: signalement.cibleId, regles: count, reexamen, decides, fichier, retabli, communaute };
  };
  let resultat: Awaited<ReturnType<typeof decider>>;
  try {
    resultat = await baseDeDonnees.$transaction(decider);
  } catch (erreur) {
    if (erreur instanceof DejaDecide) return "deja-decide" as const;
    throw erreur;
  }
  const { decides, fichier, retabli, communaute, ...rendu } = resultat;
  if (communaute) {
    if (communaute.notifications.length && social) {
      await social.cloche.noter(communaute.notifications, maintenant).catch((erreur: unknown) => console.error("Modération : cloche de la communauté non écrite :", (erreur as Error).message));
    }
    await communaute.apresTransaction().catch((erreur: unknown) => console.error("Modération : suite de la décision communauté ratée :", (erreur as Error).message));
  }
  if (retabli) {
    if (!retabli.ok) console.error(`Avis : réexamen sans effet sur ${signalement.cible} n° ${signalement.cibleId} (${retabli.erreur})`);
    // Hors de la transaction : la réévaluation des défis ouvre la sienne (elle attendrait le verrou du compte)
    await avis!.apresRetablir(retabli, maintenant);
  }
  if (decision === "retenu" && signalement.cible === "profil" && signalement.auteurContenuId) await retirerPhotoDuProfilRetenu(signalement.auteurContenuId);
  await prevenirApresDecision(social, decides, decision, motif, fichier, maintenant);
  return rendu;
}

/**
 * Note une contestation reçue (par mail, de l'auteur ou de la personne qui a signalé) : la décision passe dans
 * « Contestés » pour être réexaminée. Faux si le signalement n'existe pas ou n'a pas encore été décidé.
 */
export async function contesterSignalement(id: number, contestation: string, maintenant = new Date()) {
  const { count } = await baseDeDonnees.signalement.updateMany({
    where: { id, statut: { in: ["retenu", "rejete"] } },
    data: { contestation, contesteLe: maintenant, reexamineLe: null },
  });
  return count > 0;
}

export type SignalementRecu = {
  publicationId: string;
  lieuId: number;
  raison: string;
  precision: string | null;
  explication: string;
  masquageAutorise: boolean;
};

/**
 * Enregistre un signalement envoyé depuis l'app (déjà vérifié par le contrôleur). Pour une raison grave
 * (RAISONS_AVEC_MASQUAGE_IMMEDIAT), la publication est suspendue pour tout le monde dès ce premier signalement.
 */
export async function enregistrerSignalement({ publicationId, lieuId, raison, precision, explication, masquageAutorise }: SignalementRecu) {
  await baseDeDonnees.signalement.create({
    data: { cible: "publication", cibleId: publicationId, lieuId, raison, precision, explication, source: "app" },
  });
  const idPublication = Number(publicationId);
  if (!masquageAutorise || !RAISONS_AVEC_MASQUAGE_IMMEDIAT.includes(raison) || !Number.isInteger(idPublication)) return;
  const rejets = await baseDeDonnees.signalement.count({ where: { cible: "publication", cibleId: publicationId, statut: "rejete" } });
  if (rejets === 0) await baseDeDonnees.publication.updateMany({ where: { id: idPublication }, data: { suspendue: true } });
}
