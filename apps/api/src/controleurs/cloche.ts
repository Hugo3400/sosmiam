// La cloche du compte connecté (voir routes/cloche.ts) : lue sans jamais créer le profil social, et sans pseudo (les
// décisions de la modération y arrivent aussi).
import type { Request, Response } from "express";

import { lireProfilSocialPose } from "../middlewares/profil-social.ts";
import { lireIdentifiant } from "../middlewares/proteger-pro.ts";
import type { DependancesSocialApp } from "../routes/social-app.ts";
import { lireCorps } from "./comptes-champs.ts";
import { ChampInvalide } from "./gestion/lire-champs.ts";
import { lireCurseurApres, refuserSocial } from "./social-champs.ts";

function lireJusqua(requete: Request): Date | null {
  const brut = lireCorps(requete).jusqua;
  if (brut === undefined || brut === null) return null;
  const lu = typeof brut === "string" && brut.length <= 40 ? Date.parse(brut) : Number.NaN;
  if (Number.isNaN(lu)) throw new ChampInvalide("jusqua");
  return new Date(lu);
}

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
      const vuesLe = await d.cloche.marquerVu(moi(reponse), lireJusqua(requete) ?? maintenant, maintenant);
      reponse.json({ ok: true, vuesLe: vuesLe.toISOString() });
    },

    async effacer(requete: Request, reponse: Response) {
      const id = lireIdentifiant(requete.params.id);
      if (id === null) throw new ChampInvalide("id");
      if (!(await d.cloche.effacer(moi(reponse), id))) throw refuserSocial("notification-inconnue");
      reponse.json({ ok: true });
    },

    async effacerLues(requete: Request, reponse: Response) {
      const jusqua = lireJusqua(requete);
      const effacees = await d.cloche.effacerLues(moi(reponse), jusqua, new Date(horloge()));
      reponse.json({ ok: true, effacees });
    },
  };
}
