// Double en mémoire des suivis entre personnes (contrat dans suivis-personnes-regles.ts), posé sur les tables partagées :
// mêmes règles que suivis-personnes.ts. Chaque geste qui écrit le fait d'un seul tenant, sans attente entre la vérification
// et l'écriture (le verrou des deux comptes de la base). Compte.prive est celui de la Map des comptes partagée avec
// comptes-en-memoire.ts : PATCH /comptes/moi/profil et PUT /app/suivis-personnes/confidentialite voient le même.
import { MAX_ABONNEMENTS } from "../../../../packages/commun/src/regles/suivis.ts";
import type { RelationsSociales } from "./relations-sociales-regles.ts";
import type { ServicesSocial } from "./social-regles.ts";
import {
  construireResume, debutDemandesSuiviValides, DEMANDES_SUIVI_LUES, effetDemandeAcceptee, effetNouvelAbonne,
  type ServicesSuivisPersonnes,
} from "./suivis-personnes-regles.ts";
import { bloquesEnMemoire, type TablesSociales } from "./tables-sociales-en-memoire.ts";

/** Plus récent d'abord ; à la même milliseconde, le dernier écrit d'abord */
const plusRecentDAbord = <T extends { creeLe: Date }>(lignes: readonly T[]) => [...lignes].reverse().sort((a, b) => b.creeLe.getTime() - a.creeLe.getTime());

export function creerSuivisPersonnesEnMemoire(tables: TablesSociales, relations: RelationsSociales, social: Pick<ServicesSocial, "listerLiens">): ServicesSuivisPersonnes {
  const ligne = (suiveurId: number, suiviId: number) => tables.suivis.find((s) => s.suiveurId === suiveurId && s.suiviId === suiviId);
  const retirerLigne = (quoi: (s: (typeof tables.suivis)[number]) => boolean) => {
    for (let i = tables.suivis.length - 1; i >= 0; i--) if (quoi(tables.suivis[i]!)) tables.suivis.splice(i, 1);
  };
  async function listerMiens(compteId: number, sens: "abonnes" | "abonnements", apres: string | null) {
    const page = await social.listerLiens(compteId, compteId, sens, apres);
    return page === "ferme" ? { liens: [], suite: null } : page;
  }
  function accepterEnAttente(compteId: number, maintenant: Date): number[] {
    const depuis = debutDemandesSuiviValides(maintenant).getTime();
    const demandes = tables.suivis.filter((s) => s.suiviId === compteId && s.statut === "demande" && s.creeLe.getTime() >= depuis);
    for (const d of demandes) Object.assign(d, { statut: "accepte", accepteLe: maintenant });
    return demandes.map((d) => d.suiveurId);
  }

  return {
    async lireResume(compteId, maintenant) {
      const depuis = debutDemandesSuiviValides(maintenant).getTime();
      const valide = (s: { creeLe: Date }) => s.creeLe.getTime() >= depuis;
      const recues = plusRecentDAbord(tables.suivis.filter((s) => s.suiviId === compteId && s.statut === "demande" && valide(s))).slice(0, DEMANDES_SUIVI_LUES);
      const envoyees = plusRecentDAbord(tables.suivis.filter((s) => s.suiveurId === compteId && s.statut !== "accepte" && valide(s))).slice(0, DEMANDES_SUIVI_LUES);
      const personnes = await relations.presenter([...recues.map((d) => d.suiveurId), ...envoyees.map((d) => d.suiviId)]);
      return construireResume({
        prive: tables.comptes.get(compteId)?.prive ?? false,
        abonnes: tables.suivis.filter((s) => s.suiviId === compteId && s.statut === "accepte").length,
        abonnements: tables.suivis.filter((s) => s.suiveurId === compteId && s.statut === "accepte").length,
      }, recues, envoyees, personnes);
    },

    listerAbonnes: (compteId, apres) => listerMiens(compteId, "abonnes", apres),
    listerAbonnements: (compteId, apres) => listerMiens(compteId, "abonnements", apres),

    async suivre(compteId, cibleId, maintenant) {
      if (cibleId === compteId) return { ok: false, erreur: "soi-meme" };
      if (bloquesEnMemoire(tables, compteId, cibleId)) return { ok: false, erreur: "personne-inconnue" };
      const existant = ligne(compteId, cibleId);
      if (existant?.statut === "accepte") return { ok: true, etat: "suivi", deja: true, effets: [] };
      if (existant && existant.creeLe.getTime() >= debutDemandesSuiviValides(maintenant).getTime()) return { ok: true, etat: "demande", deja: true, effets: [] };
      if (!existant && tables.suivis.filter((s) => s.suiveurId === compteId && s.statut !== "refuse").length >= MAX_ABONNEMENTS) {
        return { ok: false, erreur: "trop-d-abonnements" };
      }
      const cible = tables.comptes.get(cibleId);
      if (!cible) return { ok: false, erreur: "personne-inconnue" };
      const nouvelle = { statut: cible.prive ? "demande" : "accepte", creeLe: maintenant, accepteLe: cible.prive ? null : maintenant };
      if (existant) Object.assign(existant, nouvelle);
      else tables.suivis.push({ suiveurId: compteId, suiviId: cibleId, ...nouvelle });
      if (cible.prive) return { ok: true, etat: "demande", deja: false, effets: [] };
      const enRetour = ligne(cibleId, compteId)?.statut === "accepte";
      return { ok: true, etat: "suivi", deja: false, effets: [effetNouvelAbonne(cibleId, compteId, enRetour)] };
    },

    async nePlusSuivre(compteId, cibleId) {
      retirerLigne((s) => s.suiveurId === compteId && s.suiviId === cibleId);
    },

    async accepter(compteId, deId, maintenant) {
      const personne = (await relations.presenter([deId])).get(deId);
      const demande = ligne(deId, compteId);
      if (!demande || !personne || bloquesEnMemoire(tables, compteId, deId)) return { ok: false, erreur: "demande-inconnue" };
      if (demande.statut === "accepte") return { ok: true, lien: { personne, depuis: (demande.accepteLe ?? demande.creeLe).toISOString() }, effets: [] };
      if (demande.creeLe.getTime() < debutDemandesSuiviValides(maintenant).getTime()) return { ok: false, erreur: "demande-inconnue" };
      Object.assign(demande, { statut: "accepte", accepteLe: maintenant });
      return { ok: true, lien: { personne, depuis: maintenant.toISOString() }, effets: [effetDemandeAcceptee(deId, compteId)] };
    },

    async refuser(compteId, deId) {
      const demande = ligne(deId, compteId);
      if (demande?.statut === "demande") demande.statut = "refuse";
    },

    async retirerAbonne(compteId, abonneId) {
      retirerLigne((s) => s.suiveurId === abonneId && s.suiviId === compteId && s.statut === "accepte");
    },

    async changerConfidentialite(compteId, prive, maintenant) {
      const compte = tables.comptes.get(compteId);
      if (compte) compte.prive = prive;
      const acceptes = prive ? [] : accepterEnAttente(compteId, maintenant);
      return { prive, acceptees: acceptes.length, effets: acceptes.map((id) => effetDemandeAcceptee(id, compteId)) };
    },

    async accepterDemandesEnAttente(compteId, maintenant) {
      return accepterEnAttente(compteId, maintenant).map((id) => effetDemandeAcceptee(id, compteId));
    },
  };
}
