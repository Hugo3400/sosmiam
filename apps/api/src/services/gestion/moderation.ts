// File de modération : les signalements envoyés depuis l'app, et ce qu'on en a décidé (voir docs/decisions.md,
// « Signalements et modération »). Une décision vaut pour tous les signalements encore ouverts sur le même contenu :
// on juge la publication, pas chaque signalement.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";

/** Même liste que RAISONS_AVEC_MASQUAGE_IMMEDIAT (packages/commun/src/regles/signalement.ts), que l'API ne peut pas encore importer */
export const RAISONS_AVEC_MASQUAGE_IMMEDIAT = ["choquant"];

export async function listerSignalements(statut: string) {
  const [signalements, compteurs] = await Promise.all([
    baseDeDonnees.signalement.findMany({
      where: statut ? { statut } : {},
      orderBy: { creeLe: statut === "a-traiter" ? "asc" : "desc" },
      take: 300,
    }),
    baseDeDonnees.signalement.groupBy({ by: ["statut"], _count: { _all: true } }),
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
  const enrichis = signalements.map((signalement) => ({
    ...signalement,
    urgent: RAISONS_AVEC_MASQUAGE_IMMEDIAT.includes(signalement.raison),
    publication: signalement.cible === "publication" ? parId.get(signalement.cibleId) ?? null : null,
  }));
  // Les signalements graves encore ouverts passent en tête de file
  if (statut === "a-traiter") enrichis.sort((a, b) => Number(b.urgent) - Number(a.urgent));
  return {
    compteurs: Object.fromEntries(compteurs.map((groupe) => [groupe.statut, groupe._count._all])),
    signalements: enrichis,
  };
}

/**
 * Décide d'un signalement, et du même coup de tous ceux encore ouverts sur le même contenu.
 * « retenu » : la publication est retirée pour de bon (masquée). « rejete » : elle est remise en ligne si un
 * signalement grave l'avait suspendue. Null si le signalement n'existe pas.
 */
export async function deciderSignalement(id: number, decision: "retenu" | "rejete", note: string | null, maintenant = new Date()) {
  const signalement = await baseDeDonnees.signalement.findUnique({ where: { id } });
  if (!signalement) return null;
  return baseDeDonnees.$transaction(async (transaction) => {
    const idPublication = Number(signalement.cibleId);
    if (signalement.cible === "publication" && Number.isInteger(idPublication)) {
      await transaction.publication.updateMany({
        where: { id: idPublication },
        data: decision === "retenu" ? { statut: "masquee", suspendue: false } : { suspendue: false },
      });
    }
    const { count } = await transaction.signalement.updateMany({
      where: { OR: [{ id }, { cible: signalement.cible, cibleId: signalement.cibleId, statut: "a-traiter" }] },
      data: { statut: decision, decision: note, traiteLe: maintenant },
    });
    return { cible: signalement.cible, cibleId: signalement.cibleId, regles: count };
  });
}

export type SignalementRecu = {
  publicationId: string;
  lieuId: number;
  raison: string;
  precision: string | null;
  explication: string;
};

/**
 * Enregistre un signalement envoyé depuis l'app (déjà vérifié par le contrôleur). Pour une raison grave
 * (RAISONS_AVEC_MASQUAGE_IMMEDIAT), la publication est suspendue pour tout le monde dès ce premier signalement.
 */
export async function enregistrerSignalement({ publicationId, lieuId, raison, precision, explication }: SignalementRecu) {
  await baseDeDonnees.signalement.create({
    data: { cible: "publication", cibleId: publicationId, lieuId, raison, precision, explication, source: "app" },
  });
  const idPublication = Number(publicationId);
  if (RAISONS_AVEC_MASQUAGE_IMMEDIAT.includes(raison) && Number.isInteger(idPublication)) {
    await baseDeDonnees.publication.updateMany({ where: { id: idPublication }, data: { suspendue: true } });
  }
}
