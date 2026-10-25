import type { Route } from "./+types/apercu-lieu";

import { lireIdLieu } from "~/fonctions/lieux/lire-id-lieu";
import { lireApercu } from "~/services/page-lieux.server";
import { lireIpVisiteur } from "~/services/session-compte.server";

export async function loader({ request, params }: Route.LoaderArgs) {
  const id = lireIdLieu(params.id);
  const lieu = id === null ? null : await lireApercu(id, lireIpVisiteur(request));
  if (!lieu) return Response.json({ ok: false, erreur: "lieu-inconnu" }, { status: 404, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
  return Response.json({ ok: true, lieu }, { headers: { "Cache-Control": "public, max-age=60", "X-Robots-Tag": "noindex" } });
}
