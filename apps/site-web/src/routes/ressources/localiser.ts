import type { Route } from "./+types/localiser";

import { localiserCommune } from "~/services/localisation.server";

/** GET /localiser : rien à lire ici (l'adresse n'accepte que POST), sans écrire d'erreur dans le journal. */
export function loader() {
  return Response.json({ ok: false, erreur: "methode" }, { status: 405, headers: { Allow: "POST" } });
}

/**
 * POST /localiser { latitude, longitude } : la commune qui contient cette position, pour le bouton « Me localiser »
 * du formulaire d'inscription. En POST pour que la position n'apparaisse pas dans les journaux du serveur (qui notent
 * les adresses des pages). Rien n'est gardé.
 */
export async function action({ request }: Route.ActionArgs) {
  const corps: unknown = await request.json().catch(() => null);
  const { latitude, longitude } = typeof corps === "object" && corps !== null ? (corps as { latitude?: unknown; longitude?: unknown }) : {};
  const resultat = await localiserCommune(latitude, longitude, request.headers.get("x-real-ip"));
  const statut = resultat.ok ? 200 : { "position-invalide": 400, "hors-de-france": 404, "trop-de-demandes": 429, erreur: 502 }[resultat.erreur];
  return Response.json(resultat, { status: statut, headers: { "Cache-Control": "no-store" } });
}
