import { compterPlacesLibres } from "../../../../packages/commun/src/fonctions/sorties-miamis/compter-places-libres.ts";
import { peutVoirSortieMiamis } from "../../../../packages/commun/src/fonctions/sorties-miamis/peut-voir-sortie-miamis.ts";
import { calculerOccupationSortie } from "../fonctions/communaute/calculer-occupation-sortie.ts";
import { lirePublicSortie } from "../fonctions/communaute/lire-public-sortie.ts";
import { annoncerTout, type AnnonceCommunaute } from "./communaute-effets.ts";
import { lireProfilsVisibilite } from "./communaute-profils.ts";
import { refus, type ContexteCommunaute, type Refus, type ServicesSortiesMiamis, type TablesCommunaute } from "./communaute-regles.ts";
import type { LectureSortiesMiamis, SortieLue } from "./communaute-sorties-lecture.ts";
import { avecStatut, entrer, lireNouveauxDe, ouvrirSortie, remplirDepuisAttente, sortir } from "./communaute-sorties-outils.ts";

type Geste = (t: TablesCommunaute, lue: SortieLue, personne: number, maintenant: Date) => Promise<Refus | AnnonceCommunaute[]>;

export function creerGestesOrganisateur(c: ContexteCommunaute, lecture: LectureSortiesMiamis): Pick<ServicesSortiesMiamis, "accepter" | "refuser" | "retirer"> {
  function enOrganisateur(geste: Geste, inconnue: "demande-inconnue" | "personne-inconnue") {
    return async (moi: number, id: number, personne: number | null, maintenant: Date) => {
      const issue = await c.depot.ecrire(async (t) => {
        await t.verrouillerComptes(personne === null ? [moi] : [moi, personne]);
        const lue = await ouvrirSortie(t, id, maintenant);
        if (!lue || (lue.ligne.organisateurId !== moi && !lue.participations.some((p) => p.compteId === moi))) return refus("sortie-inconnue");
        if (lue.ligne.organisateurId !== moi) return refus("reserve-a-l-organisateur");
        if (personne === null || personne === moi) return refus(inconnue);
        return geste(t, lue, personne, maintenant);
      });
      if (!Array.isArray(issue)) return issue;
      const sortie = await lecture.rendre(moi, id, maintenant);
      return sortie ? { ok: true as const, sortie, effets: await annoncerTout(c.relations, issue) } : refus("sortie-inconnue");
    };
  }

  async function genePourLaSortie(t: TablesCommunaute, lue: SortieLue, personne: number, maintenant: Date): Promise<boolean> {
    const presents = [lue.ligne.organisateurId, ...avecStatut(lue.participations, "accepte", "attente")].filter((id) => id !== personne);
    for (const autre of presents) if (await t.bloqueEntre(personne, autre)) return true;
    const profil = (await lireProfilsVisibilite(c, t, [personne], maintenant)).get(personne);
    return !profil || !peutVoirSortieMiamis(lirePublicSortie(lue.ligne.publicType, lue.ligne.publicValeur), profil);
  }

  const accepter: Geste = async (t, lue, personne, maintenant) => {
    const { ligne, participations } = lue;
    const sienne = participations.find((p) => p.compteId === personne);
    if (sienne?.statut !== "demande") return refus("demande-inconnue");
    if (ligne.quand.getTime() <= maintenant.getTime()) return refus("sortie-passee");
    if (await genePourLaSortie(t, lue, personne, maintenant)) {
      await t.effacerParticipation(ligne.id, personne);
      return refus("demande-inconnue");
    }
    const nouveaux = await lireNouveauxDe(t, participations, [personne], maintenant);
    const libres = compterPlacesLibres(calculerOccupationSortie(ligne, participations, nouveaux, maintenant), nouveaux.has(personne));
    const cible = { type: "miamis" as const, id: ligne.id };
    if (libres > 0) {
      await entrer(t, ligne, sienne, maintenant);
      return [{
        type: "arrivee-acceptee", acteurId: ligne.organisateurId, cible, detail: ligne.titre, destinataires: [personne],
        push: (prenom) => ({ quoi: "acceptee", prenom, titre: ligne.titre, sortieId: ligne.id }),
      }];
    }
    await t.ecrireParticipation({ ...sienne, statut: "attente", decideLe: maintenant });
    return [{ type: "liste-attente-miamis", acteurId: ligne.organisateurId, cible, detail: ligne.titre, destinataires: [personne] }];
  };

  const refuser: Geste = async (t, lue, personne, maintenant) => {
    const sienne = lue.participations.find((p) => p.compteId === personne);
    if (sienne?.statut !== "demande") return refus("demande-inconnue");
    await t.ecrireParticipation({ ...sienne, statut: "refuse", decideLe: maintenant });
    return [];
  };

  const retirer: Geste = async (t, lue, personne, maintenant) => {
    const sienne = lue.participations.find((p) => p.compteId === personne);
    if (!sienne || !["accepte", "attente", "invite"].includes(sienne.statut)) return refus("personne-inconnue");
    await sortir(t, lue.ligne, sienne, "refuse", maintenant);
    return lue.ligne.quand.getTime() > maintenant.getTime() ? remplirDepuisAttente(t, lue.ligne, maintenant) : [];
  };

  return {
    accepter: enOrganisateur(accepter, "demande-inconnue"),
    refuser: enOrganisateur(refuser, "demande-inconnue"),
    retirer: enOrganisateur(retirer, "personne-inconnue"),
  };
}
