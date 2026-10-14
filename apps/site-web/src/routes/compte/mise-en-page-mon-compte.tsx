import { Outlet } from "react-router";

import type { Route } from "./+types/mise-en-page-mon-compte";
import { CadrePublic } from "~/composants/mise-en-page/CadrePublic";
import { CadrePro } from "~/composants/pro/CadrePro";
import { lireEspaceHote } from "~/fonctions/hotes/lire-espace-hote";
import { choisirLieuMenu } from "~/fonctions/pro/choisir-lieu-menu";
import { lireCompteConnecte } from "~/services/session-compte.server";

/**
 * Page propre à chaque personne : jamais gardée par un cache (Cloudflare, navigateur), redirections comprises, et jamais
 * dans un moteur de recherche (en plus de la balise « robots » de la page : robots.txt ne la ferme pas, pour que les
 * moteurs puissent lire ce « noindex » malgré le lien du pied de page).
 */
export const middleware: Route.MiddlewareFunction[] = [
  async (_, suite) => {
    const reponse = await suite();
    if (reponse instanceof Response) {
      reponse.headers.set("Cache-Control", "private, no-store");
      reponse.headers.set("X-Robots-Tag", "noindex");
    }
    return reponse;
  },
];

/** Sur pro.sosmiam.fr : connecté ou non, et le lieu des liens du menu pro. Ailleurs, le cadre public n'a besoin de rien. */
export async function loader({ request }: Route.LoaderArgs) {
  if (lireEspaceHote(new URL(request.url).host) !== "pro") return { espace: "site" as const, connecte: false, lieuMenu: null };
  const connecte = await lireCompteConnecte(request);
  return { espace: "pro" as const, connecte: connecte !== null, lieuMenu: connecte ? choisirLieuMenu(connecte.compte, Number.NaN) : null };
}

/**
 * Cadre de /mon-compte, une seule adresse pour deux espaces : sur pro.sosmiam.fr, le « Mon compte » de l'espace pro (son
 * cadre) ; sur sosmiam.fr, celui du site principal (le cadre public). Le partage des hôtes est dans
 * fonctions/hotes/choisir-redirection-hote.ts ; la page dans routes/compte/mon-compte.tsx.
 */
export default function MiseEnPageMonCompte({ loaderData }: Route.ComponentProps) {
  if (loaderData.espace === "pro") {
    return <CadrePro connecte={loaderData.connecte} lieuMenu={loaderData.lieuMenu}><Outlet /></CadrePro>;
  }
  return <CadrePublic><Outlet /></CadrePublic>;
}
