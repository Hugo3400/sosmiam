// Les listes de lieux dans la base (contrat et règles dans listes-regles.ts). Les quotas durables se comptent sous verrou :
// la ligne du compte pour les 50 listes, la ligne de la liste pour ses 100 lieux et ses 10 co-auteurs (SELECT … FOR UPDATE).
// Inviter un co-auteur verrouille d'abord les deux comptes, puis la liste (même ordre que les sorties).
import { calculerNiveauProfil } from "../../../../packages/commun/src/regles/calculer-niveau-profil.ts";
import { MAX_CO_AUTEURS_LISTE, MAX_LIEUX_PAR_LISTE, MAX_LISTES_PAR_COMPTE } from "../../../../packages/commun/src/regles/listes.ts";
import { peutVoirListe } from "../../../../packages/commun/src/fonctions/social/peut-voir-liste.ts";
import type { ListeResumeApi } from "../../../../packages/commun/src/types/listes.ts";
import type { NiveauProfil } from "../../../../packages/commun/src/types/social.ts";
import { Prisma } from "../base-de-donnees/client-genere/client.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { ecrireCurseurDate } from "../fonctions/social/ecrire-curseur-date.ts";
import { lireCurseurDate } from "../fonctions/social/lire-curseur-date.ts";
import { presenterListeDetail } from "../fonctions/social/presenter-liste-detail.ts";
import { presenterListeResume } from "../fonctions/social/presenter-liste-resume.ts";
import { DUREE_REFUS_CO_AUTEUR_JOURS, LISTES_PAR_PAGE, MAX_LISTES_PAR_RUBRIQUE, type RefusListe, type ServicesListes } from "./listes-regles.ts";
import { AUCUN_LIEN, type RelationsSociales } from "./relations-sociales-regles.ts";

const JOUR_MS = 24 * 60 * 60 * 1000;
const refus = (erreur: RefusListe) => ({ ok: false, erreur }) as const;
/** Seuls les lieux encore publiés sont montrés et comptés */
const LIEU_PUBLIE = { lieu: { statut: "publie" } } satisfies Prisma.LieuDeListeWhereInput;

/** Ce qu'on lit d'une liste pour la montrer en petit */
const CHAMPS_LISTE = {
  id: true, auteurId: true, titre: true, emoji: true, description: true, visibilite: true, modifieLe: true, suspendueLe: true, retireeLe: true,
  _count: { select: { lieux: { where: LIEU_PUBLIE }, abonnes: true } },
} satisfies Prisma.ListeLieuxSelect;
type LigneListe = Prisma.ListeLieuxGetPayload<{ select: typeof CHAMPS_LISTE }>;
const ORDRE_MODIFICATION = [{ modifieLe: "desc" }, { id: "desc" }] satisfies Prisma.ListeLieuxOrderByWithRelationInput[];

/** La clé Idempotency-Key a été notée par une autre demande au même moment : on annule la transaction, puis on relit */
class CleDejaNotee extends Error {}

/**
 * Verrou des deux comptes d'une invitation de co-auteur (FOR NO KEY UPDATE, dans l'ordre des id), avant la liste : un
 * blocage (bande.ts, ses deux comptes FOR UPDATE) attend la fin du geste et efface alors l'invitation, ou le geste l'attend
 * et le voit. « NO KEY » : un lieu ajouté sous le verrou de la liste prend FOR KEY SHARE sur le compte de celui qui l'ajoute.
 */
async function verrouillerComptesDuGeste(tx: Prisma.TransactionClient, compteIds: readonly number[]): Promise<void> {
  const ids = [...new Set(compteIds)].filter((id) => Number.isSafeInteger(id) && id > 0).sort((a, b) => a - b);
  if (ids.length > 0) await tx.$queryRaw`SELECT id FROM comptes WHERE id IN (${Prisma.join(ids)}) ORDER BY id FOR NO KEY UPDATE`;
}

export function creerListes(o: { relations: RelationsSociales; base?: typeof baseDeDonnees }): ServicesListes {
  const { relations } = o;
  const base = o.base ?? baseDeDonnees;

  /** Garde, parmi ces listes, celles que `compteId` voit (B.5), dans le même ordre */
  async function filtrerVisibles(compteId: number, listes: readonly LigneListe[]): Promise<LigneListe[]> {
    const autres = listes.filter((l) => l.auteurId !== compteId);
    if (autres.length === 0) return [...listes];
    const auteurs = [...new Set(autres.map((l) => l.auteurId))];
    const ids = autres.map((l) => l.id);
    const [liens, comptes, coEcrites, signalees] = await Promise.all([
      relations.lireLiens(compteId, auteurs),
      base.compte.findMany({ where: { id: { in: auteurs } }, select: { id: true, prive: true } }),
      base.coAuteurListe.findMany({ where: { compteId, statut: "accepte", listeId: { in: ids } }, select: { listeId: true } }),
      base.signalement.findMany({ where: { signaleParId: compteId, cible: "liste", cibleId: { in: ids.map(String) } }, select: { cibleId: true } }),
    ]);
    const prive = new Map(comptes.map((c) => [c.id, c.prive]));
    const coAuteur = new Set(coEcrites.map((c) => c.listeId));
    const cachees = new Set(signalees.map((s) => s.cibleId));
    const niveau = (auteurId: number): NiveauProfil | null => {
      const lien = liens.get(auteurId) ?? AUCUN_LIEN;
      if (lien.bloqueParMoi || lien.mABloque) return null;
      return calculerNiveauProfil({ prive: prive.get(auteurId) ?? false }, { estMoi: false, pote: lien.pote, abonne: lien.jeSuis === "suivi" });
    };
    return listes.filter((l) => {
      if (l.auteurId === compteId) return true;
      const n = niveau(l.auteurId);
      if (n === null || l.suspendueLe || l.retireeLe || cachees.has(String(l.id))) return false;
      return peutVoirListe({ visibilite: l.visibilite === "bande" ? "bande" : "tous" }, n, coAuteur.has(l.id));
    });
  }
  async function resumer(listes: readonly LigneListe[]): Promise<ListeResumeApi[]> {
    const auteurs = await relations.presenter(listes.map((l) => l.auteurId));
    return listes.flatMap(({ _count, ...l }) => {
      const auteur = auteurs.get(l.auteurId);
      return auteur ? [presenterListeResume({ ...l, nombreLieux: _count.lieux, abonnes: _count.abonnes }, auteur)] : [];
    });
  }
  /** La liste si `compteId` la voit, sinon null */
  async function lireVisible(compteId: number, listeId: number): Promise<LigneListe | null> {
    const liste = await base.listeLieux.findUnique({ where: { id: listeId }, select: CHAMPS_LISTE });
    if (!liste) return null;
    const [visible] = await filtrerVisibles(compteId, [liste]);
    return visible ?? null;
  }
  async function detailler(compteId: number, listeId: number) {
    const liste = await base.listeLieux.findUnique({
      where: { id: listeId },
      select: {
        ...CHAMPS_LISTE,
        lieux: { where: LIEU_PUBLIE, select: { lieuId: true }, orderBy: [{ creeLe: "desc" }, { lieuId: "desc" }] },
        coAuteurs: { select: { compteId: true, statut: true }, orderBy: [{ creeLe: "asc" }, { compteId: "asc" }] },
        abonnes: { where: { compteId }, select: { compteId: true } },
      },
    });
    if (!liste) return null;
    const { lieux, coAuteurs, abonnes, ...ligne } = liste;
    const [[resume], personnes, { caches }] = await Promise.all([
      resumer([ligne]), relations.presenter(coAuteurs.map((c) => c.compteId)), relations.listerBlocages(compteId),
    ]);
    if (!resume) return null;
    return presenterListeDetail(resume, { moi: compteId, auteurId: ligne.auteurId, lieux: lieux.map((l) => l.lieuId), coAuteurs, abonne: abonnes.length > 0, personnes, caches });
  }
  /** La liste relue après un geste ; liste-inconnue si elle a disparu entre-temps */
  async function rendre(compteId: number, listeId: number) {
    const detail = await detailler(compteId, listeId);
    return detail ? ({ ok: true, liste: detail } as const) : refus("liste-inconnue");
  }
  const verrouiller = (tx: Prisma.TransactionClient, listeId: number) => tx.$queryRaw`SELECT id FROM listes_lieux WHERE id = ${listeId} FOR UPDATE`;
  const toucher = (tx: Prisma.TransactionClient, listeId: number, maintenant: Date) =>
    tx.listeLieux.update({ where: { id: listeId }, data: { modifieLe: maintenant }, select: { id: true } });
  /** Les listes de ces lignes (co-auteurs, abonnements), visibles, les plus récemment modifiées d'abord */
  async function listesVisibles(compteId: number, where: Prisma.ListeLieuxWhereInput) {
    const listes = await base.listeLieux.findMany({ where, select: CHAMPS_LISTE, orderBy: ORDRE_MODIFICATION, take: MAX_LISTES_PAR_RUBRIQUE });
    return resumer(await filtrerVisibles(compteId, listes));
  }

  return {
    async listerMiennes(compteId) {
      const [miennes, coEcrites, suivies, invitations] = await Promise.all([
        base.listeLieux.findMany({ where: { auteurId: compteId }, select: CHAMPS_LISTE, orderBy: ORDRE_MODIFICATION }).then(resumer),
        listesVisibles(compteId, { coAuteurs: { some: { compteId, statut: "accepte" } } }),
        listesVisibles(compteId, { abonnes: { some: { compteId } } }),
        listesVisibles(compteId, { coAuteurs: { some: { compteId, statut: "invite" } } }),
      ]);
      return { miennes, coEcrites, suivies, invitations };
    },

    async listerADecouvrir(compteId, apres) {
      const curseur = lireCurseurDate(apres) ?? null;
      const [potes, suivis, { caches }, masques, signalees] = await Promise.all([
        relations.listerPotes(compteId),
        base.suiviPersonne.findMany({ where: { suiveurId: compteId, statut: "accepte" }, select: { suiviId: true } }),
        relations.listerBlocages(compteId),
        base.elementMasque.findMany({ where: { compteId, cible: "liste" }, select: { cibleId: true } }),
        base.signalement.findMany({ where: { signaleParId: compteId, cible: "liste" }, select: { cibleId: true } }),
      ]);
      const deLaBande = potes.filter((id) => !caches.has(id));
      const bande = new Set(deLaBande);
      // Quelqu'un que tu suis (sans être dans ta bande) : niveau « public », seulement ses listes « tous »
      const suivisSeuls = [...new Set(suivis.map((s) => s.suiviId))].filter((id) => !bande.has(id) && !caches.has(id) && id !== compteId);
      if (deLaBande.length === 0 && suivisSeuls.length === 0) return { listes: [], suite: null };
      const exclues = [...masques, ...signalees].map((m) => Number(m.cibleId)).filter((id) => Number.isSafeInteger(id) && id > 0);
      const lignes = await base.listeLieux.findMany({
        where: {
          AND: [
            { suspendueLe: null, retireeLe: null, auteurId: { not: compteId } },
            { OR: [{ auteurId: { in: deLaBande } }, { auteurId: { in: suivisSeuls }, visibilite: "tous" }] },
            exclues.length === 0 ? {} : { id: { notIn: exclues } },
            // Celles que tu remplis avec leur auteur sont déjà « à toi »
            { coAuteurs: { none: { compteId, statut: "accepte" } } },
            !curseur ? {} : { OR: [{ modifieLe: { lt: curseur.date } }, { modifieLe: curseur.date, id: { lt: curseur.id } }] },
          ],
        },
        select: CHAMPS_LISTE,
        orderBy: ORDRE_MODIFICATION,
        take: LISTES_PAR_PAGE + 1,
      });
      const page = lignes.slice(0, LISTES_PAR_PAGE);
      const derniere = page.at(-1);
      return {
        listes: await resumer(page),
        suite: lignes.length > LISTES_PAR_PAGE && derniere ? ecrireCurseurDate(derniere.modifieLe, derniere.id) : null,
      };
    },

    async lire(compteId, listeId) {
      return (await lireVisible(compteId, listeId)) ? detailler(compteId, listeId) : null;
    },

    async creer(compteId, l, cle, maintenant) {
      const rejouer = async (listeId: number) => {
        const detail = (await lireVisible(compteId, listeId)) ? await detailler(compteId, listeId) : null;
        return detail ? ({ ok: true, liste: detail, cree: false } as const) : refus("liste-inconnue");
      };
      const deja = await relations.lireIdempotence(compteId, cle, "liste");
      if (deja !== null) return rejouer(deja);
      let resultat: { ok: false; erreur: RefusListe } | { deja: number } | { listeId: number };
      try {
        resultat = await base.$transaction(async (tx) => {
          // Sous le verrou du compte : deux créations en même temps ne dépassent pas les 50 listes
          await relations.verrouillerComptes(tx, [compteId]);
          const dejaFaite = await relations.lireIdempotence(compteId, cle, "liste", tx);
          if (dejaFaite !== null) return { deja: dejaFaite };
          if ((await tx.listeLieux.count({ where: { auteurId: compteId } })) >= MAX_LISTES_PAR_COMPTE) return refus("trop-de-listes");
          const liste = await tx.listeLieux.create({ data: { auteurId: compteId, ...l, creeLe: maintenant, modifieLe: maintenant }, select: { id: true } });
          if (!(await relations.noterIdempotence(compteId, cle, "liste", liste.id, maintenant, tx))) throw new CleDejaNotee();
          return { listeId: liste.id };
        });
      } catch (erreur) {
        if (!(erreur instanceof CleDejaNotee)) throw erreur;
        const relue = await relations.lireIdempotence(compteId, cle, "liste");
        return relue === null ? refus("cle-deja-prise") : rejouer(relue);
      }
      if ("ok" in resultat) return resultat;
      if ("deja" in resultat) return rejouer(resultat.deja);
      const detail = await detailler(compteId, resultat.listeId);
      return detail ? { ok: true, liste: detail, cree: true } : refus("liste-inconnue");
    },

    async modifier(compteId, listeId, m, maintenant) {
      const liste = await lireVisible(compteId, listeId);
      if (!liste) return refus("liste-inconnue");
      if (liste.auteurId !== compteId) return refus("reserve-a-l-auteur");
      if (Object.keys(m).length > 0) await base.listeLieux.update({ where: { id: listeId }, data: { ...m, modifieLe: maintenant }, select: { id: true } });
      return rendre(compteId, listeId);
    },

    async supprimer(compteId, listeId) {
      const liste = await lireVisible(compteId, listeId);
      if (!liste) return refus("liste-inconnue");
      if (liste.auteurId !== compteId) return refus("reserve-a-l-auteur");
      // Ses lieux, co-auteurs et abonnés partent avec elle (cascade) ; un signalement garde son instantané
      await base.listeLieux.deleteMany({ where: { id: listeId, auteurId: compteId } });
      return { ok: true };
    },

    async basculerLieu(compteId, listeId, lieuId, oui, maintenant) {
      const liste = await lireVisible(compteId, listeId);
      if (!liste) return refus("liste-inconnue");
      const auteur = liste.auteurId === compteId;
      const resultat = await base.$transaction(async (tx) => {
        await verrouiller(tx, listeId);
        // Le droit de remplir, relu sous le verrou (un co-auteur retiré entre-temps n'ajoute plus rien)
        if (!auteur && (await tx.coAuteurListe.count({ where: { listeId, compteId, statut: "accepte" } })) === 0) return refus("reserve-a-l-auteur");
        const ligne = await tx.lieuDeListe.findUnique({ where: { listeId_lieuId: { listeId, lieuId } }, select: { ajouteParId: true } });
        if (oui) {
          if ((await tx.lieu.count({ where: { id: lieuId, statut: "publie" } })) === 0) return refus("lieu-inconnu");
          if (ligne) return null;
          if ((await tx.lieuDeListe.count({ where: { listeId } })) >= MAX_LIEUX_PAR_LISTE) return refus("liste-pleine");
          await tx.lieuDeListe.create({ data: { listeId, lieuId, ajouteParId: compteId, creeLe: maintenant }, select: { listeId: true } });
        } else {
          if (!ligne) return null;
          // Un co-auteur ne retire que les lieux qu'il a ajoutés lui-même
          if (!auteur && ligne.ajouteParId !== compteId) return refus("reserve-a-l-auteur");
          await tx.lieuDeListe.delete({ where: { listeId_lieuId: { listeId, lieuId } } });
        }
        await toucher(tx, listeId, maintenant);
        return null;
      });
      return resultat ?? rendre(compteId, listeId);
    },

    async inviterCoAuteur(compteId, listeId, invite, maintenant) {
      const liste = await lireVisible(compteId, listeId);
      if (!liste) return refus("liste-inconnue");
      if (liste.auteurId !== compteId) return refus("reserve-a-l-auteur");
      if (invite === compteId) return refus("champ-invalide");
      const resultat = await base.$transaction(async (tx) => {
        await verrouillerComptesDuGeste(tx, [compteId, invite]);
        await verrouiller(tx, listeId);
        const pote = (await tx.membreBande.count({ where: { compteId, poteId: invite } })) > 0;
        if (!pote || (await relations.bloqueEntre(compteId, invite, tx))) return refus("pas-dans-la-bande");
        const ligne = await tx.coAuteurListe.findUnique({ where: { listeId_compteId: { listeId, compteId: invite } }, select: { statut: true, creeLe: true, reponduLe: true } });
        const refusRecent = ligne?.statut === "refuse" && maintenant.getTime() - (ligne.reponduLe ?? ligne.creeLe).getTime() < DUREE_REFUS_CO_AUTEUR_JOURS * JOUR_MS;
        // Déjà là, ou refus de moins de 30 jours : la même réponse, sans rien envoyer
        if ((ligne && ligne.statut !== "refuse") || refusRecent) return { invite: false };
        if ((await tx.coAuteurListe.count({ where: { listeId, statut: { in: ["invite", "accepte"] } } })) >= MAX_CO_AUTEURS_LISTE) return refus("trop-de-co-auteurs");
        await tx.coAuteurListe.upsert({
          where: { listeId_compteId: { listeId, compteId: invite } },
          create: { listeId, compteId: invite, statut: "invite", creeLe: maintenant },
          update: { statut: "invite", creeLe: maintenant, reponduLe: null },
          select: { listeId: true },
        });
        return { invite: true };
      });
      if ("ok" in resultat) return resultat;
      const r = await rendre(compteId, listeId);
      if (!r.ok) return r;
      const effets = resultat.invite
        ? [{ quoi: "cloche" as const, notification: { compteId: invite, type: "liste-coauteur" as const, acteurId: compteId, cible: { type: "liste" as const, id: String(listeId) }, detail: liste.titre } }]
        : [];
      return { ...r, effets };
    },

    async accepterCoAuteur(compteId, listeId, maintenant) {
      const liste = await base.listeLieux.findUnique({ where: { id: listeId }, select: { auteurId: true, suspendueLe: true, retireeLe: true } });
      if (!liste || liste.suspendueLe || liste.retireeLe) return refus("invitation-inconnue");
      const accepte = await base.$transaction(async (tx) => {
        await verrouiller(tx, listeId);
        const pote = (await tx.membreBande.count({ where: { compteId: liste.auteurId, poteId: compteId } })) > 0;
        if (!pote || (await relations.bloqueEntre(compteId, liste.auteurId, tx))) return false;
        const { count } = await tx.coAuteurListe.updateMany({ where: { listeId, compteId, statut: "invite" }, data: { statut: "accepte", reponduLe: maintenant } });
        return count > 0;
      });
      return accepte ? rendre(compteId, listeId) : refus("invitation-inconnue");
    },

    async retirerCoAuteur(compteId, listeId, membre, maintenant) {
      if (membre === "moi") {
        await base.$transaction(async (tx) => {
          await tx.coAuteurListe.updateMany({ where: { listeId, compteId, statut: "invite" }, data: { statut: "refuse", reponduLe: maintenant } });
          await tx.coAuteurListe.deleteMany({ where: { listeId, compteId, statut: "accepte" } });
        });
        return { ok: true };
      }
      const liste = await lireVisible(compteId, listeId);
      if (!liste) return refus("liste-inconnue");
      if (liste.auteurId !== compteId) return refus("reserve-a-l-auteur");
      // Un refus reste noté (l'auteur ne le voit pas) : le retirer permettrait de réinviter en boucle
      await base.coAuteurListe.deleteMany({ where: { listeId, compteId: membre, statut: { in: ["invite", "accepte"] } } });
      return { ok: true };
    },

    async basculerAbonnement(compteId, listeId, oui, maintenant) {
      const liste = await lireVisible(compteId, listeId);
      if (!liste) return refus("liste-inconnue");
      if (liste.auteurId === compteId) return refus("champ-invalide");
      if (oui) await base.abonnementListe.createMany({ data: [{ listeId, compteId, creeLe: maintenant }], skipDuplicates: true });
      else await base.abonnementListe.deleteMany({ where: { listeId, compteId } });
      return rendre(compteId, listeId);
    },
  };
}
