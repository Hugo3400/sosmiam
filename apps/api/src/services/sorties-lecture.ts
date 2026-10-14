// Les lectures des sorties dans la base (contrat dans sorties-regles.ts) : les lignes d'une sortie, telle qu'un participant
// la voit (non-lus de sa discussion compris, avec la règle du pouls), ou telle qu'un invité la voit (« Tu viens ? »), et
// la liste de tes sorties. Utilisées aussi par les gestes de sorties.ts, dans leur transaction.
import { Prisma } from "../base-de-donnees/client-genere/client.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { assemblerSortie, type DonneesSortie, type LignesSortie } from "../fonctions/social/assembler-sortie.ts";
import { presenterInvitationSortie } from "../fonctions/social/presenter-invitation-sortie.ts";
import { presenterSortie } from "../fonctions/social/presenter-sortie.ts";
import type { SortieApi } from "../../../../packages/commun/src/types/sorties.ts";
import type { RelationsSociales } from "./relations-sociales-regles.ts";
import { MAX_COMPTEUR_POULS } from "./social-regles.ts";
import { estInvitationCachee, MAX_SORTIES_LISTEES, type ServicesSorties } from "./sorties-regles.ts";

/** Une connexion ou une transaction : les lectures servent dans les deux */
export type ClientSorties = Pick<Prisma.TransactionClient, "sortie" | "lieu">;

/** Ce qu'on lit d'une sortie : ses champs, ses invitations, ses propositions et leurs votes */
const CHAMPS_SORTIE = {
  id: true, titre: true, emoji: true, quand: true, finVote: true, organisateurId: true, lieuChoisiId: true, voteTermineLe: true,
  version: true, conversationId: true,
  invitations: { select: { compteId: true, statut: true, inviteParId: true, creeLe: true, reponduLe: true } },
  propositions: { select: { id: true, lieuId: true, proposeParId: true, votes: { select: { compteId: true } } }, orderBy: { id: "asc" } },
} satisfies Prisma.SortieSelect;

type LigneSortie = Prisma.SortieGetPayload<{ select: typeof CHAMPS_SORTIE }>;

/** Une sortie lue : ses lignes (pour retrouver sa propre invitation) et ses données rangées */
export type SortieLue = { lignes: LignesSortie; donnees: DonneesSortie };

/**
 * Non-lus de la discussion de chacune de ces conversations, pour `compteId` : la règle du pouls (social-pouls.ts) : les
 * messages d'un autre, plus récents que luJusqua et visibleApres, ni supprimés, ni masqués ou retirés par la modération,
 * ni d'une personne avec qui il y a un blocage ; 99 au plus.
 */
export function construireRequeteNonLusSorties(compteId: number, conversationIds: readonly number[]): Prisma.Sql {
  return Prisma.sql`
    SELECT mc.conversation_id AS "conversationId", (
      SELECT COUNT(*) FROM (
        SELECT 1 FROM messages_conversations m
        WHERE m.conversation_id = mc.conversation_id AND m.id > GREATEST(mc.lu_jusqua, mc.visible_apres)
          AND m.auteur_id IS DISTINCT FROM ${compteId}
          AND m.supprime_le IS NULL AND m.suspendu_le IS NULL AND m.retire_le IS NULL
          AND (m.auteur_id IS NULL OR m.auteur_id NOT IN (
            SELECT bloque_id FROM blocages WHERE bloqueur_id = ${compteId}
            UNION SELECT bloqueur_id FROM blocages WHERE bloque_id = ${compteId}
          ))
        LIMIT ${MAX_COMPTEUR_POULS}
      ) AS visibles
    )::int AS "nonLus"
    FROM membres_conversations mc
    WHERE mc.compte_id = ${compteId} AND mc.conversation_id IN (${Prisma.join([...conversationIds])})`;
}

export function creerLectureSorties(relations: RelationsSociales, base = baseDeDonnees) {
  /** Les lieux encore publiés parmi ceux proposés */
  async function lirePublies(client: ClientSorties, lignes: readonly LigneSortie[]): Promise<Set<number>> {
    const ids = [...new Set(lignes.flatMap((l) => l.propositions.map((p) => p.lieuId)))];
    if (ids.length === 0) return new Set();
    const lieux = await client.lieu.findMany({ where: { id: { in: ids }, statut: "publie" }, select: { id: true } });
    return new Set(lieux.map((l) => l.id));
  }
  function ranger(ligne: LigneSortie, publies: ReadonlySet<number>): SortieLue {
    const { invitations, propositions, ...sortie } = ligne;
    const lignes: LignesSortie = { sortie, invitations, propositions: propositions.map(({ votes, ...p }) => ({ ...p, votants: votes.map((v) => v.compteId) })) };
    return { lignes, donnees: assemblerSortie(lignes, publies) };
  }
  async function lirePlusieurs(client: ClientSorties, where: Prisma.SortieWhereInput, orderBy: Prisma.SortieOrderByWithRelationInput[], take: number): Promise<SortieLue[]> {
    const lignes = await client.sortie.findMany({ where, select: CHAMPS_SORTIE, orderBy, take });
    const publies = await lirePublies(client, lignes);
    return lignes.map((l) => ranger(l, publies));
  }
  /** Les non-lus de chaque discussion (conversationId → nombre) */
  async function compterNonLus(compteId: number, conversationIds: readonly number[]): Promise<Map<number, number>> {
    if (conversationIds.length === 0) return new Map();
    const lignes = await base.$queryRaw<{ conversationId: number; nonLus: number }[]>(construireRequeteNonLusSorties(compteId, conversationIds));
    return new Map(lignes.map((l) => [l.conversationId, l.nonLus]));
  }
  /** Toutes les personnes de ces sorties, en petit */
  const personnesDe = (sorties: readonly DonneesSortie[]) => relations.presenter(sorties.flatMap((d) => [
    ...d.participants, ...d.invites, ...(d.organisateurEffectif === null ? [] : [d.organisateurEffectif]),
    ...d.propositions.flatMap((p) => [...p.votants, ...(p.proposeParId === null ? [] : [p.proposeParId])]),
  ]));

  /** Une sortie, ou null si elle n'existe pas (dans `client` : une transaction qui l'a déjà verrouillée, ou la base) */
  async function lireUne(client: ClientSorties, sortieId: number): Promise<SortieLue | null> {
    const [lue] = await lirePlusieurs(client, { id: sortieId }, [{ id: "asc" }], 1);
    return lue ?? null;
  }

  /** Telles qu'un participant les voit */
  async function presenter(compteId: number, sorties: readonly DonneesSortie[], maintenant: Date): Promise<SortieApi[]> {
    if (sorties.length === 0) return [];
    const [personnes, { caches }, nonLus] = await Promise.all([
      personnesDe(sorties), relations.listerBlocages(compteId), compterNonLus(compteId, sorties.map((d) => d.conversationId)),
    ]);
    return sorties.map((d) => presenterSortie(d, { moi: compteId, personnes, caches, nonLus: nonLus.get(d.conversationId) ?? 0, maintenant }));
  }

  /** Une sortie telle qu'un participant la voit */
  async function presenterUne(compteId: number, sortie: DonneesSortie, maintenant: Date): Promise<SortieApi> {
    const [api] = await presenter(compteId, [sortie], maintenant);
    return api!;
  }

  /** La sortie si `compteId` y participe (invitation « accepte »), sinon null */
  async function lireParticipant(compteId: number, sortieId: number, client: ClientSorties = base): Promise<SortieLue | null> {
    const lue = await lireUne(client, sortieId);
    return lue && lue.lignes.invitations.some((i) => i.compteId === compteId && i.statut === "accepte") ? lue : null;
  }

  const lister: ServicesSorties["lister"] = async (compteId, maintenant) => {
    const masques = await base.elementMasque.findMany({ where: { compteId, cible: "sortie" }, select: { cibleId: true } });
    const exclues = masques.map((m) => Number(m.cibleId)).filter((id) => Number.isSafeInteger(id) && id > 0);
    const avec = (statut: string, aVenir: boolean): Prisma.SortieWhereInput => ({
      quand: aVenir ? { gt: maintenant } : { lte: maintenant },
      ...(exclues.length === 0 ? {} : { id: { notIn: exclues } }),
      invitations: { some: { compteId, statut } },
    });
    const [aVenir, passees, invitees, { caches }] = await Promise.all([
      lirePlusieurs(base, avec("accepte", true), [{ quand: "asc" }, { id: "asc" }], MAX_SORTIES_LISTEES),
      lirePlusieurs(base, avec("accepte", false), [{ quand: "desc" }, { id: "asc" }], MAX_SORTIES_LISTEES),
      lirePlusieurs(base, avec("invite", true), [{ quand: "asc" }, { id: "asc" }], MAX_SORTIES_LISTEES),
      relations.listerBlocages(compteId),
    ]);
    const sorties = [...aVenir, ...passees].slice(0, MAX_SORTIES_LISTEES).map((l) => l.donnees);
    const invitations = invitees.flatMap(({ lignes, donnees }) => {
      const mienne = lignes.invitations.find((i) => i.compteId === compteId && i.statut === "invite");
      return mienne && !estInvitationCachee(donnees, mienne, caches) ? [{ mienne, donnees }] : [];
    });
    const personnes = await relations.presenter(invitations.flatMap(({ mienne, donnees }) => [
      ...(mienne.inviteParId === null ? [] : [mienne.inviteParId]), ...(donnees.organisateurEffectif === null ? [] : [donnees.organisateurEffectif]),
    ]));
    return {
      sorties: await presenter(compteId, sorties, maintenant),
      invitations: invitations.map(({ mienne, donnees }) => presenterInvitationSortie(donnees, mienne, personnes)),
    };
  };

  const lire: ServicesSorties["lire"] = async (compteId, sortieId, version, maintenant) => {
    const lue = await lireUne(base, sortieId);
    const mienne = lue?.lignes.invitations.find((i) => i.compteId === compteId);
    if (!lue || !mienne || mienne.statut === "refuse") return null;
    const d = lue.donnees;
    if (mienne.statut === "invite") {
      const [personnes, { caches }] = await Promise.all([
        relations.presenter([...(mienne.inviteParId === null ? [] : [mienne.inviteParId]), ...(d.organisateurEffectif === null ? [] : [d.organisateurEffectif])]),
        relations.listerBlocages(compteId),
      ]);
      return estInvitationCachee(d, mienne, caches) ? null : { invitation: presenterInvitationSortie(d, mienne, personnes) };
    }
    if (version !== null && version === d.version) return { inchange: true, version };
    return { sortie: await presenterUne(compteId, d, maintenant) };
  };

  return { lireUne, presenter, presenterUne, lireParticipant, lister, lire };
}
