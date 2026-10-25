import type { Route } from "./+types/epingles-lieux";

import { lireFiltresLieux } from "~/fonctions/page-lieux/lire-filtres-lieux";
import { listerEpinglesLieux } from "~/services/page-lieux.server";
import { lireIpVisiteur } from "~/services/session-compte.server";

export async function loader({ request }: Route.LoaderArgs) {
  const { ville, type } = lireFiltresLieux(new URL(request.url).searchParams);
  const reponse = await listerEpinglesLieux({ ville, type }, lireIpVisiteur(request));
  if (!reponse.ok) {
    return Response.json({ ok: false, erreur: reponse.erreur }, { status: reponse.erreur === "absente" ? 404 : 502, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
  }
  return Response.json({ ok: true, epingles: reponse.donnees }, { headers: { "Cache-Control": "public, max-age=60", "X-Robots-Tag": "noindex" } });
}
