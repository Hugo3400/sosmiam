import type { Request, Response } from "express";

import type { ChoixGenre } from "../../../../packages/commun/src/types/genre.ts";
import type { ServicesCommunaute } from "../services/communaute-regles.ts";
import type { ContexteRoutesSociales, DependancesSocialApp } from "../routes/social-app.ts";
import { lireCorps } from "./comptes-champs.ts";
import { moi, repondreCommunaute } from "./communaute-champs.ts";
import { ChampInvalide } from "./gestion/lire-champs.ts";
import { lirePersonne } from "./social-champs.ts";

const CHOIX_GENRE: readonly ChoixGenre[] = ["femme", "homme", "autre", "ne-pas-dire"];

function lireChoix(requete: Request): ChoixGenre {
  const choix = lireCorps(requete).choix;
  if (!CHOIX_GENRE.includes(choix as ChoixGenre)) throw new ChampInvalide("choix");
  return choix as ChoixGenre;
}

export function lireVisibleDemande(requete: Request): boolean | null {
  const visible = lireCorps(requete).visible;
  return typeof visible === "boolean" ? visible : null;
}

export function creerControleursCommunaute(
  communaute: ServicesCommunaute, d: Pick<DependancesSocialApp, "relations">, contexte: Pick<ContexteRoutesSociales, "horloge" | "appliquer">,
) {
  const maintenant = () => new Date(contexte.horloge());
  const rendreGenre = (ok: { genre: unknown }) => ({ genre: ok.genre });

  return {
    async lireGenre(_requete: Request, reponse: Response) {
      await repondreCommunaute(reponse, contexte.appliquer, await communaute.genre.lire(moi(reponse)), rendreGenre);
    },
    async choisirGenre(requete: Request, reponse: Response) {
      const choix = lireChoix(requete);
      await repondreCommunaute(reponse, contexte.appliquer, await communaute.genre.choisir(moi(reponse), choix, maintenant()), rendreGenre);
    },
    async effacerGenre(_requete: Request, reponse: Response) {
      await repondreCommunaute(reponse, contexte.appliquer, await communaute.genre.effacer(moi(reponse), maintenant()), rendreGenre);
    },

    async lireQuiEstLa(_requete: Request, reponse: Response) {
      reponse.json({ ok: true, ...(await communaute.quiEstLa.lire(moi(reponse), maintenant())) });
    },
    async choisirVisibilite(requete: Request, reponse: Response) {
      const visible = lireVisibleDemande(requete);
      if (visible === null) throw new ChampInvalide("visible");
      const r = visible ? await communaute.quiEstLa.montrer(moi(reponse), maintenant()) : await communaute.quiEstLa.cacher(moi(reponse), maintenant());
      await repondreCommunaute(reponse, contexte.appliquer, r, (ok) => ({ visible: ok.visible, jusqua: ok.jusqua }));
    },
    async faireCoucou(requete: Request, reponse: Response) {
      const compteId = moi(reponse);
      const personne = await lirePersonne(requete, d.relations, compteId);
      const r = await communaute.quiEstLa.faireCoucou(compteId, personne, maintenant());
      await repondreCommunaute(reponse, contexte.appliquer, r, (ok) => ({ coucou: ok.coucou }));
    },

    async lireFil(_requete: Request, reponse: Response) {
      reponse.json({ ok: true, evenements: await communaute.fil.lire(moi(reponse), maintenant()) });
    },
  };
}
