// La bande, son lien d'invitation, les demandes et les blocages dans la base (contrat dans bande-regles.ts ; « Quoi de neuf »
// et le classement dans bande-activite.ts). Chaque geste qui crée un lien (rejoindre, demander, accepter) et chaque blocage
// se fait sous le verrou des deux comptes (SELECT … FROM comptes … ORDER BY id FOR UPDATE), blocage relu dans la même
// transaction : rien ne se recrée au moment d'un blocage, et une bande ne dépasse jamais 200 potes (« Changer mon lien » prend
// le verrou de son compte, comme rejoindre : l'un passe après l'autre). Le code d'invitation est
// chiffré (sous-clé des invitations, contexte « compte:<id> ») et comparé en temps constant ; il n'est jamais écrit dans un
// journal. L'id d'un compte ne sort jamais d'ici.
import { comparerEnTempsConstant } from "../../../../packages/commun/src/fonctions/qr/comparer-en-temps-constant.ts";
import { MAX_ARRIVEES_PAR_LIEN_24H, MAX_BANDE, MAX_BLOCAGES, MAX_DEMANDES_BANDE_EN_ATTENTE } from "../../../../packages/commun/src/regles/potes.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { creerCodeInvitation } from "../fonctions/social/creer-code-invitation.ts";
import { trouverOrganisateurEffectif } from "../fonctions/social/trouver-organisateur-effectif.ts";
import { lireActiviteBande, lireClassementBande } from "./bande-activite.ts";
import {
  compterArriveesParLien, construireBande, construireEffetsArrivee, debutDemandesValides, DEMANDES_BANDE_LUES,
  type LireAncienTitulaire, type ResultatDemandeBande, type ResultatRejoindre, type ServicesBande,
} from "./bande-regles.ts";
import type { ChiffrementSocial } from "./chiffrement-social.ts";
import { lireReservationActive, tablePseudosReservesPresente } from "./pseudos-reserves.ts";
import type { RelationsSociales, TransactionSociale } from "./relations-sociales-regles.ts";

const INVALIDE = { ok: false, erreur: "invitation-invalide" } as const;
/** Le bon code, mais le pseudo d'avant (son titulaire en a changé) : on partage le nouveau lien */
const INCONNUE = { ok: false, erreur: "invitation-inconnue" } as const;
/** Le contexte du chiffré factice de rejoindre : aucun compte n'a cet id */
const COMPTE_FACTICE = Number.MAX_SAFE_INTEGER;

/** Les deux lignes de la bande (a → b et b → a) et les demandes entre eux effacées ; faux si l'une des deux bandes est pleine */
async function lier(tx: TransactionSociale, a: number, b: number, maintenant: Date): Promise<boolean> {
  const tailleA = await tx.membreBande.count({ where: { compteId: a } });
  const tailleB = await tx.membreBande.count({ where: { compteId: b } });
  if (tailleA >= MAX_BANDE || tailleB >= MAX_BANDE) return false;
  await tx.membreBande.createMany({ data: [{ compteId: a, poteId: b, creeLe: maintenant }, { compteId: b, poteId: a, creeLe: maintenant }], skipDuplicates: true });
  await tx.demandeBande.deleteMany({ where: { OR: [{ deId: a, aId: b }, { deId: b, aId: a }] } });
  return true;
}

/**
 * Tout ce que coupe un blocage de `a` sur `b` (B.2), dans la transaction déjà verrouillée. D'abord, les sorties puis les
 * conversations qu'ils partagent changent de version (l'app les relit : ce que l'un écrit y est désormais caché pour
 * l'autre ; même ordre des verrous que sorties.ts : les comptes, puis la sortie, puis sa discussion) ; ensuite, b sort des
 * sorties où a a la main (invitation, discussion et votes) ; enfin, les liens entre eux, dans les deux sens.
 */
async function couperEntre(tx: TransactionSociale, a: number, b: number, maintenant: Date): Promise<void> {
  const changement = { version: { increment: 1 }, modifieLe: maintenant };
  const communes = { AND: [{ invitations: { some: { compteId: a } } }, { invitations: { some: { compteId: b } } }] };
  await tx.sortie.updateMany({ where: communes, data: changement });
  // Relues sous leur verrou : qui y a la main (trouverOrganisateurEffectif, la règle de sorties.ts), pas seulement la colonne
  const partagees = await tx.sortie.findMany({
    where: communes,
    select: { id: true, conversationId: true, organisateurId: true, invitations: { where: { statut: "accepte" }, select: { compteId: true, creeLe: true, reponduLe: true } } },
  });
  const organiseesPar = (x: number) => partagees.filter((s) => trouverOrganisateurEffectif(s.organisateurId, s.invitations) === x);
  const organisees = organiseesPar(a);
  await tx.conversation.updateMany({ where: { AND: [{ membres: { some: { compteId: a } } }, { membres: { some: { compteId: b } } }] }, data: changement });
  if (organisees.length > 0) {
    const sorties = organisees.map((s) => s.id);
    await tx.invitationSortie.deleteMany({ where: { compteId: b, sortieId: { in: sorties } } });
    await tx.membreConversation.deleteMany({ where: { compteId: b, conversationId: { in: organisees.map((s) => s.conversationId) } } });
    // Comme retirerParticipant (sorties.ts) : ses votes partent avec lui, ils ne comptent plus pour le lieu retenu
    await tx.voteSortie.deleteMany({ where: { compteId: b, proposition: { sortieId: { in: sorties } } } });
  }
  await tx.membreBande.deleteMany({ where: { OR: [{ compteId: a, poteId: b }, { compteId: b, poteId: a }] } });
  await tx.demandeBande.deleteMany({ where: { OR: [{ deId: a, aId: b }, { deId: b, aId: a }] } });
  await tx.suiviPersonne.deleteMany({ where: { OR: [{ suiveurId: a, suiviId: b }, { suiveurId: b, suiviId: a }] } });
  const listesDeLAutre = { OR: [{ compteId: b, liste: { auteurId: a } }, { compteId: a, liste: { auteurId: b } }] };
  await tx.coAuteurListe.deleteMany({ where: listesDeLAutre });
  await tx.abonnementListe.deleteMany({ where: listesDeLAutre });
  // Les invitations en attente de l'un chez l'autre (invité par lui, ou dans une sortie où il a la main ; celles de b dans
  // les sorties de a sont déjà parties)
  await tx.invitationSortie.deleteMany({
    where: {
      statut: "invite",
      OR: [
        { compteId: b, inviteParId: a },
        { compteId: a, OR: [{ inviteParId: b }, { sortieId: { in: organiseesPar(b).map((s) => s.id) } }] },
      ],
    },
  });
  await tx.invitationGroupe.deleteMany({ where: { statut: "invite", OR: [{ compteId: b, inviteParId: a }, { compteId: a, inviteParId: b }] } });
  await tx.notificationCloche.deleteMany({ where: { OR: [{ compteId: a, acteurId: b }, { compteId: b, acteurId: a }] } });
}

export function creerBande(o: {
  relations: RelationsSociales; chiffrement: ChiffrementSocial | null; tirer: (max: number) => number; base?: typeof baseDeDonnees;
  /** Par défaut, la table pseudos_reserves de la session Site (rien de réservé tant qu'elle n'existe pas) */
  lireAncienTitulaire?: LireAncienTitulaire;
}): ServicesBande {
  const { relations, tirer } = o;
  const base = o.base ?? baseDeDonnees;
  const lireAncienTitulaire: LireAncienTitulaire = o.lireAncienTitulaire ?? (async (pseudo, maintenant) =>
    (await tablePseudosReservesPresente()) ? ((await lireReservationActive(base, pseudo, maintenant))?.compteId ?? null) : null);
  /** Les routes de l'invitation passent par exigerChiffrementSocial : sans clé, on n'arrive jamais ici */
  const chiffrement = () => {
    if (!o.chiffrement) throw new Error("Chiffrement social indisponible");
    return o.chiffrement;
  };
  /** Le code et le pseudo de mon lien (le profil social existe : exigerProfilSocial) */
  async function lireMonCode(compteId: number) {
    const profil = await base.profilSocial.findUnique({
      where: { compteId },
      select: { codeInvitationChiffre: true, codeInvitationLe: true, compte: { select: { pseudo: true } } },
    });
    if (!profil?.compte.pseudo) throw new Error("Profil social sans pseudo");
    return { chiffre: profil.codeInvitationChiffre, creeLe: profil.codeInvitationLe, pseudo: profil.compte.pseudo };
  }
  /** Le code reçu est-il celui-là ? Un chiffré illisible ne vaut rien (et ne dit rien) */
  function estLeCode(chiffre: string, proprietaire: number, code: string): boolean {
    try {
      return comparerEnTempsConstant(code, chiffrement().dechiffrerCode(chiffre, proprietaire));
    } catch {
      return false;
    }
  }
  /** Un chiffré factice (contexte d'un compte qui n'existe pas) : à déchiffrer quand il n'y a pas de vrai code à comparer */
  let factice: string | null = null;
  const chiffreFactice = () => (factice ??= chiffrement().chiffrerCode(creerCodeInvitation(tirer), COMPTE_FACTICE));

  const bande: ServicesBande = {
    async lireBande(compteId, maintenant) {
      const depuis = debutDemandesValides(maintenant);
      const [membres, recues, envoyees] = await Promise.all([
        base.membreBande.findMany({ where: { compteId }, select: { poteId: true, creeLe: true }, orderBy: [{ creeLe: "desc" }, { poteId: "desc" }], take: MAX_BANDE }),
        base.demandeBande.findMany({
          where: { aId: compteId, refuseeLe: null, creeLe: { gte: depuis } },
          select: { deId: true, creeLe: true }, orderBy: [{ creeLe: "desc" }, { deId: "desc" }], take: DEMANDES_BANDE_LUES,
        }),
        // Refusées comprises : celui qui a demandé ne sait pas qu'elles l'ont été
        base.demandeBande.findMany({
          where: { deId: compteId, creeLe: { gte: depuis } },
          select: { aId: true, creeLe: true }, orderBy: [{ creeLe: "desc" }, { aId: "desc" }], take: DEMANDES_BANDE_LUES,
        }),
      ]);
      const personnes = await relations.presenter([...membres.map((m) => m.poteId), ...recues.map((d) => d.deId), ...envoyees.map((d) => d.aId)]);
      return construireBande(membres, recues, envoyees, personnes);
    },

    async lireInvitation(compteId, maintenant) {
      let mien = await lireMonCode(compteId);
      if (!mien.chiffre) {
        // Seulement s'il n'y en a pas encore : deux téléphones qui le demandent en même temps reçoivent le même
        const code = creerCodeInvitation(tirer);
        await base.profilSocial.updateMany({
          where: { compteId, codeInvitationChiffre: null },
          data: { codeInvitationChiffre: chiffrement().chiffrerCode(code, compteId), codeInvitationLe: maintenant },
        });
        mien = await lireMonCode(compteId);
      }
      if (!mien.chiffre) throw new Error("Code d'invitation introuvable après écriture");
      return { pseudo: mien.pseudo, code: chiffrement().dechiffrerCode(mien.chiffre, compteId), creeLe: mien.creeLe ?? maintenant };
    },

    async renouvelerInvitation(compteId, maintenant) {
      const code = creerCodeInvitation(tirer);
      // Sous le verrou de mon compte, celui que prend rejoindre : une arrivée en cours écrit avant (avec l'ancien code), et
      // jamais par-dessus le nouveau code ni le compte remis à zéro
      const profil = await base.$transaction(async (tx) => {
        await relations.verrouillerComptes(tx, [compteId]);
        return tx.profilSocial.update({
          where: { compteId },
          data: { codeInvitationChiffre: chiffrement().chiffrerCode(code, compteId), codeInvitationLe: maintenant, arriveesParLien: 0, arriveesDepuis: null },
          select: { compte: { select: { pseudo: true } } },
        });
      });
      if (!profil.compte.pseudo) throw new Error("Profil social sans pseudo");
      return { pseudo: profil.compte.pseudo, code, creeLe: maintenant };
    },

    async rejoindre(compteId, pseudo, code, maintenant): Promise<ResultatRejoindre> {
      const proprietaire = await base.compte.findUnique({ where: { pseudo }, select: { id: true, profilSocial: { select: { compteId: true } } } });
      // Personne ne le porte : peut-être le pseudo d'avant d'un compte qui en a changé (réservé 30 jours). Son code décide,
      // comme pour un lien à jour : seul le bon code apprend que le lien a changé, et rien ne dit qu'un pseudo est réservé
      const ancien = proprietaire ? null : await lireAncienTitulaire(pseudo, maintenant);
      // Pseudo inconnu ou sans profil social : le même travail qu'un code faux (transaction, verrou, lecture d'un profil,
      // déchiffrement), pour que le temps de réponse ne dise pas si ce pseudo utilise Potes
      const autreId = proprietaire?.profilSocial ? proprietaire.id : ancien;
      if (autreId === compteId) return { ok: false, erreur: "soi-meme" };
      const issue = await base.$transaction(async (tx) => {
        await relations.verrouillerComptes(tx, autreId === null ? [compteId] : [compteId, autreId]);
        const profil = await tx.profilSocial.findUnique({
          where: { compteId: autreId ?? 0 }, select: { codeInvitationChiffre: true, arriveesParLien: true, arriveesDepuis: true },
        });
        const chiffre = profil?.codeInvitationChiffre ?? null;
        // Sans vrai code à comparer, le chiffré factice : le même déchiffrement, qui ne vaut jamais rien
        const vrai = autreId !== null && chiffre !== null;
        const egal = estLeCode(vrai ? chiffre : chiffreFactice(), vrai ? autreId : COMPTE_FACTICE, code);
        if (!vrai || !egal || autreId === null || !profil) return INVALIDE;
        if (await relations.bloqueEntre(compteId, autreId, tx)) return INVALIDE;
        // L'ancien lien, avec le bon code : rien n'est écrit, aucune arrivée comptée
        if (ancien !== null) return INCONNUE;
        const deja = await tx.membreBande.findUnique({ where: { compteId_poteId: { compteId, poteId: autreId } }, select: { creeLe: true } });
        if (deja) return { ok: true, deja: true, renouvele: false, autreId } as const;
        const arrivees = compterArriveesParLien(profil.arriveesParLien, profil.arriveesDepuis, maintenant);
        // Le code aurait déjà dû changer (deux arrivées au même moment) : la même réponse qu'un code faux
        if (arrivees >= MAX_ARRIVEES_PAR_LIEN_24H) return INVALIDE;
        if (!(await lier(tx, compteId, autreId, maintenant))) return { ok: false, erreur: "bande-pleine" } as const;
        // La 10e arrivée passe ; juste après, le code change tout seul (le lien a sans doute fuité). arriveesDepuis : la dernière
        const renouvele = arrivees + 1 >= MAX_ARRIVEES_PAR_LIEN_24H;
        await tx.profilSocial.update({
          where: { compteId: autreId },
          data: renouvele
            ? { codeInvitationChiffre: chiffrement().chiffrerCode(creerCodeInvitation(tirer), autreId), codeInvitationLe: maintenant, arriveesParLien: 0, arriveesDepuis: null }
            : { arriveesParLien: arrivees + 1, arriveesDepuis: maintenant },
        });
        return { ok: true, deja: false, renouvele, autreId } as const;
      });
      if (!issue.ok) return issue;
      if (issue.deja) return { ok: true, poteId: issue.autreId, deja: true, effets: [] };
      const effets = await construireEffetsArrivee(relations, "bande-ajout", issue.autreId, compteId);
      if (issue.renouvele) effets.push({ quoi: "cloche", notification: { compteId: issue.autreId, type: "lien-renouvele", acteurId: null } });
      return { ok: true, poteId: issue.autreId, deja: false, effets };
    },

    async demander(compteId, cibleId, maintenant): Promise<ResultatDemandeBande> {
      if (cibleId === compteId) return { ok: false, erreur: "soi-meme" };
      const depuis = debutDemandesValides(maintenant);
      const issue = await base.$transaction(async (tx) => {
        await relations.verrouillerComptes(tx, [compteId, cibleId]);
        if (await relations.bloqueEntre(compteId, cibleId, tx)) return { ok: false, erreur: "personne-inconnue" } as const;
        if (await tx.membreBande.findUnique({ where: { compteId_poteId: { compteId, poteId: cibleId } }, select: { creeLe: true } })) return { ok: true, etat: "deja" } as const;
        // Elle m'avait déjà demandé (même si j'avais refusé : je change d'avis) : nous voilà potes
        const sienne = await tx.demandeBande.findUnique({ where: { deId_aId: { deId: cibleId, aId: compteId } }, select: { creeLe: true } });
        if (sienne && sienne.creeLe >= depuis) {
          if (!(await lier(tx, compteId, cibleId, maintenant))) return { ok: false, erreur: "bande-pleine" } as const;
          return { ok: true, etat: "ajoute" } as const;
        }
        // Déjà envoyée, refusée ou non (en silence : je vois toujours « envoyée »), jusqu'à son expiration
        const mienne = await tx.demandeBande.findUnique({ where: { deId_aId: { deId: compteId, aId: cibleId } }, select: { creeLe: true } });
        if (mienne && mienne.creeLe >= depuis) return { ok: true, etat: "deja" } as const;
        if ((await tx.membreBande.count({ where: { compteId } })) >= MAX_BANDE) return { ok: false, erreur: "bande-pleine" } as const;
        if ((await tx.demandeBande.count({ where: { deId: compteId, creeLe: { gte: depuis } } })) >= MAX_DEMANDES_BANDE_EN_ATTENTE) {
          return { ok: false, erreur: "trop-de-demandes-en-attente" } as const;
        }
        // « Qu'on me trouve par mon pseudo » éteint : on n'entre dans sa bande que par son lien (I.1). Refus dit franchement
        // (décidé par Hugo le 14/10/2026), sans rien écrire
        if ((await tx.profilSocial.findUnique({ where: { compteId: cibleId }, select: { trouvable: true } }))?.trouvable === false) {
          return { ok: false, erreur: "demandes-fermees" } as const;
        }
        // Une demande expirée (pas encore effacée par le ménage de nuit) ne compte plus : la nouvelle la remplace
        if (sienne) await tx.demandeBande.delete({ where: { deId_aId: { deId: cibleId, aId: compteId } } });
        await tx.demandeBande.upsert({
          where: { deId_aId: { deId: compteId, aId: cibleId } },
          create: { deId: compteId, aId: cibleId, creeLe: maintenant, refuseeLe: null },
          update: { creeLe: maintenant, refuseeLe: null },
        });
        return { ok: true, etat: "demande" } as const;
      });
      if (!issue.ok) return issue;
      return { ...issue, effets: issue.etat === "ajoute" ? await construireEffetsArrivee(relations, "bande-acceptee", cibleId, compteId) : [] };
    },

    async accepter(compteId, deId, maintenant) {
      const depuis = debutDemandesValides(maintenant);
      const issue = await base.$transaction(async (tx) => {
        await relations.verrouillerComptes(tx, [compteId, deId]);
        // Déjà potes (deux touchers, ou une réponse perdue puis renvoyée) : ok, sans rien de plus ; sous le verrou, des potes
        // n'ont jamais de blocage entre eux (bloquer efface la bande)
        if (await tx.membreBande.findUnique({ where: { compteId_poteId: { compteId, poteId: deId } }, select: { creeLe: true } })) return { ok: true, deja: true } as const;
        const demande = await tx.demandeBande.findUnique({ where: { deId_aId: { deId, aId: compteId } }, select: { creeLe: true } });
        if (!demande || demande.creeLe < depuis || (await relations.bloqueEntre(compteId, deId, tx))) return { ok: false, erreur: "demande-inconnue" } as const;
        if (!(await lier(tx, compteId, deId, maintenant))) return { ok: false, erreur: "bande-pleine" } as const;
        return { ok: true, deja: false } as const;
      });
      if (!issue.ok) return issue;
      if (issue.deja) return { ok: true, effets: [] };
      return { ok: true, effets: await construireEffetsArrivee(relations, "bande-acceptee", deId, compteId) };
    },

    async retirerDemande(compteId, autreId, maintenant) {
      await base.$transaction([
        base.demandeBande.deleteMany({ where: { deId: compteId, aId: autreId } }),
        base.demandeBande.updateMany({ where: { deId: autreId, aId: compteId, refuseeLe: null }, data: { refuseeLe: maintenant } }),
      ]);
    },

    async retirer(compteId, poteId, maintenant) {
      await base.$transaction(async (tx) => {
        const { count } = await tx.membreBande.deleteMany({ where: { OR: [{ compteId, poteId }, { compteId: poteId, poteId: compteId }] } });
        if (count === 0) return;
        // Les co-auteurs entre eux partent (leurs lieux restent) ; un refus reste noté
        await tx.coAuteurListe.deleteMany({
          where: { statut: { in: ["invite", "accepte"] }, OR: [{ compteId: poteId, liste: { auteurId: compteId } }, { compteId, liste: { auteurId: poteId } }] },
        });
        // Leur discussion privée passe en lecture seule : elle change de version, l'app la relit
        await tx.conversation.updateMany({
          where: { type: "prive", AND: [{ membres: { some: { compteId } } }, { membres: { some: { compteId: poteId } } }] },
          data: { version: { increment: 1 }, modifieLe: maintenant },
        });
      });
    },

    async bloquer(compteId, autreId, maintenant) {
      if (autreId === compteId) return { ok: false, erreur: "soi-meme" };
      return base.$transaction(async (tx) => {
        await relations.verrouillerComptes(tx, [compteId, autreId]);
        const deja = await tx.blocage.findUnique({ where: { bloqueurId_bloqueId: { bloqueurId: compteId, bloqueId: autreId } }, select: { creeLe: true } });
        if (deja) return { ok: true } as const;
        if ((await tx.blocage.count({ where: { bloqueurId: compteId } })) >= MAX_BLOCAGES) return { ok: false, erreur: "trop-de-blocages" } as const;
        await tx.blocage.create({ data: { bloqueurId: compteId, bloqueId: autreId, creeLe: maintenant } });
        await couperEntre(tx, compteId, autreId, maintenant);
        return { ok: true } as const;
      });
    },

    async debloquer(compteId, autreId) {
      await base.blocage.deleteMany({ where: { bloqueurId: compteId, bloqueId: autreId } });
    },

    async listerBloques(compteId) {
      const lignes = await base.blocage.findMany({
        where: { bloqueurId: compteId }, select: { bloqueId: true }, orderBy: [{ creeLe: "desc" }, { bloqueId: "desc" }], take: MAX_BLOCAGES,
      });
      const personnes = await relations.presenter(lignes.map((l) => l.bloqueId));
      return lignes.flatMap((l) => personnes.get(l.bloqueId) ?? []);
    },

    async listerPotes(compteId) {
      const ids = await relations.listerPotes(compteId);
      const personnes = await relations.presenter(ids);
      return ids.flatMap((id) => personnes.get(id) ?? []);
    },

    async estPote(a, b) {
      return (await base.membreBande.count({ where: { compteId: a, poteId: b } })) > 0;
    },

    lireActivite: (compteId, maintenant) => lireActiviteBande(base, relations, compteId, maintenant),
    lireClassement: (compteId, maintenant) => lireClassementBande(base, relations, compteId, maintenant),
  };
  return bande;
}
