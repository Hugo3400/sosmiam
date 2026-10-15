// Les événements publiés par les lieux (concerts, quiz, dégustations…), vus par l'équipe SOS Miam dans le logiciel de
// gestion (demandé par Hugo le 15 octobre 2026) : les voir, et suspendre celui qui pose problème (faux, hors sujet, alcool
// mis en avant). Un événement suspendu disparaît de l'app (evenements.ts ne montre que suspendu: false), rien n'est effacé.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import type { Prisma } from "../../base-de-donnees/client-genere/client.ts";

export type VueEvenements = "a-venir" | "passes" | "suspendus";
const PAR_PAGE = 30;

/** Les événements d'une vue (à venir, passés, suspendus), éventuellement d'une ville, avec leur lieu et leurs intérêts */
export async function listerEvenementsGestion({ vue, ville, page }: { vue: VueEvenements; ville: string; page: number }, maintenant = new Date()) {
  // À venir : pas encore fini (fin, sinon début ; « chaque semaine » jusqu'à hebdoJusqua)
  const aVenir: Prisma.EvenementLieuWhereInput = { OR: [{ fin: { gte: maintenant } }, { fin: null, debut: { gte: maintenant } }, { hebdoJusqua: { gte: maintenant } }] };
  const where: Prisma.EvenementLieuWhereInput = {
    ...(vue === "suspendus" ? { suspendu: true } : { suspendu: false, ...(vue === "a-venir" ? aVenir : { NOT: aVenir }) }),
    ...(ville ? { lieu: { ville: { equals: ville, mode: "insensitive" } } } : {}),
  };
  const [total, evenements, suspendus] = await Promise.all([
    baseDeDonnees.evenementLieu.count({ where }),
    baseDeDonnees.evenementLieu.findMany({
      where,
      orderBy: { debut: vue === "a-venir" ? "asc" : "desc" },
      skip: (Math.max(1, page) - 1) * PAR_PAGE,
      take: PAR_PAGE,
      select: {
        id: true, titre: true, type: true, description: true, debut: true, fin: true, hebdoJusqua: true, tarif: true, prixCentimes: true,
        places: true, alcool: true, creeLe: true, annuleLe: true, suspendu: true, compteId: true,
        lieu: { select: { id: true, nom: true, emoji: true, ville: true } },
        _count: { select: { interets: true } },
      },
    }),
    baseDeDonnees.evenementLieu.count({ where: { suspendu: true } }),
  ]);
  return { total, parPage: PAR_PAGE, suspendus, evenements };
}

/** Suspend (ou rétablit) un événement ; null s'il n'existe pas. Rend son lieu, pour le journal. */
export async function suspendreEvenement(id: number, suspendu: boolean) {
  const evenement = await baseDeDonnees.evenementLieu.findUnique({ where: { id }, select: { lieuId: true } });
  if (!evenement) return null;
  await baseDeDonnees.evenementLieu.update({ where: { id }, data: { suspendu } });
  return evenement;
}
