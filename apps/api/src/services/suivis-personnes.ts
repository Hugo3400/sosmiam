// Suivre une personne, dans la base (contrat dans suivis-personnes-regles.ts). Suivre et accepter se font sous le verrou
// des deux comptes, blocage relu dans la même transaction : un geste lancé au moment d'un blocage ne recrée rien. Les pages
// d'abonnés et d'abonnements sont celles du profil social (social.listerLiens : curseur avec l'identifiant public, jamais
// l'id d'un compte). L'id d'un compte ne sort jamais d'ici.
import { MAX_ABONNEMENTS } from "../../../../packages/commun/src/regles/suivis.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import type { RelationsSociales, TransactionSociale } from "./relations-sociales-regles.ts";
import type { ServicesSocial } from "./social-regles.ts";
import {
  construireResume, debutDemandesSuiviValides, DEMANDES_SUIVI_LUES, effetDemandeAcceptee, effetNouvelAbonne,
  type ResultatSuivre, type ServicesSuivisPersonnes,
} from "./suivis-personnes-regles.ts";

/** Accepte, dans la transaction, les demandes en attente (pas refusées, pas expirées) faites à `compteId` ; rend qui suit désormais */
async function accepterEnAttente(tx: TransactionSociale, compteId: number, maintenant: Date): Promise<number[]> {
  const demandes = await tx.suiviPersonne.findMany({
    where: { suiviId: compteId, statut: "demande", creeLe: { gte: debutDemandesSuiviValides(maintenant) } },
    select: { suiveurId: true },
  });
  const ids = demandes.map((d) => d.suiveurId);
  if (ids.length === 0) return [];
  await tx.suiviPersonne.updateMany({ where: { suiviId: compteId, statut: "demande", suiveurId: { in: ids } }, data: { statut: "accepte", accepteLe: maintenant } });
  return ids;
}

export function creerSuivisPersonnes(o: { relations: RelationsSociales; social: Pick<ServicesSocial, "listerLiens">; base?: typeof baseDeDonnees }): ServicesSuivisPersonnes {
  const { relations, social } = o;
  const base = o.base ?? baseDeDonnees;
  /** Mes propres abonnés ou abonnements : le profil social sait les lire (jamais « ferme » pour soi) */
  async function listerMiens(compteId: number, sens: "abonnes" | "abonnements", apres: string | null) {
    const page = await social.listerLiens(compteId, compteId, sens, apres);
    return page === "ferme" ? { liens: [], suite: null } : page;
  }

  const suivis: ServicesSuivisPersonnes = {
    async lireResume(compteId, maintenant) {
      const depuis = debutDemandesSuiviValides(maintenant);
      const [compte, abonnes, abonnements, recues, envoyees] = await Promise.all([
        base.compte.findUnique({ where: { id: compteId }, select: { prive: true } }),
        base.suiviPersonne.count({ where: { suiviId: compteId, statut: "accepte" } }),
        base.suiviPersonne.count({ where: { suiveurId: compteId, statut: "accepte" } }),
        base.suiviPersonne.findMany({
          where: { suiviId: compteId, statut: "demande", creeLe: { gte: depuis } },
          select: { suiveurId: true, creeLe: true }, orderBy: [{ creeLe: "desc" }, { suiveurId: "desc" }], take: DEMANDES_SUIVI_LUES,
        }),
        // Refusées comprises, montrées « demande » : celui qui suit ne sait pas qu'elles l'ont été
        base.suiviPersonne.findMany({
          where: { suiveurId: compteId, statut: { in: ["demande", "refuse"] }, creeLe: { gte: depuis } },
          select: { suiviId: true, creeLe: true }, orderBy: [{ creeLe: "desc" }, { suiviId: "desc" }], take: DEMANDES_SUIVI_LUES,
        }),
      ]);
      const personnes = await relations.presenter([...recues.map((d) => d.suiveurId), ...envoyees.map((d) => d.suiviId)]);
      return construireResume({ prive: compte?.prive ?? false, abonnes, abonnements }, recues, envoyees, personnes);
    },

    listerAbonnes: (compteId, apres) => listerMiens(compteId, "abonnes", apres),
    listerAbonnements: (compteId, apres) => listerMiens(compteId, "abonnements", apres),

    async suivre(compteId, cibleId, maintenant): Promise<ResultatSuivre> {
      if (cibleId === compteId) return { ok: false, erreur: "soi-meme" };
      const depuis = debutDemandesSuiviValides(maintenant);
      return base.$transaction(async (tx): Promise<ResultatSuivre> => {
        await relations.verrouillerComptes(tx, [compteId, cibleId]);
        if (await relations.bloqueEntre(compteId, cibleId, tx)) return { ok: false, erreur: "personne-inconnue" };
        const cle = { suiveurId_suiviId: { suiveurId: compteId, suiviId: cibleId } };
        const existant = await tx.suiviPersonne.findUnique({ where: cle, select: { statut: true, creeLe: true } });
        if (existant?.statut === "accepte") return { ok: true, etat: "suivi", deja: true, effets: [] };
        // Demande déjà partie, ou refusée en silence : elle ne repart pas avant ses 30 jours
        if (existant && existant.creeLe >= depuis) return { ok: true, etat: "demande", deja: true, effets: [] };
        if (!existant && (await tx.suiviPersonne.count({ where: { suiveurId: compteId, statut: { in: ["accepte", "demande"] } } })) >= MAX_ABONNEMENTS) {
          return { ok: false, erreur: "trop-d-abonnements" };
        }
        const cible = await tx.compte.findUnique({ where: { id: cibleId }, select: { prive: true } });
        if (!cible) return { ok: false, erreur: "personne-inconnue" };
        const statut = cible.prive ? "demande" : "accepte";
        const ligne = { statut, creeLe: maintenant, accepteLe: cible.prive ? null : maintenant };
        await tx.suiviPersonne.upsert({ where: cle, create: { suiveurId: compteId, suiviId: cibleId, ...ligne }, update: ligne });
        if (cible.prive) return { ok: true, etat: "demande", deja: false, effets: [] };
        const enRetour = (await tx.suiviPersonne.count({ where: { suiveurId: cibleId, suiviId: compteId, statut: "accepte" } })) > 0;
        return { ok: true, etat: "suivi", deja: false, effets: [effetNouvelAbonne(cibleId, compteId, enRetour)] };
      });
    },

    async nePlusSuivre(compteId, cibleId) {
      await base.suiviPersonne.deleteMany({ where: { suiveurId: compteId, suiviId: cibleId } });
    },

    async accepter(compteId, deId, maintenant) {
      const depuis = debutDemandesSuiviValides(maintenant);
      const issue = await base.$transaction(async (tx) => {
        await relations.verrouillerComptes(tx, [compteId, deId]);
        const cle = { suiveurId_suiviId: { suiveurId: deId, suiviId: compteId } };
        const demande = await tx.suiviPersonne.findUnique({ where: cle, select: { statut: true, creeLe: true, accepteLe: true } });
        if (!demande || (await relations.bloqueEntre(compteId, deId, tx))) return null;
        // Déjà acceptée (deux touchers) : rien de plus
        if (demande.statut === "accepte") return { depuis: demande.accepteLe ?? demande.creeLe, nouveau: false };
        if (demande.creeLe < depuis) return null;
        await tx.suiviPersonne.update({ where: cle, data: { statut: "accepte", accepteLe: maintenant } });
        return { depuis: maintenant, nouveau: true };
      });
      const personne = issue ? (await relations.presenter([deId])).get(deId) : undefined;
      if (!issue || !personne) return { ok: false, erreur: "demande-inconnue" };
      return { ok: true, lien: { personne, depuis: issue.depuis.toISOString() }, effets: issue.nouveau ? [effetDemandeAcceptee(deId, compteId)] : [] };
    },

    async refuser(compteId, deId) {
      await base.suiviPersonne.updateMany({ where: { suiveurId: deId, suiviId: compteId, statut: "demande" }, data: { statut: "refuse" } });
    },

    async retirerAbonne(compteId, abonneId) {
      await base.suiviPersonne.deleteMany({ where: { suiveurId: abonneId, suiviId: compteId, statut: "accepte" } });
    },

    async changerConfidentialite(compteId, prive, maintenant) {
      const acceptes = await base.$transaction(async (tx) => {
        await tx.compte.update({ where: { id: compteId }, data: { prive }, select: { id: true } });
        return prive ? [] : accepterEnAttente(tx, compteId, maintenant);
      });
      return { prive, acceptees: acceptes.length, effets: acceptes.map((id) => effetDemandeAcceptee(id, compteId)) };
    },

    async accepterDemandesEnAttente(compteId, maintenant) {
      const acceptes = await base.$transaction((tx) => accepterEnAttente(tx, compteId, maintenant));
      return acceptes.map((id) => effetDemandeAcceptee(id, compteId));
    },
  };
  return suivis;
}
