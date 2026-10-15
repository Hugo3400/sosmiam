// Les signalements des contenus sociaux, dans la base (contrat dans signalements-sociaux-regles.ts). Tout se fait dans une
// transaction, sous le verrou du compte qui signale (deux envois en même temps ne font jamais deux signalements), puis, pour
// un message, sous celui de sa conversation (comme la messagerie : le compte, puis la conversation ; le ménage de nuit ne
// peut plus effacer une conversation dont un message est en train d'être signalé) : lecture du contenu tel qu'il le voit,
// signalement, instantané chiffré, et masquage pour tous d'un « choquant » sous conditions. Le verrou du compte est un FOR
// NO KEY UPDATE, comme messagerie-tables.ts et sorties.ts (verrouillerCompteQuiSignale).
import { CIBLES_AVEC_MASQUAGE_IMMEDIAT, RAISONS_AVEC_MASQUAGE_IMMEDIAT } from "../../../../packages/commun/src/regles/signalement.ts";
import type { Prisma } from "../base-de-donnees/client-genere/client.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { peutMasquerToutDeSuite } from "../fonctions/social/peut-masquer-tout-de-suite.ts";
import type { ChiffrementSocial } from "./chiffrement-social.ts";
import {
  compterRejets, ecrireSignalementSocial, lireContenuSignale, masquerPourTous, verrouillerConversationDuMessage,
} from "./instantanes-signalements.ts";
import type { RelationsSociales } from "./relations-sociales-regles.ts";
import { ecrireEffetMasque, MAX_SIGNALES_LUS, type ServicesSignalementsSociaux } from "./signalements-sociaux-regles.ts";

/**
 * Le compte qui signale, verrouillé FOR NO KEY UPDATE (et non FOR UPDATE, relations.verrouillerComptes) : deux signalements
 * du même compte s'attendent toujours, un geste de la bande ou un blocage (FOR UPDATE) aussi ; mais un message ou une
 * réaction que ce compte écrit au même moment dans la conversation du message signalé (sous le verrou de la conversation,
 * sa clé étrangère auteur_id ou compte_id prend FOR KEY SHARE sur le compte) passe. Avec FOR UPDATE, chacun attendait le
 * verrou de l'autre : interblocage.
 */
async function verrouillerCompteQuiSignale(tx: Pick<Prisma.TransactionClient, "$queryRaw">, compteId: number): Promise<void> {
  await tx.$queryRaw`SELECT id FROM comptes WHERE id = ${compteId} FOR NO KEY UPDATE`;
}

export function creerSignalementsSociaux(o: { relations: RelationsSociales; chiffrement: ChiffrementSocial | null }, base = baseDeDonnees): ServicesSignalementsSociaux {
  const { relations } = o;
  return {
    async signaler(compteId, s, maintenant) {
      // La route est 🔐 (503 sans clé) : l'instantané ne s'écrit jamais en clair
      const chiffrement = o.chiffrement;
      if (!chiffrement) throw new Error("Signalement social sans clé des données");
      return base.$transaction(async (tx) => {
        await verrouillerCompteQuiSignale(tx, compteId);
        const deja = await tx.signalement.findFirst({ where: { signaleParId: compteId, cible: s.cible, cibleId: s.cibleId, source: "app" }, select: { id: true } });
        if (deja) return { ok: true as const, deja: true, masquePourTous: false, effets: [] };
        if (s.cible === "message") await verrouillerConversationDuMessage(tx, s.cibleId);
        const lu = await lireContenuSignale(tx, { chiffrement, relations }, compteId, s.cible, s.cibleId, maintenant);
        // Son propre contenu ne se signale pas (on le supprime) : même réponse qu'un contenu invisible
        if (!lu || lu.auteurContenuId === compteId) return { ok: false as const, erreur: "contenu-inconnu" as const };
        let masquer = false;
        if (CIBLES_AVEC_MASQUAGE_IMMEDIAT.includes(s.cible) && RAISONS_AVEC_MASQUAGE_IMMEDIAT.includes(s.raison)) {
          const [signaleur, rejets] = await Promise.all([
            tx.compte.findUnique({ where: { id: compteId }, select: { emailVerifieLe: true, creeLe: true } }),
            compterRejets(tx, s.cible, s.cibleId),
          ]);
          masquer = !!signaleur && peutMasquerToutDeSuite({ emailVerifie: signaleur.emailVerifieLe !== null, creeLe: signaleur.creeLe }, rejets > 0, maintenant);
        }
        const id = await ecrireSignalementSocial(tx, chiffrement, {
          ...s, signaleParId: compteId, auteurContenuId: lu.auteurContenuId, lieuId: lu.lieuId, source: "app", fichierMedia: lu.fichierMedia,
        }, lu.contenu, maintenant);
        if (masquer) await masquerPourTous(tx, s.cible, Number(s.cibleId), maintenant);
        return { ok: true as const, deja: false, masquePourTous: masquer, effets: masquer ? ecrireEffetMasque(lu.auteurContenuId, id, "choquant") : [] };
      });
    },

    async listerMiens(compteId, cible) {
      const lignes = await base.signalement.findMany({
        where: { signaleParId: compteId, cible, source: "app" },
        select: { cibleId: true },
        orderBy: [{ creeLe: "desc" }, { id: "desc" }],
        take: MAX_SIGNALES_LUS,
      });
      return [...new Set(lignes.map((l) => l.cibleId))];
    },

    async lireSignalesPar(compteId, cible, cibleIds) {
      const ids = [...new Set(cibleIds)].slice(0, 1000);
      if (ids.length === 0) return new Set();
      const lignes = await base.signalement.findMany({ where: { signaleParId: compteId, cible, source: "app", cibleId: { in: ids } }, select: { cibleId: true } });
      return new Set(lignes.map((l) => l.cibleId));
    },
  };
}
