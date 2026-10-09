import type { Route } from "./+types/communes";

import { chercherCommunes } from "~/services/fondateurs.server";
import { lireIpVisiteur } from "~/services/session-compte.server";

/**
 * GET /communes?recherche=… : les communes proposées au fil de la frappe dans « Ta ville » (page /programme et
 * candidature de fondateur), quand JavaScript est là. Le navigateur n'appelle jamais l'API lui-même : cette route le fait
 * pour lui, avec son IP pour les limites. Sans JavaScript, les pages font la même recherche côté serveur (formulaire GET).
 * Réponse : { ok: true, communes: [{ code, nom, nomDepartement, codePostal }] } ou { ok: false, erreur } (429, 502).
 */
export async function loader({ request }: Route.LoaderArgs) {
  const recherche = (new URL(request.url).searchParams.get("recherche") ?? "").trim().slice(0, 80);
  if (recherche.length < 2) return Response.json({ ok: true, communes: [] }, { headers: { "Cache-Control": "public, max-age=3600" } });
  const reponse = await chercherCommunes(recherche, lireIpVisiteur(request), 8);
  if (!reponse.ok) {
    const statut = reponse.erreur === "trop-de-demandes" ? 429 : 502;
    return Response.json({ ok: false, erreur: reponse.erreur }, { status: statut, headers: { "Cache-Control": "no-store" } });
  }
  const communes = reponse.communes.map(({ code, nom, nomDepartement, codePostal }) => ({ code, nom, nomDepartement, codePostal: codePostal ?? null }));
  // Les communes ne changent qu'une fois par an : une heure en cache, comme l'API
  return Response.json({ ok: true, communes }, { headers: { "Cache-Control": "public, max-age=3600" } });
}
