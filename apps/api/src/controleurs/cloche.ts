// La cloche du compte connecté (voir routes/cloche.ts) : lue sans jamais créer le profil social, et sans pseudo (les
// décisions de la modération y arrivent aussi).
import type { Request, Response } from "express";

import { lireProfilSocialPose } from "../middlewares/profil-social.ts";
import type { DependancesSocialApp } from "../routes/social-app.ts";
import { lireCorps } from "./comptes-champs.ts";
import { ChampInvalide } from "./gestion/lire-champs.ts";
import { lireCurseurApres } from "./social-champs.ts";

export function creerControleursCloche(d: Pick<DependancesSocialApp, "cloche">, horloge: () => number) {
  const moi = (reponse: Response) => lireProfilSocialPose(reponse).compteId;
  return {
    /** GET /app/cloche[?apres=] */
    async lister(requete: Request, reponse: Response) {
      reponse.json({ ok: true, cloche: await d.cloche.lister(moi(reponse), lireCurseurApres(requete)) });
    },

    /** POST /app/cloche/vu { jusqua?: date ISO } : sans jusqua, maintenant */
    async marquerVu(requete: Request, reponse: Response) {
      const maintenant = new Date(horloge());
      const brut = lireCorps(requete).jusqua;
      let jusqua = maintenant;
      if (brut !== undefined && brut !== null) {
        const lu = typeof brut === "string" && brut.length <= 40 ? Date.parse(brut) : Number.NaN;
        if (Number.isNaN(lu)) throw new ChampInvalide("jusqua");
        jusqua = new Date(lu);
      }
      const vuesLe = await d.cloche.marquerVu(moi(reponse), jusqua, maintenant);
      reponse.json({ ok: true, vuesLe: vuesLe.toISOString() });
    },
  };
}
