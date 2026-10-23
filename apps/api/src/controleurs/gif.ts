import type { Request, Response } from "express";

import { LONGUEUR_MAX_RECHERCHE_GIF, MAX_PAGE_GIF } from "../../../../packages/commun/src/regles/chat.ts";
import type { ClientGif } from "../services/giphy.ts";
import { lireCompteId } from "./comptes-champs.ts";
import { ChampInvalide } from "./gestion/lire-champs.ts";
import { refuserSocial } from "./social-champs.ts";

const ERREURS_GIF: Readonly<Record<string, number>> = { "gif-indisponible": 503 };

function lirePage(requete: Request): number {
  const brut = requete.query.page;
  if (brut === undefined) return 0;
  if (typeof brut !== "string" || !/^\d{1,2}$/.test(brut) || Number(brut) > MAX_PAGE_GIF) throw new ChampInvalide("page");
  return Number(brut);
}

function lireRecherche(requete: Request): string {
  const brut = requete.query.q;
  const q = typeof brut === "string" ? brut.trim() : "";
  if (q.length === 0 || [...q].length > LONGUEUR_MAX_RECHERCHE_GIF) throw new ChampInvalide("q");
  return q;
}

export function creerControleursGif(gif: ClientGif | null | undefined) {
  async function rendre(reponse: Response, lus: Awaited<ReturnType<ClientGif["tendances"]>>) {
    if (lus === "indisponible") throw refuserSocial("gif-indisponible", ERREURS_GIF);
    reponse.json({ ok: true, gifs: lus });
  }
  const exigerClient = (): ClientGif => {
    if (!gif) throw refuserSocial("gif-indisponible", ERREURS_GIF);
    return gif;
  };
  return {
    async tendances(requete: Request, reponse: Response) {
      const client = exigerClient();
      await rendre(reponse, await client.tendances(lirePage(requete), lireCompteId(reponse)));
    },
    async recherche(requete: Request, reponse: Response) {
      const client = exigerClient();
      const q = lireRecherche(requete);
      await rendre(reponse, await client.chercher(q, lirePage(requete), lireCompteId(reponse)));
    },
  };
}
