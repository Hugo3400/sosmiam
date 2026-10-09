import { Outlet } from "react-router";

import type { Route } from "./+types/mise-en-page-pro";
import { CadrePro } from "~/composants/pro/CadrePro";
import { lireLieuxDuCompte } from "~/services/pro.server";
import { lireCompteConnecte } from "~/services/session-compte.server";

/** Pages propres à chaque personne : jamais gardées par un cache (Cloudflare, navigateur), redirections comprises. */
export const middleware: Route.MiddlewareFunction[] = [
  async (_, suite) => {
    const reponse = await suite();
    if (reponse instanceof Response) reponse.headers.set("Cache-Control", "private, no-store");
    return reponse;
  },
];

/**
 * Pour l'en-tête : connecté ou non, et le lieu des liens du menu (celui de l'adresse s'il est à toi et vérifié, sinon ton
 * premier lieu vérifié). Rien d'autre ne part vers le navigateur.
 */
export async function loader({ request, params }: Route.LoaderArgs) {
  const connecte = await lireCompteConnecte(request);
  if (!connecte) return { connecte: false, lieuMenu: null, exemple: false };
  const { lieux, exemple } = await lireLieuxDuCompte(connecte.compte);
  const valides = lieux.filter((lieu) => lieu.statut === "valide");
  const idAdresse = Number("id" in params ? params.id : NaN);
  const lieuMenu = valides.find((lieu) => lieu.lieuId === idAdresse)?.lieuId ?? valides[0]?.lieuId ?? null;
  return { connecte: true, lieuMenu, exemple };
}

/** Cadre de l'espace pro (https://pro.sosmiam.fr) : voir composants/pro/CadrePro.tsx. */
export default function MiseEnPagePro({ loaderData }: Route.ComponentProps) {
  return (
    <CadrePro connecte={loaderData.connecte} lieuMenu={loaderData.lieuMenu} exemple={loaderData.exemple}>
      <Outlet />
    </CadrePro>
  );
}
