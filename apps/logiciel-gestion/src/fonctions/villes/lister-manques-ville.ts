import type { LancementVille } from "~/services/villes.ts";

/** Ce qui manque encore à une ville avant de l'annoncer, en phrases courtes (vide : tout a de quoi, c'est Hugo qui juge). */
export function listerManquesVille(point: LancementVille): string[] {
  const manques: string[] = [];
  const { lieux, ambassadeurs, fondateurs, public: gens } = point;
  if (lieux.enLigne === 0) manques.push(lieux.brouillonsComplets > 0 ? `Aucun lieu en ligne : ${lieux.brouillonsComplets} brouillon(s) complet(s) n'attendent que toi` : "Aucun lieu en ligne");
  if (lieux.enLigne > 0 && lieux.quiValident === 0) manques.push("Aucun lieu en ligne ne valide encore les visites");
  if (lieux.enLigne > 0 && lieux.verifies === 0) manques.push("Aucun lieu vérifié par un compte pro");
  if (lieux.rattachementsEnAttente > 0) manques.push(`${lieux.rattachementsEnAttente} demande(s) de compte pro à trancher`);
  if (!ambassadeurs.ambassadeurDeVille) manques.push("Pas d'ambassadeur de ville");
  if (ambassadeurs.enAttente > 0) manques.push(`${ambassadeurs.enAttente} inscription(s) d'ambassadeur à valider`);
  if (fondateurs && fondateurs.prises === 0) manques.push("Aucune place de fondateur prise");
  if ((gens.inscrits ?? 0) + gens.appareils === 0) manques.push("Personne à prévenir pour l'instant");
  return manques;
}
