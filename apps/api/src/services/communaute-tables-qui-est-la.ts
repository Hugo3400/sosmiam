import type { Prisma } from "../base-de-donnees/client-genere/client.ts";
import type { TablesCommunaute } from "./communaute-regles.ts";

type Client = Prisma.TransactionClient;

type TablesQuiEstLa = Pick<TablesCommunaute,
  "lireProfil" | "ecrireProfil" | "lireGenresChiffres" | "lirePresence" | "ecrirePresence" | "effacerPresence" | "listerPresents" | "lireCoucous" | "ecrireCoucou" | "effacerCoucous">;

export function creerTablesQuiEstLa(base: Client): TablesQuiEstLa {
  return {
    lireProfil: (compteId) => base.profilCommunaute.findUnique({ where: { compteId }, select: { genreChiffre: true, genreChoisiLe: true, quiEstLa: true } }),
    async ecrireProfil(compteId, changement, maintenant) {
      await base.profilCommunaute.upsert({ where: { compteId }, create: { compteId, ...changement, modifieLe: maintenant }, update: { ...changement, modifieLe: maintenant } });
    },
    async lireGenresChiffres(ids) {
      if (ids.length === 0) return new Map();
      const lignes = await base.profilCommunaute.findMany({ where: { compteId: { in: [...ids] }, genreChiffre: { not: null } }, select: { compteId: true, genreChiffre: true } });
      return new Map(lignes.map((l) => [l.compteId, l.genreChiffre!]));
    },
    lirePresence: (compteId) => base.presenceQuiEstLa.findUnique({ where: { compteId }, select: { villeCle: true, jusqua: true } }),
    async ecrirePresence(compteId, villeCle, jusqua) {
      await base.presenceQuiEstLa.upsert({ where: { compteId }, create: { compteId, villeCle, jusqua }, update: { villeCle, jusqua } });
    },
    async effacerPresence(compteId) {
      await base.presenceQuiEstLa.deleteMany({ where: { compteId } });
    },
    async listerPresents(villeCle, maintenant, nombre) {
      const lignes = await base.presenceQuiEstLa.findMany({
        where: { villeCle, jusqua: { gt: maintenant }, compte: { profilCommunaute: { quiEstLa: true } } },
        select: { compteId: true }, orderBy: [{ jusqua: "desc" }, { compteId: "asc" }], take: nombre,
      });
      return lignes.map((l) => l.compteId);
    },
    async lireCoucous(moi, depuis) {
      const lignes = await base.coucouMiami.findMany({ where: { OR: [{ deId: moi }, { aId: moi }], creeLe: { gt: depuis } }, select: { deId: true, aId: true } });
      return {
        envoyes: new Set(lignes.filter((l) => l.deId === moi).map((l) => l.aId)),
        recus: new Set(lignes.filter((l) => l.aId === moi).map((l) => l.deId)),
      };
    },
    async ecrireCoucou(de, a, maintenant) {
      await base.coucouMiami.upsert({ where: { deId_aId: { deId: de, aId: a } }, create: { deId: de, aId: a, creeLe: maintenant }, update: { creeLe: maintenant } });
    },
    async effacerCoucous(compteId) {
      await base.coucouMiami.deleteMany({ where: { OR: [{ deId: compteId }, { aId: compteId }] } });
    },
  };
}
