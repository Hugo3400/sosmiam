// Envoi des notifications programmées : l'API regarde toutes les 30 secondes (demarrer.ts). Chaque téléphone visé reçoit
// la notification, sauf s'il a déjà eu son compte (anti-spam : 1 par jour, 4 par semaine), et chaque résultat est noté.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import type { Prisma } from "../../base-de-donnees/client-genere/client.ts";
import { depasseAntiSpam } from "../../fonctions/notifications/depasse-anti-spam.ts";
import { expedierPush, type ExpedierPush } from "./expedier-push.ts";
import { lireReglagesApple, lireReglagesGoogle } from "./reglages-push.ts";

const SEMAINE = 7 * 86_400_000;
/** Téléphones contactés en même temps */
const EN_PARALLELE = 10;

export type CiblePush = { ville: string | null; plateforme: "ios" | "android" | null };

const ouCible = (cible: CiblePush): Prisma.AppareilPushWhereInput => ({
  actif: true,
  ...(cible.plateforme ? { plateforme: cible.plateforme } : {}),
  ...(cible.ville ? { ville: { equals: cible.ville, mode: "insensitive" } } : {}),
});

/** Les dates des notifications non demandées reçues ces 7 jours, téléphone par téléphone. */
async function lireReceptionsRecentes(appareils: number[], maintenant: Date) {
  const receptions = await baseDeDonnees.receptionPush.findMany({
    where: { appareilId: { in: appareils }, statut: "envoyee", compte: true, creeLe: { gt: new Date(maintenant.getTime() - SEMAINE) } },
    select: { appareilId: true, creeLe: true },
  });
  const parAppareil = new Map<number, Date[]>();
  for (const r of receptions) parAppareil.set(r.appareilId, [...(parAppareil.get(r.appareilId) ?? []), r.creeLe]);
  return parAppareil;
}

/** Combien de téléphones visés, et combien l'anti-spam laisserait de côté si on envoyait maintenant. */
export async function estimerPush(cible: CiblePush, demandee: boolean, maintenant = new Date()) {
  const appareils = await baseDeDonnees.appareilPush.findMany({ where: ouCible(cible), select: { id: true, plateforme: true } });
  const recues = demandee ? new Map<number, Date[]>() : await lireReceptionsRecentes(appareils.map((a) => a.id), maintenant);
  const bloques = appareils.filter((a) => depasseAntiSpam(recues.get(a.id) ?? [], maintenant)).length;
  return {
    total: appareils.length,
    iphone: appareils.filter((a) => a.plateforme === "ios").length,
    android: appareils.filter((a) => a.plateforme === "android").length,
    antiSpam: bloques,
  };
}

/** Un passage : envoie la plus ancienne notification due, s'il y en a une. Rend son numéro, ou null. */
export async function traiterNotifications(expedier: ExpedierPush = expedierPush, maintenant = new Date()) {
  // Prise en main atomique : une seule API envoie une notification donnée
  const due = await baseDeDonnees.notificationPush.findFirst({ where: { statut: "programmee", programmeeLe: { lte: maintenant } }, orderBy: { programmeeLe: "asc" } });
  if (!due) return null;
  const { count } = await baseDeDonnees.notificationPush.updateMany({ where: { id: due.id, statut: "programmee" }, data: { statut: "envoi" } });
  if (count === 0) return null;

  const appareils = await baseDeDonnees.appareilPush.findMany({ where: ouCible(due.cible as CiblePush), select: { id: true, jeton: true, plateforme: true } });
  const recues = due.demandee ? new Map<number, Date[]>() : await lireReceptionsRecentes(appareils.map((a) => a.id), maintenant);
  const bilan = { envoyees: 0, echecs: 0, ignorees: 0 };
  const message = { titre: due.titre, texte: due.texte, lien: due.lien };

  for (let i = 0; i < appareils.length; i += EN_PARALLELE) {
    await Promise.all(appareils.slice(i, i + EN_PARALLELE).map(async (appareil) => {
      if (depasseAntiSpam(recues.get(appareil.id) ?? [], maintenant)) {
        bilan.ignorees++;
        await baseDeDonnees.receptionPush.create({ data: { notificationId: due.id, appareilId: appareil.id, statut: "ignoree", compte: !due.demandee } });
        return;
      }
      const resultat = await expedier(appareil, message);
      if (resultat === "envoyee") bilan.envoyees++;
      else bilan.echecs++;
      // Un téléphone qui n'existe plus (app désinstallée) n'est plus visé
      if (resultat === "jeton-invalide") await baseDeDonnees.appareilPush.update({ where: { id: appareil.id }, data: { actif: false } });
      await baseDeDonnees.receptionPush.create({
        data: {
          notificationId: due.id, appareilId: appareil.id, compte: !due.demandee,
          statut: resultat === "envoyee" ? "envoyee" : "echec",
          erreur: resultat === "envoyee" ? null : resultat === "jeton-invalide" ? "Téléphone inconnu (app désinstallée ?)" : resultat.erreur,
        },
      });
    }));
  }
  await baseDeDonnees.notificationPush.update({ where: { id: due.id }, data: { statut: "envoyee", envoyeeLe: new Date(), total: appareils.length, ...bilan } });
  return due.id;
}

/** État de l'envoi : réglages Apple et Google, téléphones inscrits, notifications à venir. */
export async function lireEtatPush() {
  const [apple, google, parPlateforme, programmees] = await Promise.all([
    lireReglagesApple(),
    lireReglagesGoogle(),
    baseDeDonnees.appareilPush.groupBy({ by: ["plateforme"], where: { actif: true }, _count: { _all: true } }),
    baseDeDonnees.notificationPush.count({ where: { statut: "programmee" } }),
  ]);
  const nombre = (plateforme: string) => parPlateforme.find((p) => p.plateforme === plateforme)?._count._all ?? 0;
  return { apple: apple.etat, google: google.etat, iphone: nombre("ios"), android: nombre("android"), programmees };
}

/** Ménage de nuit : le détail des réceptions de plus de 90 jours part (les totaux de chaque notification restent). */
export async function effacerReceptionsAnciennes(maintenant = new Date()) {
  const { count } = await baseDeDonnees.receptionPush.deleteMany({ where: { creeLe: { lt: new Date(maintenant.getTime() - 90 * 86_400_000) } } });
  return count;
}
