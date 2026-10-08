import type { PublicEnvoi } from "~/services/courriels.ts";

/** À qui part un envoi, en clair, pour le suivi : « Inscrits · Sète · bêta-testeurs · iPhone · 12 sur 15 cochés ». */
export function decrirePublic(cible: PublicEnvoi, coches: number, total: number): string {
  const morceaux =
    cible.public === "newsletter"
      ? ["Inscrits", cible.ville, cible.candidats && "candidats ambassadeurs", cible.beta && "bêta-testeurs", cible.telephone === "iphone" ? "iPhone" : cible.telephone === "android" ? "Android" : ""]
      : [cible.statut === "actif" ? "Ambassadeurs actifs" : "Ambassadeurs (sauf refusés)", cible.ville];
  return [...morceaux.filter(Boolean), coches === total ? `${total} au total` : `${coches} sur ${total} cochés`].join(" · ");
}
