import type { Request, Response } from "express";

import { lireLangue } from "../../../../packages/commun/src/fonctions/langue/lire-langue.ts";
import { lireCompteId, lireCorps } from "./comptes-champs.ts";
import type { ServicesComptes } from "./comptes.ts";
import { ChampInvalide } from "./gestion/lire-champs.ts";

export function creerControleurLangueCompte(services: Pick<ServicesComptes, "changerLangue">) {
  return async function changerLangue(requete: Request, reponse: Response) {
    const langue = lireLangue(lireCorps(requete).langue);
    if (!langue) throw new ChampInvalide("langue");
    await services.changerLangue(lireCompteId(reponse), langue);
    reponse.json({ ok: true, langue });
  };
}
