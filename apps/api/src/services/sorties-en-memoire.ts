// Double en mémoire des sorties (contrat dans sorties-regles.ts), posé sur les tables partagées : mêmes règles que
// sorties.ts. Une seule demande avance à la fois entre deux await : tout est vérifié AVANT d'écrire (pas de transaction à
// annuler). Les cascades de l'effacement passent par effacerConversationsEnMemoire, comme la base.
import { choisirLieuGagnant } from "../../../../packages/commun/src/fonctions/sorties/choisir-lieu-gagnant.ts";
import { MAX_PARTICIPANTS_SORTIE, MAX_PROPOSITIONS_SORTIE, MAX_SORTIES_A_VENIR } from "../../../../packages/commun/src/regles/potes.ts";
import type { Sortie } from "../base-de-donnees/client-genere/client.ts";
import { assemblerSortie, type DonneesSortie } from "../fonctions/social/assembler-sortie.ts";
import { construireEffetsSortie } from "../fonctions/social/construire-effets-sortie.ts";
import { presenterInvitationSortie } from "../fonctions/social/presenter-invitation-sortie.ts";
import { presenterSortie } from "../fonctions/social/presenter-sortie.ts";
import { lireAppCliente } from "../middlewares/app-cliente.ts";
import type { EffetSocial } from "./effets-sociaux-regles.ts";
import type { RelationsSociales } from "./relations-sociales-regles.ts";
import { MAX_COMPTEUR_POULS } from "./social-regles.ts";
import {
  creerMemoireSonsInvitations, estInvitationCachee, MAX_SORTIES_LISTEES, SORTIES_PAR_PASSAGE, type RefusSortie, type ServicesSorties,
} from "./sorties-regles.ts";
import type { StockageMediasChat } from "./stockage-medias-chat.ts";
import { bloquesEnMemoire, effacerConversationsEnMemoire, listerCachesEnMemoire, prendreId, type TablesSociales } from "./tables-sociales-en-memoire.ts";

const refus = (erreur: RefusSortie) => ({ ok: false, erreur }) as const;
/** Retire d'un tableau, sur place, les lignes qui répondent à `quoi` (comme un DELETE) */
function retirerLignes<T>(lignes: T[], quoi: (ligne: T) => boolean): void {
  for (let i = lignes.length - 1; i >= 0; i--) if (quoi(lignes[i]!)) lignes.splice(i, 1);
}

export function creerSortiesEnMemoire(tables: TablesSociales, relations: RelationsSociales, medias: Pick<StockageMediasChat, "supprimer">): ServicesSorties {
  const publie = (lieuId: number) => tables.lieux.get(lieuId)?.statut === "publie";
  const estPote = (a: number, b: number) => tables.bande.some((l) => l.compteId === a && l.poteId === b);
  const invitation = (sortieId: number, compteId: number) => tables.invitationsSorties.find((i) => i.sortieId === sortieId && i.compteId === compteId);
  const sons = creerMemoireSonsInvitations();

  function lireDonnees(sortie: Sortie): DonneesSortie {
    const propositions = [...tables.propositions.values()]
      .filter((p) => p.sortieId === sortie.id)
      .map((p) => ({ ...p, votants: tables.votes.filter((v) => v.propositionId === p.id).map((v) => v.compteId) }));
    const lieux = new Set(propositions.map((p) => p.lieuId).filter(publie));
    return assemblerSortie({ sortie, invitations: tables.invitationsSorties.filter((i) => i.sortieId === sortie.id), propositions }, lieux);
  }

  /** Les non-lus de la discussion, avec la règle du pouls (social-en-memoire.ts) */
  function compterNonLus(moi: number, conversationId: number, caches: ReadonlySet<number>): number {
    const membre = tables.membres.find((m) => m.conversationId === conversationId && m.compteId === moi);
    if (!membre) return 0;
    const depuis = Math.max(membre.luJusqua, membre.visibleApres);
    const sansSystemes = lireAppCliente().ancienneApp === true;
    const n = [...tables.messages.values()].filter((m) => m.conversationId === conversationId && m.id > depuis && m.auteurId !== moi
      && !m.supprimeLe && !m.suspenduLe && !m.retireLe && (m.auteurId === null || !caches.has(m.auteurId)) && (!sansSystemes || m.systeme === null)).length;
    return Math.min(MAX_COMPTEUR_POULS, n);
  }

  /** Toutes les personnes d'une sortie, en petit */
  const personnesDe = (d: DonneesSortie) => relations.presenter([
    ...d.participants, ...d.invites, ...(d.organisateurEffectif === null ? [] : [d.organisateurEffectif]),
    ...d.propositions.flatMap((p) => [...p.votants, ...(p.proposeParId === null ? [] : [p.proposeParId])]),
  ]);

  async function presenter(moi: number, d: DonneesSortie, maintenant: Date) {
    const caches = listerCachesEnMemoire(tables, moi);
    return presenterSortie(d, { moi, personnes: await personnesDe(d), caches, nonLus: compterNonLus(moi, d.conversationId, caches), maintenant });
  }

  /** La sortie si `moi` y participe (invitation « accepte »), sinon null */
  function lireParticipant(moi: number, sortieId: number) {
    const sortie = tables.sorties.get(sortieId);
    return sortie && invitation(sortieId, moi)?.statut === "accepte" ? { sortie, donnees: lireDonnees(sortie) } : null;
  }
  /** Un changement que voient les participants (le pouls, la relecture par version) ; l'organisateur qui a la main est écrit
   *  s'il a changé (son compte supprimé vide la colonne), comme sorties.ts */
  function marquerSortie(sortie: Sortie, maintenant: Date) {
    const organisateur = lireDonnees(sortie).organisateurEffectif;
    if (organisateur !== null && organisateur !== sortie.organisateurId) sortie.organisateurId = organisateur;
    sortie.version += 1;
    sortie.modifieLe = maintenant;
  }
  function marquerConversation(conversationId: number, maintenant: Date) {
    const conversation = tables.conversations.get(conversationId);
    if (!conversation) return;
    conversation.version += 1;
    conversation.modifieLe = maintenant;
  }
  /** Sort de la sortie : invitation, adhésion à la discussion et votes */
  function oublierParticipant(sortie: Sortie, compteId: number) {
    retirerLignes(tables.invitationsSorties, (i) => i.sortieId === sortie.id && i.compteId === compteId);
    retirerLignes(tables.membres, (m) => m.conversationId === sortie.conversationId && m.compteId === compteId);
    const propositions = new Set([...tables.propositions.values()].filter((p) => p.sortieId === sortie.id).map((p) => p.id));
    retirerLignes(tables.votes, (v) => propositions.has(v.propositionId) && v.compteId === compteId);
  }
  /** Le lieu retenu, écrit ; rend les effets à envoyer (aucun sans lieu publié à retenir) */
  async function retenirLieu(sortie: Sortie, acteurId: number | null, maintenant: Date) {
    const d = lireDonnees(sortie);
    const gagnant = choisirLieuGagnant(d.propositions.map((p) => ({ lieuId: p.lieuId, votes: p.votants.length })));
    Object.assign(sortie, { lieuChoisiId: gagnant, voteTermineLe: maintenant });
    marquerSortie(sortie, maintenant);
    if (gagnant === null) return [];
    const caches = acteurId === null ? new Set<number>() : listerCachesEnMemoire(tables, acteurId);
    const destinataires = d.participants.filter((id) => id !== acteurId && !caches.has(id));
    return construireEffetsSortie({
      quoi: "lieu-choisi", sortieId: sortie.id, titre: sortie.titre, lieu: { id: gagnant, nom: tables.lieux.get(gagnant)?.nom ?? "le lieu retenu" },
      acteurId, destinataires, pushAutorises: await relations.lirePushSocial(destinataires),
    });
  }
  /** La cloche, et le téléphone de ceux qui le veulent (pas deux fois en 24 h pour la même sortie) */
  async function effetsInvitation(sortie: Sortie, acteurId: number, invites: readonly number[], maintenant: Date) {
    const prenom = (await relations.presenter([acteurId])).get(acteurId)?.prenom ?? "";
    return construireEffetsSortie({
      quoi: "invitation", sortieId: sortie.id, titre: sortie.titre, acteur: { id: acteurId, prenom }, destinataires: invites,
      pushAutorises: sons.retenir(sortie.id, await relations.lirePushSocial(invites), maintenant),
    });
  }

  const sorties: ServicesSorties = {
    async lister(compteId, maintenant) {
      const masquees = new Set(tables.masques.filter((m) => m.compteId === compteId && m.cible === "sortie").map((m) => m.cibleId));
      const miennes = tables.invitationsSorties.filter((i) => i.compteId === compteId && !masquees.has(String(i.sortieId)));
      const maintenantMs = maintenant.getTime();
      const aVenir = (s: Sortie) => s.quand.getTime() > maintenantMs;
      // À venir d'abord, la plus proche en tête ; puis les passées, la plus récente en tête
      const ordre = (a: Sortie, b: Sortie) => {
        if (aVenir(a) !== aVenir(b)) return aVenir(a) ? -1 : 1;
        const ecart = aVenir(a) ? a.quand.getTime() - b.quand.getTime() : b.quand.getTime() - a.quand.getTime();
        return ecart || a.id - b.id;
      };
      const participations = miennes
        .filter((i) => i.statut === "accepte")
        .flatMap((i) => (tables.sorties.has(i.sortieId) ? [tables.sorties.get(i.sortieId)!] : []))
        .sort(ordre)
        .slice(0, MAX_SORTIES_LISTEES);
      const invitations = miennes.filter((i) => i.statut === "invite" && tables.sorties.has(i.sortieId) && aVenir(tables.sorties.get(i.sortieId)!));
      const caches = listerCachesEnMemoire(tables, compteId);
      const lues = invitations.map((i) => ({ i, d: lireDonnees(tables.sorties.get(i.sortieId)!) })).filter(({ i, d }) => !estInvitationCachee(d, i, caches));
      const personnes = await relations.presenter(lues.flatMap(({ i, d }) => [...(i.inviteParId === null ? [] : [i.inviteParId]), ...(d.organisateurEffectif === null ? [] : [d.organisateurEffectif])]));
      return {
        sorties: await Promise.all(participations.map((s) => presenter(compteId, lireDonnees(s), maintenant))),
        invitations: lues
          .sort((a, b) => a.d.quand.getTime() - b.d.quand.getTime() || a.d.id - b.d.id)
          .map(({ i, d }) => presenterInvitationSortie(d, i, personnes)),
      };
    },

    async lire(compteId, sortieId, version, maintenant) {
      const sortie = tables.sorties.get(sortieId);
      const mienne = sortie ? invitation(sortieId, compteId) : undefined;
      if (!sortie || !mienne || mienne.statut === "refuse") return null;
      const d = lireDonnees(sortie);
      if (mienne.statut === "invite") {
        if (estInvitationCachee(d, mienne, listerCachesEnMemoire(tables, compteId))) return null;
        const personnes = await relations.presenter([...(mienne.inviteParId === null ? [] : [mienne.inviteParId]), ...(d.organisateurEffectif === null ? [] : [d.organisateurEffectif])]);
        return { invitation: presenterInvitationSortie(d, mienne, personnes) };
      }
      if (version !== null && version === sortie.version) return { inchange: true, version };
      return { sortie: await presenter(compteId, d, maintenant) };
    },

    async creer(compteId, s, cle, maintenant) {
      const deja = await relations.lireIdempotence(compteId, cle, "sortie");
      if (deja !== null) {
        const lue = lireParticipant(compteId, deja);
        return lue ? { ok: true, sortie: await presenter(compteId, lue.donnees, maintenant), cree: false, effets: [] } : refus("sortie-inconnue");
      }
      if (tables.idempotence.some((l) => l.compteId === compteId && l.cle === cle)) return refus("cle-deja-prise");
      const invites = [...new Set(s.invites)].filter((id) => id !== compteId);
      if (invites.length === 0 || invites.some((id) => !estPote(compteId, id) || bloquesEnMemoire(tables, compteId, id))) return refus("pas-dans-la-bande");
      const lieux = [...new Set(s.lieux)];
      if (lieux.some((id) => !publie(id))) return refus("lieu-inconnu");
      const aVenir = [...tables.sorties.values()].filter((x) => x.organisateurId === compteId && x.quand.getTime() > maintenant.getTime());
      if (aVenir.length >= MAX_SORTIES_A_VENIR) return refus("trop-de-sorties");

      const conversationId = prendreId(tables, "conversations");
      tables.conversations.set(conversationId, {
        id: conversationId, type: "sortie", clePrive: null, titreChiffre: null, emoji: s.emoji, photo: null, creeParId: compteId, version: 0,
        dernierMessageLe: maintenant, modifieLe: maintenant, creeLe: maintenant,
      });
      tables.membres.push({ conversationId, compteId, role: "membre", visibleApres: 0, luJusqua: 0, coupee: false, arriveLe: maintenant, epingleeLe: null, luLe: null });
      const sortieId = prendreId(tables, "sorties");
      const sortie: Sortie = {
        id: sortieId, conversationId, organisateurId: compteId, titre: s.titre, emoji: s.emoji, quand: s.quand, finVote: s.finVote,
        lieuChoisiId: null, voteTermineLe: null, rappelEnvoyeLe: null, version: 0, modifieLe: maintenant, creeLe: maintenant,
      };
      tables.sorties.set(sortieId, sortie);
      tables.invitationsSorties.push(
        { sortieId, compteId, inviteParId: null, statut: "accepte", creeLe: maintenant, reponduLe: maintenant },
        ...invites.map((id) => ({ sortieId, compteId: id, inviteParId: compteId, statut: "invite", creeLe: maintenant, reponduLe: null })),
      );
      for (const lieuId of lieux) {
        const id = prendreId(tables, "propositions");
        tables.propositions.set(id, { id, sortieId, lieuId, proposeParId: compteId, creeLe: maintenant });
        tables.votes.push({ propositionId: id, compteId, creeLe: maintenant });
      }
      await relations.noterIdempotence(compteId, cle, "sortie", sortieId, maintenant);
      return { ok: true, sortie: await presenter(compteId, lireDonnees(sortie), maintenant), cree: true, effets: await effetsInvitation(sortie, compteId, invites, maintenant) };
    },

    async repondre(compteId, sortieId, vient, maintenant) {
      const sortie = tables.sorties.get(sortieId);
      const mienne = sortie ? invitation(sortieId, compteId) : undefined;
      if (!sortie || !mienne) return refus("sortie-inconnue");
      if (mienne.statut === "refuse") return vient ? refus("sortie-inconnue") : { ok: true, sortie: null };
      if (mienne.statut === "accepte") {
        if (vient) return { ok: true, sortie: await presenter(compteId, lireDonnees(sortie), maintenant) };
        await sorties.quitter(compteId, sortieId, maintenant);
        return { ok: true, sortie: null };
      }
      // Un blocage avec l'organisateur qui a la main (ou celui qui t'a invité) : ton invitation n'existe plus
      const hotes = new Set([lireDonnees(sortie).organisateurEffectif, mienne.inviteParId]);
      if (vient && [...hotes].some((id) => id !== null && id !== compteId && bloquesEnMemoire(tables, compteId, id))) {
        retirerLignes(tables.invitationsSorties, (i) => i === mienne);
        marquerSortie(sortie, maintenant);
        return refus("sortie-inconnue");
      }
      if (sortie.quand.getTime() <= maintenant.getTime()) return refus("sortie-passee");
      Object.assign(mienne, { statut: vient ? "accepte" : "refuse", reponduLe: maintenant });
      marquerSortie(sortie, maintenant);
      if (!vient) return { ok: true, sortie: null };
      // Il lit toute la discussion, depuis le début (visibleApres 0)
      if (!tables.membres.some((m) => m.conversationId === sortie.conversationId && m.compteId === compteId)) {
        tables.membres.push({ conversationId: sortie.conversationId, compteId, role: "membre", visibleApres: 0, luJusqua: 0, coupee: false, arriveLe: maintenant, epingleeLe: null, luLe: null });
      }
      marquerConversation(sortie.conversationId, maintenant);
      return { ok: true, sortie: await presenter(compteId, lireDonnees(sortie), maintenant) };
    },

    async inviter(compteId, sortieId, invites, maintenant) {
      const sortie = tables.sorties.get(sortieId);
      if (!sortie || (invitation(sortieId, compteId)?.statut ?? "refuse") === "refuse") return refus("sortie-inconnue");
      const d = lireDonnees(sortie);
      if (d.organisateurEffectif !== compteId) return refus("reserve-a-l-organisateur");
      if (sortie.quand.getTime() <= maintenant.getTime()) return refus("sortie-passee");
      const demandes = [...new Set(invites)].filter((id) => id !== compteId);
      if (demandes.some((id) => !estPote(compteId, id) || bloquesEnMemoire(tables, compteId, id))) return refus("pas-dans-la-bande");
      // Déjà là, ou refus gardé jusqu'à la date : sautés sans le dire
      const nouveaux = demandes.filter((id) => !invitation(sortieId, id));
      if (d.participants.length + d.invites.length + nouveaux.length > MAX_PARTICIPANTS_SORTIE) return refus("sortie-pleine");
      if (nouveaux.length > 0) {
        tables.invitationsSorties.push(...nouveaux.map((id) => ({ sortieId, compteId: id, inviteParId: compteId, statut: "invite", creeLe: maintenant, reponduLe: null })));
        marquerSortie(sortie, maintenant);
      }
      return { ok: true, sortie: await presenter(compteId, lireDonnees(sortie), maintenant), effets: await effetsInvitation(sortie, compteId, nouveaux, maintenant) };
    },

    async retirerParticipant(compteId, sortieId, personne, maintenant) {
      const sortie = tables.sorties.get(sortieId);
      if (!sortie || (invitation(sortieId, compteId)?.statut ?? "refuse") === "refuse") return refus("sortie-inconnue");
      if (lireDonnees(sortie).organisateurEffectif !== compteId) return refus("reserve-a-l-organisateur");
      if (personne === compteId) {
        await sorties.quitter(compteId, sortieId, maintenant);
        return { ok: true };
      }
      const sienne = personne === null ? undefined : invitation(sortieId, personne);
      if (personne === null || !sienne || sienne.statut === "refuse") return refus("personne-inconnue");
      oublierParticipant(sortie, personne);
      marquerSortie(sortie, maintenant);
      if (sienne.statut === "accepte") marquerConversation(sortie.conversationId, maintenant);
      return { ok: true };
    },

    async proposer(compteId, sortieId, lieuId, maintenant) {
      const lue = lireParticipant(compteId, sortieId);
      if (!lue) return refus("sortie-inconnue");
      const { sortie } = lue;
      if (sortie.voteTermineLe !== null || sortie.finVote.getTime() <= maintenant.getTime()) return refus("vote-termine");
      if (!publie(lieuId)) return refus("lieu-inconnu");
      const propositions = [...tables.propositions.values()].filter((p) => p.sortieId === sortieId);
      if (propositions.some((p) => p.lieuId === lieuId)) return { ok: true, sortie: await presenter(compteId, lue.donnees, maintenant), deja: true };
      if (propositions.length >= MAX_PROPOSITIONS_SORTIE) return refus("max-propositions");
      const id = prendreId(tables, "propositions");
      tables.propositions.set(id, { id, sortieId, lieuId, proposeParId: compteId, creeLe: maintenant });
      tables.votes.push({ propositionId: id, compteId, creeLe: maintenant });
      marquerSortie(sortie, maintenant);
      return { ok: true, sortie: await presenter(compteId, lireDonnees(sortie), maintenant), deja: false };
    },

    async voter(compteId, sortieId, lieuId, oui, maintenant) {
      const lue = lireParticipant(compteId, sortieId);
      if (!lue) return refus("sortie-inconnue");
      const { sortie } = lue;
      if (sortie.voteTermineLe !== null || sortie.finVote.getTime() <= maintenant.getTime()) return refus("vote-termine");
      const proposition = [...tables.propositions.values()].find((p) => p.sortieId === sortieId && p.lieuId === lieuId);
      if (!proposition || !publie(lieuId)) return oui ? refus("lieu-inconnu") : { ok: true, sortie: await presenter(compteId, lue.donnees, maintenant) };
      const deja = tables.votes.findIndex((v) => v.propositionId === proposition.id && v.compteId === compteId);
      const change = oui ? deja < 0 : deja >= 0;
      if (change && oui) tables.votes.push({ propositionId: proposition.id, compteId, creeLe: maintenant });
      if (change && !oui) tables.votes.splice(deja, 1);
      if (change) marquerSortie(sortie, maintenant);
      return { ok: true, sortie: await presenter(compteId, lireDonnees(sortie), maintenant) };
    },

    async terminerVote(compteId, sortieId, maintenant) {
      const lue = lireParticipant(compteId, sortieId);
      if (!lue) return refus("sortie-inconnue");
      if (lue.donnees.organisateurEffectif !== compteId) return refus("reserve-a-l-organisateur");
      if (lue.sortie.voteTermineLe !== null) return refus("vote-termine");
      const effets = await retenirLieu(lue.sortie, compteId, maintenant);
      return { ok: true, sortie: await presenter(compteId, lireDonnees(lue.sortie), maintenant), effets };
    },

    async quitter(compteId, sortieId, maintenant) {
      const sortie = tables.sorties.get(sortieId);
      const mienne = sortie ? invitation(sortieId, compteId) : undefined;
      if (!sortie || !mienne || mienne.statut === "refuse") return;
      if (mienne.statut === "invite") {
        Object.assign(mienne, { statut: "refuse", reponduLe: maintenant });
        marquerSortie(sortie, maintenant);
        return;
      }
      oublierParticipant(sortie, compteId);
      const reste = lireDonnees(sortie);
      if (reste.participants.length === 0) {
        const efface = await effacerConversationsEnMemoire(tables, [sortie.conversationId], medias);
        await efface.apresTransaction();
        return;
      }
      // L'organisateur qui part (ou parti avec son compte) passe la main au plus ancien participant (marquerSortie l'écrit)
      marquerSortie(sortie, maintenant);
      marquerConversation(sortie.conversationId, maintenant);
    },

    async annuler(compteId, sortieId) {
      const sortie = tables.sorties.get(sortieId);
      if (!sortie || (invitation(sortieId, compteId)?.statut ?? "refuse") === "refuse") return refus("sortie-inconnue");
      const d = lireDonnees(sortie);
      if (d.organisateurEffectif !== compteId) return refus("reserve-a-l-organisateur");
      const efface = await effacerConversationsEnMemoire(tables, [sortie.conversationId], medias);
      await efface.apresTransaction();
      return { ok: true, effets: construireEffetsSortie({ quoi: "annulee", sortieId, titre: sortie.titre, acteurId: compteId, destinataires: [...d.participants, ...d.invites] }) };
    },

    async terminerVotesEchus(maintenant) {
      const echues = [...tables.sorties.values()]
        .filter((s) => s.voteTermineLe === null && s.finVote.getTime() <= maintenant.getTime())
        .sort((a, b) => a.finVote.getTime() - b.finVote.getTime() || a.id - b.id)
        .slice(0, SORTIES_PAR_PASSAGE);
      const effets: EffetSocial[] = [];
      for (const sortie of echues) effets.push(...(await retenirLieu(sortie, null, maintenant)));
      return { terminees: echues.length, echecs: 0, effets };
    },
  };
  return sorties;
}
