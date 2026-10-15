import { choisirArriveesDepuisAttente } from "../fonctions/communaute/choisir-arrivees-depuis-attente.ts";
import type { EffetSocial } from "./effets-sociaux-regles.ts";
import { annoncer } from "./communaute-effets.ts";
import { lireNouveaux } from "./communaute-profils.ts";
import type { ContexteCommunaute, LigneParticipationMiamis, LigneSortieMiamis, TablesCommunaute } from "./communaute-regles.ts";
import { retirerExclus, type SortieLue } from "./communaute-sorties-lecture.ts";

export async function ouvrirSortie(t: TablesCommunaute, id: number, maintenant: Date): Promise<SortieLue | null> {
  const ligne = await t.verrouillerSortie(id);
  if (!ligne || ligne.annuleeLe !== null || ligne.retireeLe !== null) return null;
  const participations = await t.lireParticipations([id]);
  const [lue] = await retirerExclus(t, [{ ligne, participations }]);
  const gardes = new Set(lue!.participations);
  for (const p of participations) if (!gardes.has(p)) await sortir(t, ligne, p, "refuse", maintenant);
  return lue!;
}

export async function sortir(t: TablesCommunaute, ligne: LigneSortieMiamis, p: LigneParticipationMiamis, statut: "refuse" | "desiste" | null, maintenant: Date): Promise<void> {
  if (statut === null) await t.effacerParticipation(ligne.id, p.compteId);
  else await t.ecrireParticipation({ ...p, statut, decideLe: maintenant });
  if (p.statut === "accepte" && ligne.conversationId !== null) await t.retirerMembre(ligne.conversationId, p.compteId, maintenant);
}

export async function entrer(t: TablesCommunaute, ligne: LigneSortieMiamis, p: LigneParticipationMiamis, maintenant: Date): Promise<void> {
  await t.ecrireParticipation({ ...p, statut: "accepte", decideLe: maintenant });
  if (ligne.conversationId !== null) await t.ajouterMembre(ligne.conversationId, p.compteId, maintenant);
}

export async function lireNouveauxDe(t: TablesCommunaute, participations: readonly LigneParticipationMiamis[], enPlus: readonly number[], maintenant: Date): Promise<Set<number>> {
  return lireNouveaux(await t.lireComptes([...new Set([...participations.map((p) => p.compteId), ...enPlus])]), maintenant);
}

export async function remplirDepuisAttente(c: ContexteCommunaute, t: TablesCommunaute, ligne: LigneSortieMiamis, maintenant: Date): Promise<EffetSocial[]> {
  const participations = await t.lireParticipations([ligne.id]);
  const nouveaux = await lireNouveauxDe(t, participations, [], maintenant);
  const arrivees = choisirArriveesDepuisAttente(ligne, participations, nouveaux, maintenant);
  for (const compteId of arrivees) await entrer(t, ligne, participations.find((p) => p.compteId === compteId)!, maintenant);
  return annoncer(c.relations, {
    type: "place-liberee-miamis", acteurId: null, cible: { type: "miamis", id: ligne.id }, detail: ligne.titre, destinataires: arrivees,
    push: () => ({ quoi: "place", titre: ligne.titre, sortieId: ligne.id }),
  });
}

export const avecStatut = (participations: readonly LigneParticipationMiamis[], ...statuts: string[]) =>
  participations.filter((p) => statuts.includes(p.statut)).map((p) => p.compteId);
