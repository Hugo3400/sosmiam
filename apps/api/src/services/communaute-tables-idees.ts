import type { StatutIdee } from "../../../../packages/commun/src/types/idees.ts";
import type { Prisma } from "../base-de-donnees/client-genere/client.ts";
import { CHAMPS_SORTIE_MIAMIS } from "./communaute-champs.ts";
import type { LigneSortieMiamis, TablesCommunaute } from "./communaute-regles.ts";

type Client = Prisma.TransactionClient;

type TablesIdees = Pick<TablesCommunaute,
  "listerIdees" | "lireIdee" | "trouverIdeeParCle" | "creerIdee" | "effacerIdee" | "voterIdee" | "listerVotantsRecents" | "listerCommentaires" | "lireCommentaire"
  | "creerCommentaire" | "effacerCommentaire" | "aimerCommentaire" | "lireActiviteRecente">;

const champsIdee = (moi: number) => ({
  id: true, auteurId: true, titre: true, detail: true, statut: true, reponseBrigade: true, reponduLe: true, ideeDuMois: true, publieeLe: true, suspendueLe: true, retireeLe: true, creeLe: true,
  votes: { where: { compteId: moi }, select: { compteId: true } },
  _count: { select: { votes: true, commentaires: { where: { masqueLe: null, suspenduLe: null, retireLe: null } } } },
}) satisfies Prisma.IdeeCommunauteSelect;

const champsCommentaire = (moi: number) => ({
  id: true, ideeId: true, auteurId: true, texte: true, reponseAId: true, masqueLe: true, suspenduLe: true, retireLe: true, creeLe: true,
  jaimes: { where: { compteId: moi }, select: { compteId: true } },
  _count: { select: { jaimes: true } },
}) satisfies Prisma.CommentaireIdeeCommunauteSelect;

type IdeeLue = Prisma.IdeeCommunauteGetPayload<{ select: ReturnType<typeof champsIdee> }>;
type CommentaireLu = Prisma.CommentaireIdeeCommunauteGetPayload<{ select: ReturnType<typeof champsCommentaire> }>;

const versIdee = ({ votes, _count, statut, ...l }: IdeeLue) => ({ ...l, statut: statut as StatutIdee, votes: _count.votes, aVote: votes.length > 0, commentaires: _count.commentaires });
const versCommentaire = ({ jaimes, _count, ...l }: CommentaireLu) => ({ ...l, jaimes: _count.jaimes, aime: jaimes.length > 0 });

export function creerTablesIdees(base: Client): TablesIdees {
  return {
    async listerIdees(moi, nombre) {
      const lignes = await base.ideeCommunaute.findMany({
        where: { retireeLe: null, OR: [{ statut: { not: "en-relecture" }, suspendueLe: null }, { auteurId: moi }] },
        select: champsIdee(moi), orderBy: [{ votes: { _count: "desc" } }, { creeLe: "desc" }], take: nombre,
      });
      return lignes.map(versIdee);
    },
    async lireIdee(id, moi) {
      const ligne = await base.ideeCommunaute.findUnique({ where: { id }, select: champsIdee(moi) });
      return ligne ? versIdee(ligne) : null;
    },
    async trouverIdeeParCle(titreCle) {
      return (await base.ideeCommunaute.findFirst({ where: { titreCle }, select: { id: true } }))?.id ?? null;
    },
    async creerIdee(auteurId, idee, titreCle, maintenant) {
      return (await base.ideeCommunaute.create({ data: { auteurId, titre: idee.titre, detail: idee.detail, titreCle, modifieLe: maintenant, creeLe: maintenant }, select: { id: true } })).id;
    },
    async effacerIdee(id) {
      await base.ideeCommunaute.deleteMany({ where: { id } });
    },
    async voterIdee(ideeId, compteId, oui, maintenant) {
      if (oui) await base.voteIdeeCommunaute.createMany({ data: [{ ideeId, compteId, creeLe: maintenant }], skipDuplicates: true });
      else await base.voteIdeeCommunaute.deleteMany({ where: { ideeId, compteId } });
    },
    async listerVotantsRecents(ideeId, nombre) {
      const lignes = await base.voteIdeeCommunaute.findMany({ where: { ideeId }, select: { compteId: true }, orderBy: [{ creeLe: "desc" }, { compteId: "asc" }], take: nombre });
      return lignes.map((l) => l.compteId);
    },
    async listerCommentaires(ideeId, moi, nombre) {
      const lignes = await base.commentaireIdeeCommunaute.findMany({ where: { ideeId }, select: champsCommentaire(moi), orderBy: [{ creeLe: "asc" }, { id: "asc" }], take: nombre });
      return lignes.map(versCommentaire);
    },
    async lireCommentaire(id, moi) {
      const ligne = await base.commentaireIdeeCommunaute.findUnique({ where: { id }, select: champsCommentaire(moi) });
      return ligne ? versCommentaire(ligne) : null;
    },
    async creerCommentaire(ideeId, auteurId, texte, reponseAId, maintenant) {
      return (await base.commentaireIdeeCommunaute.create({ data: { ideeId, auteurId, texte, reponseAId, creeLe: maintenant }, select: { id: true } })).id;
    },
    async effacerCommentaire(id) {
      await base.commentaireIdeeCommunaute.deleteMany({ where: { id } });
    },
    async aimerCommentaire(commentaireId, compteId, oui, maintenant) {
      if (oui) await base.jaimeCommentaireIdee.createMany({ data: [{ commentaireId, compteId, creeLe: maintenant }], skipDuplicates: true });
      else await base.jaimeCommentaireIdee.deleteMany({ where: { commentaireId, compteId } });
    },
    async lireActiviteRecente(villeCle, depuis, nombre) {
      const publiee = { statut: { not: "en-relecture" }, suspendueLe: null, retireeLe: null };
      const [idees, reponses, votes, sorties, arrivees] = await Promise.all([
        base.ideeCommunaute.findMany({ where: { ...publiee, publieeLe: { gte: depuis } }, select: { id: true, auteurId: true, titre: true, publieeLe: true }, orderBy: { publieeLe: "desc" }, take: nombre }),
        base.ideeCommunaute.findMany({ where: { ...publiee, reponduLe: { gte: depuis } }, select: { id: true, titre: true, reponduLe: true }, orderBy: { reponduLe: "desc" }, take: nombre }),
        base.voteIdeeCommunaute.groupBy({ by: ["compteId"], where: { creeLe: { gte: depuis }, idee: publiee }, _count: { _all: true }, _max: { creeLe: true } }),
        villeCle ? base.sortieDesMiamis.findMany({ where: { villeCle, annuleeLe: null, retireeLe: null, creeLe: { gte: depuis } }, select: CHAMPS_SORTIE_MIAMIS, orderBy: { creeLe: "desc" }, take: nombre }) : [],
        villeCle
          ? base.participationSortieDesMiamis.findMany({
            where: { statut: "accepte", decideLe: { gte: depuis }, sortie: { villeCle, annuleeLe: null, retireeLe: null } },
            select: { sortieId: true, compteId: true, decideLe: true, sortie: { select: CHAMPS_SORTIE_MIAMIS } }, orderBy: { decideLe: "desc" }, take: nombre,
          })
          : [],
      ]);
      const toutesSorties = new Map<number, LigneSortieMiamis>([...sorties, ...arrivees.map((a) => a.sortie)].map((s) => [s.id, s]));
      return {
        idees: idees.map((i) => ({ ...i, publieeLe: i.publieeLe! })),
        reponses: reponses.map((r) => ({ ...r, reponduLe: r.reponduLe! })),
        votes: votes.map((v) => ({ compteId: v.compteId, nombre: v._count._all, dernier: v._max.creeLe! })).sort((a, b) => b.dernier.getTime() - a.dernier.getTime()).slice(0, nombre),
        sorties: [...toutesSorties.values()],
        arrivees: arrivees.map((a) => ({ sortieId: a.sortieId, compteId: a.compteId, decideLe: a.decideLe! })),
      };
    },
  };
}
