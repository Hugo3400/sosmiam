// Double en mémoire de la bande (contrat dans bande-regles.ts), posé sur les tables partagées : mêmes règles que bande.ts et
// bande-activite.ts. Chaque geste qui écrit le fait d'un seul tenant, sans attente entre la vérification et l'écriture :
// deux demandes en même temps ne se croisent jamais (le verrou des deux comptes de la base). Le compte en mémoire ne garde
// que les codes de ses badges, sans date : « Quoi de neuf » n'a donc pas de ligne « badge » ici (la requête de
// bande-activite.ts les lit dans badges_comptes). Une rescousse en mémoire n'a pas d'id : sa place dans la table (1, 2, 3…).
import { calculerDebutMoisParis } from "../../../../packages/commun/src/fonctions/temps/calculer-debut-mois-paris.ts";
import { comparerEnTempsConstant } from "../../../../packages/commun/src/fonctions/qr/comparer-en-temps-constant.ts";
import { MAX_ARRIVEES_PAR_LIEN_24H, MAX_BANDE, MAX_BLOCAGES, MAX_DEMANDES_BANDE_EN_ATTENTE } from "../../../../packages/commun/src/regles/potes.ts";
import type { ProfilSocial } from "../base-de-donnees/client-genere/client.ts";
import { creerCodeInvitation } from "../fonctions/social/creer-code-invitation.ts";
import { trouverOrganisateurEffectif } from "../fonctions/social/trouver-organisateur-effectif.ts";
import {
  compterArriveesParLien, construireBande, construireClassement, construireEffetsArrivee, debutActivite, debutDemandesValides,
  DEMANDES_BANDE_LUES, ID_ACTIVITE, MAX_ACTIVITES, presenterActivites, type LigneActivite, type LireAncienTitulaire, type ServicesBande,
} from "./bande-regles.ts";
import type { ChiffrementSocial } from "./chiffrement-social.ts";
import type { PseudosReservesEnMemoire } from "./pseudos-reserves-en-memoire.ts";
import type { RelationsSociales } from "./relations-sociales-regles.ts";
import { bloquesEnMemoire, type TablesSociales } from "./tables-sociales-en-memoire.ts";

/** Retire d'un tableau, sur place, les lignes qui répondent à `quoi` (comme un DELETE) ; rend le nombre retiré */
function retirer<T>(lignes: T[], quoi: (ligne: T) => boolean): number {
  let retires = 0;
  for (let i = lignes.length - 1; i >= 0; i--) {
    if (quoi(lignes[i]!)) {
      lignes.splice(i, 1);
      retires += 1;
    }
  }
  return retires;
}
/** Plus récent d'abord ; à la même milliseconde, le dernier écrit d'abord */
const plusRecentDAbord = <T extends { creeLe: Date }>(lignes: readonly T[]) => [...lignes].reverse().sort((a, b) => b.creeLe.getTime() - a.creeLe.getTime());

/** L'ancien titulaire d'un pseudo libéré, d'après les réservations des comptes en mémoire (comme lireReservationActive) */
export function lireAncienTitulaireEnMemoire(pseudos: Pick<PseudosReservesEnMemoire, "reservations">): LireAncienTitulaire {
  return async (pseudo, maintenant) => {
    const reservation = pseudos.reservations.get(pseudo);
    return reservation && reservation.reserveJusquLe > maintenant.getTime() ? reservation.compteId : null;
  };
}

/** `lireAncienTitulaire` absent : aucun pseudo réservé */
export function creerBandeEnMemoire(
  tables: TablesSociales, relations: RelationsSociales, chiffrement: ChiffrementSocial | null, tirer: (max: number) => number,
  lireAncienTitulaire: LireAncienTitulaire = async () => null,
): ServicesBande {
  const coder = () => {
    if (!chiffrement) throw new Error("Chiffrement social indisponible");
    return chiffrement;
  };
  const profil = (compteId: number): ProfilSocial => {
    const p = tables.profils.get(compteId);
    if (!p) throw new Error("Profil social introuvable");
    return p;
  };
  const pseudoDe = (compteId: number) => {
    const pseudo = tables.comptes.get(compteId)?.pseudo;
    if (!pseudo) throw new Error("Profil social sans pseudo");
    return pseudo;
  };
  const sontPotes = (a: number, b: number) => tables.bande.some((l) => l.compteId === a && l.poteId === b);
  const taille = (compteId: number) => tables.bande.filter((l) => l.compteId === compteId).length;
  const demande = (deId: number, aId: number) => tables.demandes.find((d) => d.deId === deId && d.aId === aId);
  /** Les deux lignes, les demandes entre eux effacées ; faux si l'une des deux bandes est pleine */
  function lier(a: number, b: number, maintenant: Date): boolean {
    if (taille(a) >= MAX_BANDE || taille(b) >= MAX_BANDE) return false;
    if (!sontPotes(a, b)) tables.bande.push({ compteId: a, poteId: b, creeLe: maintenant }, { compteId: b, poteId: a, creeLe: maintenant });
    retirer(tables.demandes, (d) => (d.deId === a && d.aId === b) || (d.deId === b && d.aId === a));
    return true;
  }
  function estLeCode(chiffre: string, proprietaire: number, code: string): boolean {
    try {
      return comparerEnTempsConstant(code, coder().dechiffrerCode(chiffre, proprietaire));
    } catch {
      return false;
    }
  }
  /** Les conversations et les sorties où a et b sont tous les deux changent de version */
  function changerVersionsCommunes(a: number, b: number, maintenant: Date, seulementPrive = false) {
    const membresDe = (id: number) => new Set(tables.membres.filter((m) => m.compteId === id).map((m) => m.conversationId));
    const deA = membresDe(a);
    for (const id of membresDe(b)) {
      const conversation = tables.conversations.get(id);
      if (!deA.has(id) || !conversation || (seulementPrive && conversation.type !== "prive")) continue;
      Object.assign(conversation, { version: conversation.version + 1, modifieLe: maintenant });
    }
    if (seulementPrive) return;
    const sortiesDe = (id: number) => new Set(tables.invitationsSorties.filter((i) => i.compteId === id).map((i) => i.sortieId));
    const sortiesDeA = sortiesDe(a);
    for (const id of sortiesDe(b)) {
      const sortie = tables.sorties.get(id);
      if (sortiesDeA.has(id) && sortie) Object.assign(sortie, { version: sortie.version + 1, modifieLe: maintenant });
    }
  }
  /** Tout ce que coupe un blocage de a sur b (même ordre que couperEntre de bande.ts) */
  function couperEntre(a: number, b: number, maintenant: Date) {
    changerVersionsCommunes(a, b, maintenant);
    // Qui a la main sur chaque sortie (trouverOrganisateurEffectif, la règle des sorties), pas seulement la colonne
    const aLaMain = (x: number) => [...tables.sorties.values()].filter((s) =>
      trouverOrganisateurEffectif(s.organisateurId, tables.invitationsSorties.filter((i) => i.sortieId === s.id && i.statut === "accepte")) === x);
    const organisees = aLaMain(a);
    const organiseesParB = new Set(aLaMain(b).map((s) => s.id));
    const sortiesIds = new Set(organisees.map((s) => s.id));
    const conversationsIds = new Set(organisees.map((s) => s.conversationId));
    retirer(tables.invitationsSorties, (i) => i.compteId === b && sortiesIds.has(i.sortieId));
    retirer(tables.membres, (m) => m.compteId === b && conversationsIds.has(m.conversationId));
    // Ses votes partent avec lui (comme retirerParticipant des sorties) : ils ne comptent plus pour le lieu retenu
    retirer(tables.votes, (v) => v.compteId === b && sortiesIds.has(tables.propositions.get(v.propositionId)?.sortieId ?? 0));
    const entre = (x: number, y: number) => (x === a && y === b) || (x === b && y === a);
    retirer(tables.bande, (l) => entre(l.compteId, l.poteId));
    retirer(tables.demandes, (d) => entre(d.deId, d.aId));
    retirer(tables.suivis, (s) => entre(s.suiveurId, s.suiviId));
    const auteur = (listeId: number) => tables.listes.get(listeId)?.auteurId;
    retirer(tables.coAuteurs, (c) => entre(c.compteId, auteur(c.listeId) ?? 0));
    retirer(tables.abonnementsListes, (l) => entre(l.compteId, auteur(l.listeId) ?? 0));
    retirer(tables.invitationsSorties, (i) => i.statut === "invite" && (
      (i.compteId === b && i.inviteParId === a) || (i.compteId === a && (i.inviteParId === b || organiseesParB.has(i.sortieId)))));
    retirer(tables.invitationsGroupes, (i) => i.statut === "invite" && i.inviteParId !== null && entre(i.compteId, i.inviteParId));
    for (const [id, n] of tables.cloche) if (n.acteurId !== null && entre(n.compteId, n.acteurId)) tables.cloche.delete(id);
  }

  const bande: ServicesBande = {
    async lireBande(compteId, maintenant) {
      const depuis = debutDemandesValides(maintenant).getTime();
      const valide = (d: { creeLe: Date }) => d.creeLe.getTime() >= depuis;
      const membres = plusRecentDAbord(tables.bande.filter((l) => l.compteId === compteId)).slice(0, MAX_BANDE);
      const recues = plusRecentDAbord(tables.demandes.filter((d) => d.aId === compteId && d.refuseeLe === null && valide(d))).slice(0, DEMANDES_BANDE_LUES);
      const envoyees = plusRecentDAbord(tables.demandes.filter((d) => d.deId === compteId && valide(d))).slice(0, DEMANDES_BANDE_LUES);
      const personnes = await relations.presenter([...membres.map((m) => m.poteId), ...recues.map((d) => d.deId), ...envoyees.map((d) => d.aId)]);
      return construireBande(membres, recues, envoyees, personnes);
    },

    async lireInvitation(compteId, maintenant) {
      const p = profil(compteId);
      if (!p.codeInvitationChiffre) Object.assign(p, { codeInvitationChiffre: coder().chiffrerCode(creerCodeInvitation(tirer), compteId), codeInvitationLe: maintenant });
      return { pseudo: pseudoDe(compteId), code: coder().dechiffrerCode(p.codeInvitationChiffre!, compteId), creeLe: p.codeInvitationLe ?? maintenant };
    },

    async renouvelerInvitation(compteId, maintenant) {
      const code = creerCodeInvitation(tirer);
      Object.assign(profil(compteId), { codeInvitationChiffre: coder().chiffrerCode(code, compteId), codeInvitationLe: maintenant, arriveesParLien: 0, arriveesDepuis: null });
      return { pseudo: pseudoDe(compteId), code, creeLe: maintenant };
    },

    async rejoindre(compteId, pseudo, code, maintenant) {
      const proprietaire = [...tables.comptes.values()].find((c) => c.pseudo === pseudo);
      // Personne ne le porte : le pseudo d'avant d'un compte qui en a changé ? Son code décide (même règle que bande.ts)
      const ancien = proprietaire ? null : await lireAncienTitulaire(pseudo, maintenant);
      const autreId = proprietaire?.id ?? ancien;
      const p = autreId === null ? undefined : tables.profils.get(autreId);
      if (autreId === null || !p) return { ok: false, erreur: "invitation-invalide" };
      if (autreId === compteId) return { ok: false, erreur: "soi-meme" };
      if (!p.codeInvitationChiffre || !estLeCode(p.codeInvitationChiffre, autreId, code) || bloquesEnMemoire(tables, compteId, autreId)) {
        return { ok: false, erreur: "invitation-invalide" };
      }
      if (ancien !== null) return { ok: false, erreur: "invitation-inconnue" };
      if (sontPotes(compteId, autreId)) return { ok: true, poteId: autreId, deja: true, effets: [] };
      const arrivees = compterArriveesParLien(p.arriveesParLien, p.arriveesDepuis, maintenant);
      if (arrivees >= MAX_ARRIVEES_PAR_LIEN_24H) return { ok: false, erreur: "invitation-invalide" };
      if (!lier(compteId, autreId, maintenant)) return { ok: false, erreur: "bande-pleine" };
      const renouvele = arrivees + 1 >= MAX_ARRIVEES_PAR_LIEN_24H;
      Object.assign(p, renouvele
        ? { codeInvitationChiffre: coder().chiffrerCode(creerCodeInvitation(tirer), autreId), codeInvitationLe: maintenant, arriveesParLien: 0, arriveesDepuis: null }
        : { arriveesParLien: arrivees + 1, arriveesDepuis: maintenant });
      const effets = await construireEffetsArrivee(relations, "bande-ajout", autreId, compteId);
      if (renouvele) effets.push({ quoi: "cloche", notification: { compteId: autreId, type: "lien-renouvele", acteurId: null } });
      return { ok: true, poteId: autreId, deja: false, effets };
    },

    async demander(compteId, cibleId, maintenant) {
      if (cibleId === compteId) return { ok: false, erreur: "soi-meme" };
      const depuis = debutDemandesValides(maintenant).getTime();
      if (bloquesEnMemoire(tables, compteId, cibleId)) return { ok: false, erreur: "personne-inconnue" };
      if (sontPotes(compteId, cibleId)) return { ok: true, etat: "deja", effets: [] };
      const sienne = demande(cibleId, compteId);
      if (sienne && sienne.creeLe.getTime() >= depuis) {
        if (!lier(compteId, cibleId, maintenant)) return { ok: false, erreur: "bande-pleine" };
        return { ok: true, etat: "ajoute", effets: await construireEffetsArrivee(relations, "bande-acceptee", cibleId, compteId) };
      }
      const mienne = demande(compteId, cibleId);
      if (mienne && mienne.creeLe.getTime() >= depuis) return { ok: true, etat: "deja", effets: [] };
      if (taille(compteId) >= MAX_BANDE) return { ok: false, erreur: "bande-pleine" };
      if (tables.demandes.filter((d) => d.deId === compteId && d.creeLe.getTime() >= depuis).length >= MAX_DEMANDES_BANDE_EN_ATTENTE) {
        return { ok: false, erreur: "trop-de-demandes-en-attente" };
      }
      // « Qu'on me trouve par mon pseudo » éteint : refus dit franchement, rien n'est écrit (même règle que bande.ts)
      if (tables.profils.get(cibleId)?.trouvable === false) return { ok: false, erreur: "demandes-fermees" };
      retirer(tables.demandes, (d) => (d.deId === cibleId && d.aId === compteId) || (d.deId === compteId && d.aId === cibleId));
      tables.demandes.push({ deId: compteId, aId: cibleId, creeLe: maintenant, refuseeLe: null });
      return { ok: true, etat: "demande", effets: [] };
    },

    async accepter(compteId, deId, maintenant) {
      // Déjà potes (deux touchers) : ok, sans rien de plus (même règle que bande.ts)
      if (sontPotes(compteId, deId)) return { ok: true, effets: [] };
      const sienne = demande(deId, compteId);
      if (!sienne || sienne.creeLe.getTime() < debutDemandesValides(maintenant).getTime() || bloquesEnMemoire(tables, compteId, deId)) {
        return { ok: false, erreur: "demande-inconnue" };
      }
      if (!lier(compteId, deId, maintenant)) return { ok: false, erreur: "bande-pleine" };
      return { ok: true, effets: await construireEffetsArrivee(relations, "bande-acceptee", deId, compteId) };
    },

    async retirerDemande(compteId, autreId, maintenant) {
      retirer(tables.demandes, (d) => d.deId === compteId && d.aId === autreId);
      const sienne = demande(autreId, compteId);
      if (sienne && sienne.refuseeLe === null) sienne.refuseeLe = maintenant;
    },

    async retirer(compteId, poteId, maintenant) {
      if (retirer(tables.bande, (l) => (l.compteId === compteId && l.poteId === poteId) || (l.compteId === poteId && l.poteId === compteId)) === 0) return;
      const auteur = (listeId: number) => tables.listes.get(listeId)?.auteurId;
      retirer(tables.coAuteurs, (c) => c.statut !== "refuse" && (
        (c.compteId === poteId && auteur(c.listeId) === compteId) || (c.compteId === compteId && auteur(c.listeId) === poteId)));
      changerVersionsCommunes(compteId, poteId, maintenant, true);
    },

    async bloquer(compteId, autreId, maintenant) {
      if (autreId === compteId) return { ok: false, erreur: "soi-meme" };
      if (tables.blocages.some((l) => l.bloqueurId === compteId && l.bloqueId === autreId)) return { ok: true };
      if (tables.blocages.filter((l) => l.bloqueurId === compteId).length >= MAX_BLOCAGES) return { ok: false, erreur: "trop-de-blocages" };
      tables.blocages.push({ bloqueurId: compteId, bloqueId: autreId, creeLe: maintenant });
      couperEntre(compteId, autreId, maintenant);
      return { ok: true };
    },

    async debloquer(compteId, autreId) {
      retirer(tables.blocages, (l) => l.bloqueurId === compteId && l.bloqueId === autreId);
    },

    async listerBloques(compteId) {
      const lignes = plusRecentDAbord(tables.blocages.filter((l) => l.bloqueurId === compteId));
      const personnes = await relations.presenter(lignes.map((l) => l.bloqueId));
      return lignes.flatMap((l) => personnes.get(l.bloqueId) ?? []);
    },

    async listerPotes(compteId) {
      const ids = await relations.listerPotes(compteId);
      const personnes = await relations.presenter(ids);
      return ids.flatMap((id) => personnes.get(id) ?? []);
    },

    async estPote(a, b) {
      return sontPotes(a, b);
    },

    async lireActivite(compteId, maintenant) {
      const depuis = debutActivite(maintenant).getTime();
      const potes = potesQuiPartagent(compteId);
      const recent = (l: { compteId: number; creeLe: Date }) => potes.has(l.compteId) && l.creeLe.getTime() >= depuis;
      const publie = (lieuId: number) => tables.lieux.get(lieuId)?.statut === "publie";
      const signalees = new Set([...tables.signalements.values()].filter((s) => s.signaleParId === compteId && s.cible === "liste").map((s) => s.cibleId));
      const masquees = new Set(tables.masques.filter((m) => m.compteId === compteId && m.cible === "activite").map((m) => m.cibleId));
      const vide = { lieuId: null, detail: null, listeId: null };
      const lignes: LigneActivite[] = [
        ...tables.rescousses.flatMap((r, i) => (recent(r) && publie(r.lieuId)
          ? [{ ...vide, type: "rescousse" as const, compteId: r.compteId, id: ID_ACTIVITE.rescousse(i + 1), lieuId: r.lieuId, date: r.creeLe }] : [])),
        ...tables.gardes.flatMap((g) => (recent(g) && publie(g.lieuId)
          ? [{ ...vide, type: "garde" as const, compteId: g.compteId, id: ID_ACTIVITE.garde(potes.get(g.compteId)!, g.lieuId), lieuId: g.lieuId, date: g.creeLe }] : [])),
        ...[...tables.listes.values()].flatMap((l) => (recent({ compteId: l.auteurId, creeLe: l.creeLe }) && !l.suspendueLe && !l.retireeLe && !signalees.has(String(l.id))
          ? [{ ...vide, type: "liste" as const, compteId: l.auteurId, id: ID_ACTIVITE.liste(l.id), detail: l.titre, listeId: l.id, date: l.creeLe }] : [])),
      ];
      const page = lignes
        .filter((l) => !masquees.has(l.id))
        .sort((a, b) => b.date.getTime() - a.date.getTime() || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0))
        .slice(0, MAX_ACTIVITES);
      return presenterActivites(page, await relations.presenter(page.map((l) => l.compteId)));
    },

    async lireClassement(compteId, maintenant) {
      const debut = calculerDebutMoisParis(maintenant.getTime());
      const duMois = (l: { compteId: number; creeLe: Date }, id: number) => l.compteId === id && l.creeLe.getTime() >= debut;
      const potes = plusRecentDAbord(tables.bande.filter((l) => l.compteId === compteId && potesQuiPartagent(compteId).has(l.poteId))).map((l) => l.poteId);
      const totaux = [compteId, ...potes].map((id) => ({
        compteId: id,
        pointsDuMois: tables.journalPoints.filter((j) => duMois(j, id)).reduce((somme, j) => somme + j.points, 0),
        rescoussesDuMois: tables.rescousses.filter((r) => duMois(r, id)).length,
      }));
      return construireClassement(totaux, await relations.presenter(totaux.map((t) => t.compteId)), compteId, maintenant);
    },
  };

  /** Mes potes qui partagent leur activité, avec un pseudo, sans blocage : compte → identifiant public */
  function potesQuiPartagent(compteId: number): Map<number, string> {
    const potes = new Map<number, string>();
    for (const l of tables.bande) {
      if (l.compteId !== compteId) continue;
      const p = tables.profils.get(l.poteId);
      if (p?.activitePartagee && tables.comptes.get(l.poteId)?.pseudo && !bloquesEnMemoire(tables, compteId, l.poteId)) potes.set(l.poteId, p.idPublic);
    }
    return potes;
  }

  return bande;
}
