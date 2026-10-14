// Les sorties dans la base (contrat et règles dans sorties-regles.ts ; lectures dans sorties-lecture.ts). Chaque geste
// passe dans une transaction qui verrouille la ligne de la sortie (SELECT … FOR UPDATE) : les 15 places, les 8
// propositions et la fin du vote se comptent sans course, et la tâche de la minute ne termine jamais un vote en même temps
// qu'un geste. Ordre des verrous, partout : les comptes (verrouillerComptesDuGeste : celui qui agit, et ceux qu'il invite),
// puis la sortie, puis sa conversation (la tâche de la minute, qui n'a personne derrière elle, commence à la sortie). Toute
// écriture que voient les participants fait version + 1 et modifieLe (la sortie) ; un membre de plus ou de moins aussi
// pour la conversation (le pouls, la relecture par version).
import { choisirLieuGagnant } from "../../../../packages/commun/src/fonctions/sorties/choisir-lieu-gagnant.ts";
import { MAX_PARTICIPANTS_SORTIE, MAX_PROPOSITIONS_SORTIE, MAX_SORTIES_A_VENIR } from "../../../../packages/commun/src/regles/potes.ts";
import { Prisma } from "../base-de-donnees/client-genere/client.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { construireEffetsSortie } from "../fonctions/social/construire-effets-sortie.ts";
import { effacerConversations, type ConversationsEffacees } from "./effacer-conversations.ts";
import type { EffetSocial } from "./effets-sociaux-regles.ts";
import type { RelationsSociales } from "./relations-sociales-regles.ts";
import { creerLectureSorties, type SortieLue } from "./sorties-lecture.ts";
import { creerMemoireSonsInvitations, SORTIES_PAR_PASSAGE, type RefusSortie, type ServicesSorties } from "./sorties-regles.ts";
import type { StockageMediasChat } from "./stockage-medias-chat.ts";

type Transaction = Prisma.TransactionClient;

const refus = (erreur: RefusSortie) => ({ ok: false, erreur }) as const;

/** La clé Idempotency-Key a été notée par une autre demande au même moment : on annule la transaction, puis on relit */
class CleDejaNotee extends Error {}

/**
 * Verrou des comptes d'un geste (SELECT … FOR NO KEY UPDATE, dans l'ordre des id), AVANT celui de la sortie. Un blocage
 * (bande.ts) verrouille ses deux comptes FOR UPDATE : l'un attend l'autre, et la bande et les blocages relus ensuite sont à
 * jour (rien ne se crée au moment d'un blocage). « NO KEY » : les clés étrangères des lignes écrites sous le verrou d'une
 * sortie (votes, propositions, membres) prennent FOR KEY SHARE sur leur compte ; un FOR UPDATE les ferait attendre, et deux
 * gestes de la même sortie pourraient s'attendre l'un l'autre.
 */
async function verrouillerComptesDuGeste(tx: Transaction, compteIds: readonly number[]): Promise<void> {
  const ids = [...new Set(compteIds)].filter((id) => Number.isSafeInteger(id) && id > 0).sort((a, b) => a - b);
  if (ids.length > 0) await tx.$queryRaw`SELECT id FROM comptes WHERE id IN (${Prisma.join(ids)}) ORDER BY id FOR NO KEY UPDATE`;
}

export function creerSorties(o: { relations: RelationsSociales; medias: StockageMediasChat; base?: typeof baseDeDonnees }): ServicesSorties {
  const { relations, medias } = o;
  const base = o.base ?? baseDeDonnees;
  const lecture = creerLectureSorties(relations, base);
  const sons = creerMemoireSonsInvitations();

  const verrouiller = (tx: Transaction, sortieId: number) => tx.$queryRaw`SELECT id FROM sorties WHERE id = ${sortieId} FOR UPDATE`;
  /** Verrouille puis lit la sortie, dans la transaction ; null : elle n'existe pas (ou plus) */
  async function lireVerrouillee(tx: Transaction, sortieId: number): Promise<SortieLue | null> {
    await verrouiller(tx, sortieId);
    return lecture.lireUne(tx, sortieId);
  }
  /** Mon invitation : « accepte », « invite », « refuse », ou rien */
  const statutDe = (lue: SortieLue, compteId: number) => lue.lignes.invitations.find((i) => i.compteId === compteId)?.statut ?? null;
  /**
   * Une écriture que voient les participants (version + 1, modifieLe). L'organisateur qui a la main est écrit s'il a changé
   * (son compte supprimé vide la colonne) : le blocage (bande.ts) et le plafond des 20 sorties le retrouvent
   */
  function marquer(tx: Transaction, lue: SortieLue, maintenant: Date, data: Prisma.SortieUncheckedUpdateInput = {}) {
    const { id, organisateurId, organisateurEffectif } = lue.donnees;
    const aligne = organisateurEffectif !== null && organisateurEffectif !== organisateurId ? { organisateurId: organisateurEffectif } : {};
    return tx.sortie.update({ where: { id }, data: { ...aligne, ...data, version: { increment: 1 }, modifieLe: maintenant }, select: { id: true } });
  }
  const marquerConversation = (tx: Transaction, conversationId: number, maintenant: Date) =>
    tx.conversation.update({ where: { id: conversationId }, data: { version: { increment: 1 }, modifieLe: maintenant }, select: { id: true } });
  /** Des potes de MA bande, sans blocage dans un sens ou dans l'autre, relus sous le verrou */
  async function sontDeMaBande(tx: Transaction, compteId: number, autres: readonly number[]): Promise<boolean> {
    if (autres.length === 0) return true;
    if ((await tx.membreBande.count({ where: { compteId, poteId: { in: [...autres] } } })) !== autres.length) return false;
    for (const autre of autres) if (await relations.bloqueEntre(compteId, autre, tx)) return false;
    return true;
  }
  /** Un blocage entre cet invité et l'organisateur qui a la main, ou celui qui l'a invité (relu dans la transaction) */
  async function aUnBlocageAvecSesHotes(tx: Transaction, lue: SortieLue, compteId: number): Promise<boolean> {
    const mienne = lue.lignes.invitations.find((i) => i.compteId === compteId);
    for (const autre of new Set([lue.donnees.organisateurEffectif, mienne?.inviteParId ?? null])) {
      if (autre !== null && autre !== compteId && (await relations.bloqueEntre(compteId, autre, tx))) return true;
    }
    return false;
  }
  /** Sort de la sortie : invitation, adhésion à la discussion et votes */
  async function oublierParticipant(tx: Transaction, lue: SortieLue, compteId: number) {
    const { id, conversationId } = lue.donnees;
    await tx.invitationSortie.deleteMany({ where: { sortieId: id, compteId } });
    await tx.membreConversation.deleteMany({ where: { conversationId, compteId } });
    await tx.voteSortie.deleteMany({ where: { compteId, proposition: { sortieId: id } } });
  }
  /** Les effets d'une invitation : la cloche, et le téléphone de ceux qui le veulent (pas deux fois en 24 h pour la même sortie) */
  async function effetsInvitation(sortieId: number, titre: string, acteurId: number, invites: readonly number[], maintenant: Date): Promise<EffetSocial[]> {
    if (invites.length === 0) return [];
    const [personnes, veulent] = await Promise.all([relations.presenter([acteurId]), relations.lirePushSocial(invites)]);
    const pushAutorises = sons.retenir(sortieId, veulent, maintenant);
    return construireEffetsSortie({ quoi: "invitation", sortieId, titre, acteur: { id: acteurId, prenom: personnes.get(acteurId)?.prenom ?? "" }, destinataires: invites, pushAutorises });
  }
  /** Le lieu retenu, dans la transaction (la sortie déjà verrouillée) : rend de quoi prévenir les participants */
  async function retenirLieu(tx: Transaction, lue: SortieLue, maintenant: Date) {
    const gagnant = choisirLieuGagnant(lue.donnees.propositions.map((p) => ({ lieuId: p.lieuId, votes: p.votants.length })));
    await marquer(tx, lue, maintenant, { lieuChoisiId: gagnant, voteTermineLe: maintenant });
    return { gagnant, sortieId: lue.donnees.id, titre: lue.donnees.titre, participants: lue.donnees.participants };
  }
  /** « sortie-lieu-choisi » aux participants (sans l'acteur, ni ceux qui ont un blocage avec lui) */
  async function effetsLieuChoisi(fin: { gagnant: number | null; sortieId: number; titre: string; participants: number[] }, acteurId: number | null): Promise<EffetSocial[]> {
    if (fin.gagnant === null) return [];
    const caches = acteurId === null ? new Set<number>() : (await relations.listerBlocages(acteurId)).caches;
    const destinataires = fin.participants.filter((id) => id !== acteurId && !caches.has(id));
    const [lieu, pushAutorises] = await Promise.all([
      base.lieu.findUnique({ where: { id: fin.gagnant }, select: { nom: true } }),
      relations.lirePushSocial(destinataires),
    ]);
    return construireEffetsSortie({
      quoi: "lieu-choisi", sortieId: fin.sortieId, titre: fin.titre, lieu: { id: fin.gagnant, nom: lieu?.nom ?? "le lieu retenu" }, acteurId, destinataires, pushAutorises,
    });
  }
  /** La sortie relue hors transaction, telle qu'un participant la voit */
  async function rendre(compteId: number, sortieId: number, maintenant: Date) {
    const lue = await lecture.lireParticipant(compteId, sortieId);
    return lue ? lecture.presenterUne(compteId, lue.donnees, maintenant) : null;
  }

  const sorties: ServicesSorties = {
    lister: lecture.lister,
    lire: lecture.lire,

    async creer(compteId, s, cle, maintenant) {
      const rejouer = async (sortieId: number) => {
        const sortie = await rendre(compteId, sortieId, maintenant);
        return sortie ? { ok: true as const, sortie, cree: false, effets: [] as EffetSocial[] } : refus("sortie-inconnue");
      };
      const deja = await relations.lireIdempotence(compteId, cle, "sortie");
      if (deja !== null) return rejouer(deja);
      const invites = [...new Set(s.invites)].filter((id) => id !== compteId);
      const lieux = [...new Set(s.lieux)];
      let resultat: { ok: false; erreur: RefusSortie } | { deja: number } | { sortieId: number };
      try {
        resultat = await base.$transaction(async (tx) => {
          // Sous le verrou des comptes : deux créations en même temps ne dépassent pas les 20 sorties à venir, la même clé
          // rejouée attend la première, et un blocage entre l'organisateur et un invité attend (ou est vu)
          await verrouillerComptesDuGeste(tx, [compteId, ...invites]);
          const dejaFaite = await relations.lireIdempotence(compteId, cle, "sortie", tx);
          if (dejaFaite !== null) return { deja: dejaFaite };
          if (invites.length === 0 || !(await sontDeMaBande(tx, compteId, invites))) return refus("pas-dans-la-bande");
          if ((await tx.lieu.count({ where: { id: { in: lieux }, statut: "publie" } })) !== lieux.length) return refus("lieu-inconnu");
          if ((await tx.sortie.count({ where: { organisateurId: compteId, quand: { gt: maintenant } } })) >= MAX_SORTIES_A_VENIR) return refus("trop-de-sorties");
          const conversation = await tx.conversation.create({
            data: {
              type: "sortie", emoji: s.emoji, creeParId: compteId, dernierMessageLe: maintenant, modifieLe: maintenant, creeLe: maintenant,
              membres: { create: [{ compteId, arriveLe: maintenant }] },
            },
            select: { id: true },
          });
          const sortie = await tx.sortie.create({
            data: {
              conversationId: conversation.id, organisateurId: compteId, titre: s.titre, emoji: s.emoji, quand: s.quand, finVote: s.finVote,
              modifieLe: maintenant, creeLe: maintenant,
              invitations: {
                create: [
                  { compteId, statut: "accepte", creeLe: maintenant, reponduLe: maintenant },
                  ...invites.map((id) => ({ compteId: id, inviteParId: compteId, statut: "invite", creeLe: maintenant })),
                ],
              },
            },
            select: { id: true },
          });
          // Une à une, dans l'ordre : le premier lieu proposé l'emporte à égalité
          for (const lieuId of lieux) {
            await tx.propositionSortie.create({
              data: { sortieId: sortie.id, lieuId, proposeParId: compteId, creeLe: maintenant, votes: { create: [{ compteId, creeLe: maintenant }] } },
              select: { id: true },
            });
          }
          if (!(await relations.noterIdempotence(compteId, cle, "sortie", sortie.id, maintenant, tx))) throw new CleDejaNotee();
          return { sortieId: sortie.id };
        });
      } catch (erreur) {
        if (!(erreur instanceof CleDejaNotee)) throw erreur;
        const relue = await relations.lireIdempotence(compteId, cle, "sortie");
        return relue === null ? refus("cle-deja-prise") : rejouer(relue);
      }
      if ("ok" in resultat) return resultat;
      if ("deja" in resultat) return rejouer(resultat.deja);
      const sortie = await rendre(compteId, resultat.sortieId, maintenant);
      if (!sortie) return refus("sortie-inconnue");
      return { ok: true, sortie, cree: true, effets: await effetsInvitation(resultat.sortieId, s.titre, compteId, invites, maintenant) };
    },

    async repondre(compteId, sortieId, vient, maintenant) {
      const suite = await base.$transaction(async (tx) => {
        await verrouillerComptesDuGeste(tx, [compteId]);
        const lue = await lireVerrouillee(tx, sortieId);
        const statut = lue ? statutDe(lue, compteId) : null;
        if (!lue || statut === null) return refus("sortie-inconnue");
        if (statut === "refuse") return vient ? refus("sortie-inconnue") : ("rien" as const);
        if (statut === "accepte") return vient ? ("rendre" as const) : ("quitter" as const);
        // Un blocage avec l'organisateur qui a la main (ou celui qui t'a invité), relu sous le verrou de ton compte : ton
        // invitation n'existe plus (bande.ts ne la retrouve pas quand l'organisateur est parti avec son compte)
        if (vient && (await aUnBlocageAvecSesHotes(tx, lue, compteId))) {
          await tx.invitationSortie.deleteMany({ where: { sortieId, compteId, statut: "invite" } });
          await marquer(tx, lue, maintenant);
          return refus("sortie-inconnue");
        }
        if (lue.donnees.quand.getTime() <= maintenant.getTime()) return refus("sortie-passee");
        await tx.invitationSortie.update({ where: { sortieId_compteId: { sortieId, compteId } }, data: { statut: vient ? "accepte" : "refuse", reponduLe: maintenant } });
        await marquer(tx, lue, maintenant);
        if (!vient) return "rien" as const;
        // Il lit toute la discussion, depuis le début (visibleApres 0)
        await tx.membreConversation.createMany({ data: [{ conversationId: lue.donnees.conversationId, compteId, arriveLe: maintenant }], skipDuplicates: true });
        await marquerConversation(tx, lue.donnees.conversationId, maintenant);
        return "rendre" as const;
      });
      if (typeof suite === "object") return suite;
      if (suite === "quitter") await sorties.quitter(compteId, sortieId, maintenant);
      if (suite !== "rendre") return { ok: true, sortie: null };
      const sortie = await rendre(compteId, sortieId, maintenant);
      return sortie ? { ok: true, sortie } : refus("sortie-inconnue");
    },

    async inviter(compteId, sortieId, invites, maintenant) {
      const demandes = [...new Set(invites)].filter((id) => id !== compteId);
      const resultat = await base.$transaction(async (tx) => {
        // Les comptes d'abord : un blocage entre l'organisateur et un invité attend la fin du geste (il efface alors
        // l'invitation), ou le geste l'attend et le voit
        await verrouillerComptesDuGeste(tx, [compteId, ...demandes]);
        const lue = await lireVerrouillee(tx, sortieId);
        const statut = lue ? statutDe(lue, compteId) : null;
        if (!lue || statut === null || statut === "refuse") return refus("sortie-inconnue");
        const d = lue.donnees;
        if (d.organisateurEffectif !== compteId) return refus("reserve-a-l-organisateur");
        if (d.quand.getTime() <= maintenant.getTime()) return refus("sortie-passee");
        if (!(await sontDeMaBande(tx, compteId, demandes))) return refus("pas-dans-la-bande");
        // Déjà là, ou refus gardé jusqu'à la date : sautés sans le dire
        const connus = new Set(lue.lignes.invitations.map((i) => i.compteId));
        const nouveaux = demandes.filter((id) => !connus.has(id));
        if (d.participants.length + d.invites.length + nouveaux.length > MAX_PARTICIPANTS_SORTIE) return refus("sortie-pleine");
        if (nouveaux.length > 0) {
          await tx.invitationSortie.createMany({ data: nouveaux.map((id) => ({ sortieId, compteId: id, inviteParId: compteId, statut: "invite", creeLe: maintenant })), skipDuplicates: true });
          await marquer(tx, lue, maintenant);
        }
        return { nouveaux, titre: d.titre };
      });
      if ("ok" in resultat) return resultat;
      const sortie = await rendre(compteId, sortieId, maintenant);
      if (!sortie) return refus("sortie-inconnue");
      return { ok: true, sortie, effets: await effetsInvitation(sortieId, resultat.titre, compteId, resultat.nouveaux, maintenant) };
    },

    async retirerParticipant(compteId, sortieId, personne, maintenant) {
      const resultat = await base.$transaction(async (tx) => {
        await verrouillerComptesDuGeste(tx, [compteId]);
        const lue = await lireVerrouillee(tx, sortieId);
        const statut = lue ? statutDe(lue, compteId) : null;
        if (!lue || statut === null || statut === "refuse") return refus("sortie-inconnue");
        if (lue.donnees.organisateurEffectif !== compteId) return refus("reserve-a-l-organisateur");
        if (personne === compteId) return "quitter" as const;
        const sien = personne === null ? null : statutDe(lue, personne);
        if (personne === null || sien === null || sien === "refuse") return refus("personne-inconnue");
        await oublierParticipant(tx, lue, personne);
        await marquer(tx, lue, maintenant);
        if (sien === "accepte") await marquerConversation(tx, lue.donnees.conversationId, maintenant);
        return "fait" as const;
      });
      if (typeof resultat === "object") return resultat;
      if (resultat === "quitter") await sorties.quitter(compteId, sortieId, maintenant);
      return { ok: true };
    },

    async proposer(compteId, sortieId, lieuId, maintenant) {
      const resultat = await base.$transaction(async (tx) => {
        await verrouillerComptesDuGeste(tx, [compteId]);
        const lue = await lireVerrouillee(tx, sortieId);
        if (!lue || statutDe(lue, compteId) !== "accepte") return refus("sortie-inconnue");
        const d = lue.donnees;
        if (d.voteTermineLe !== null || d.finVote.getTime() <= maintenant.getTime()) return refus("vote-termine");
        if ((await tx.lieu.count({ where: { id: lieuId, statut: "publie" } })) === 0) return refus("lieu-inconnu");
        if (lue.lignes.propositions.some((p) => p.lieuId === lieuId)) return { deja: true };
        if (lue.lignes.propositions.length >= MAX_PROPOSITIONS_SORTIE) return refus("max-propositions");
        await tx.propositionSortie.create({
          data: { sortieId, lieuId, proposeParId: compteId, creeLe: maintenant, votes: { create: [{ compteId, creeLe: maintenant }] } },
          select: { id: true },
        });
        await marquer(tx, lue, maintenant);
        return { deja: false };
      });
      if ("ok" in resultat) return resultat;
      const sortie = await rendre(compteId, sortieId, maintenant);
      return sortie ? { ok: true, sortie, deja: resultat.deja } : refus("sortie-inconnue");
    },

    async voter(compteId, sortieId, lieuId, oui, maintenant) {
      const resultat = await base.$transaction(async (tx) => {
        await verrouillerComptesDuGeste(tx, [compteId]);
        const lue = await lireVerrouillee(tx, sortieId);
        if (!lue || statutDe(lue, compteId) !== "accepte") return refus("sortie-inconnue");
        const d = lue.donnees;
        if (d.voteTermineLe !== null || d.finVote.getTime() <= maintenant.getTime()) return refus("vote-termine");
        const proposition = lue.lignes.propositions.find((p) => p.lieuId === lieuId);
        // Un lieu qui n'est plus publié ne se vote plus (il n'est plus montré)
        if (!proposition || !d.propositions.some((p) => p.lieuId === lieuId)) return oui ? refus("lieu-inconnu") : { change: false };
        const change = oui
          ? (await tx.voteSortie.createMany({ data: [{ propositionId: proposition.id, compteId, creeLe: maintenant }], skipDuplicates: true })).count > 0
          : (await tx.voteSortie.deleteMany({ where: { propositionId: proposition.id, compteId } })).count > 0;
        if (change) await marquer(tx, lue, maintenant);
        return { change };
      });
      if ("ok" in resultat) return resultat;
      const sortie = await rendre(compteId, sortieId, maintenant);
      return sortie ? { ok: true, sortie } : refus("sortie-inconnue");
    },

    async terminerVote(compteId, sortieId, maintenant) {
      const resultat = await base.$transaction(async (tx) => {
        await verrouillerComptesDuGeste(tx, [compteId]);
        const lue = await lireVerrouillee(tx, sortieId);
        if (!lue || statutDe(lue, compteId) !== "accepte") return refus("sortie-inconnue");
        if (lue.donnees.organisateurEffectif !== compteId) return refus("reserve-a-l-organisateur");
        if (lue.donnees.voteTermineLe !== null) return refus("vote-termine");
        return { fin: await retenirLieu(tx, lue, maintenant) };
      });
      if ("ok" in resultat) return resultat;
      const sortie = await rendre(compteId, sortieId, maintenant);
      if (!sortie) return refus("sortie-inconnue");
      return { ok: true, sortie, effets: await effetsLieuChoisi(resultat.fin, compteId) };
    },

    async quitter(compteId, sortieId, maintenant) {
      const efface: ConversationsEffacees | null = await base.$transaction(async (tx) => {
        await verrouillerComptesDuGeste(tx, [compteId]);
        const lue = await lireVerrouillee(tx, sortieId);
        const statut = lue ? statutDe(lue, compteId) : null;
        if (!lue || statut === null || statut === "refuse") return null;
        if (statut === "invite") {
          await tx.invitationSortie.update({ where: { sortieId_compteId: { sortieId, compteId } }, data: { statut: "refuse", reponduLe: maintenant } });
          await marquer(tx, lue, maintenant);
          return null;
        }
        await oublierParticipant(tx, lue, compteId);
        const reste = await lecture.lireUne(tx, sortieId);
        if (!reste || reste.donnees.participants.length === 0) return effacerConversations(tx, [lue.donnees.conversationId], medias);
        // L'organisateur qui part (ou parti avec son compte) passe la main au plus ancien participant (marquer l'écrit)
        await marquer(tx, reste, maintenant);
        await marquerConversation(tx, lue.donnees.conversationId, maintenant);
        return null;
      });
      // Une fois la transaction validée : les photos et notes vocales de la discussion quittent le disque
      if (efface) await efface.apresTransaction(base);
    },

    async annuler(compteId, sortieId) {
      const resultat = await base.$transaction(async (tx) => {
        await verrouillerComptesDuGeste(tx, [compteId]);
        const lue = await lireVerrouillee(tx, sortieId);
        const statut = lue ? statutDe(lue, compteId) : null;
        if (!lue || statut === null || statut === "refuse") return refus("sortie-inconnue");
        const d = lue.donnees;
        if (d.organisateurEffectif !== compteId) return refus("reserve-a-l-organisateur");
        const efface = await effacerConversations(tx, [d.conversationId], medias);
        return { efface, titre: d.titre, destinataires: [...d.participants, ...d.invites] };
      });
      if ("ok" in resultat) return resultat;
      await resultat.efface.apresTransaction(base);
      return { ok: true, effets: construireEffetsSortie({ quoi: "annulee", sortieId, titre: resultat.titre, acteurId: compteId, destinataires: resultat.destinataires }) };
    },

    async terminerVotesEchus(maintenant) {
      const echues = await base.sortie.findMany({
        where: { voteTermineLe: null, finVote: { lte: maintenant } },
        select: { id: true },
        orderBy: [{ finVote: "asc" }, { id: "asc" }],
        take: SORTIES_PAR_PASSAGE,
      });
      const effets: EffetSocial[] = [];
      let terminees = 0;
      let echecs = 0;
      for (const { id } of echues) {
        try {
          const fin = await base.$transaction(async (tx) => {
            const lue = await lireVerrouillee(tx, id);
            // Terminée entre-temps (par l'organisateur), ou annulée : rien à faire
            if (!lue || lue.donnees.voteTermineLe !== null) return null;
            return retenirLieu(tx, lue, maintenant);
          });
          if (!fin) continue;
          terminees += 1;
          effets.push(...(await effetsLieuChoisi(fin, null)));
        } catch {
          // Réessayée au passage suivant ; les autres sorties ne l'attendent pas (rien de personnel au journal : la tâche compte)
          echecs += 1;
        }
      }
      return { terminees, echecs, effets };
    },
  };
  return sorties;
}
