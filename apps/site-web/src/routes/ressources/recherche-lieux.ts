import type { Route } from "./+types/recherche-lieux";

import { chercherLieux } from "~/services/pro.server";
import { lireCompteConnecte, lireIpVisiteur } from "~/services/session-compte.server";

/**
 * GET /recherche-lieux?texte=… (pro.sosmiam.fr) : les lieux proposés au fil de la frappe dans « Chercher mon lieu »
 * (/rattacher), quand JavaScript est là. Le navigateur n'appelle jamais l'API lui-même : cette route le fait pour lui, avec
 * sa session et son IP. Sans JavaScript, /rattacher fait la même recherche côté serveur (formulaire GET).
 * Réponse : { ok: true, lieux: [{ id, nom, emoji, type, quartier, ville, statut, estVerifie }] } ou { ok: false, erreur }
 * (401, 429, 502).
 */
export async function loader({ request }: Route.LoaderArgs) {
  const entetes = { "Cache-Control": "private, no-store" };
  const connecte = await lireCompteConnecte(request);
  if (!connecte) return Response.json({ ok: false, erreur: "session-expiree" }, { status: 401, headers: entetes });
  const texte = (new URL(request.url).searchParams.get("texte") ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  if (texte.length < 2) return Response.json({ ok: true, lieux: [] }, { headers: entetes });
  const reponse = await chercherLieux(texte, connecte.jeton, lireIpVisiteur(request));
  if (!reponse.ok) {
    return Response.json({ ok: false, erreur: reponse.erreur }, { status: reponse.erreur === "trop-de-demandes" ? 429 : 502, headers: entetes });
  }
  const lieux = reponse.lieux.slice(0, 10).map(({ id, nom, emoji, type, quartier, ville, statut, estVerifie }) => ({ id, nom, emoji, type, quartier, ville, statut, estVerifie }));
  return Response.json({ ok: true, lieux }, { headers: entetes });
}
