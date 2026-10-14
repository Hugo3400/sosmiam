import { choisirOrganisateurSortie } from "../../../../../packages/commun/src/fonctions/sorties/choisir-organisateur-sortie.ts";

/**
 * L'organisateur qui a la main sur une sortie (choisirOrganisateurSortie) : celui de la colonne tant qu'il y participe,
 * sinon (il est parti, ou son compte supprimé a vidé la colonne) le plus ancien participant ; null s'il ne reste personne.
 * acceptees : les invitations « accepte » de la sortie, dans n'importe quel ordre ; l'arrivée d'un participant est sa
 * réponse (« Je viens »), sinon son invitation. Une seule règle pour la sortie (assemblerSortie) et pour le blocage
 * (bande.ts), qui sort le bloqué des sorties où tu as la main.
 */
export function trouverOrganisateurEffectif(
  organisateurId: number | null,
  acceptees: readonly { compteId: number; creeLe: Date; reponduLe: Date | null }[],
): number | null {
  // Les identifiants passent en texte pour la fonction commune (ils ne sortent jamais d'ici)
  const choisi = choisirOrganisateurSortie(
    organisateurId === null ? null : String(organisateurId),
    acceptees.map((i) => ({ id: String(i.compteId), depuis: (i.reponduLe ?? i.creeLe).toISOString() })),
  );
  return choisi === null ? null : Number(choisi);
}
