// Les signalements des contenus sociaux du compte connecté (voir routes/signalements-sociaux.ts). Un compte suffit, même
// sans pseudo (lireProfilSocial : rien n'est créé). Jamais un texte signalé ni une explication au journal.
import type { Request, Response } from "express";

import { validerSignalementContenu } from "../../../../packages/commun/src/validation/valider-signalement-contenu.ts";
import { lireProfilSocialPose } from "../middlewares/profil-social.ts";
import type { DependancesSocialApp } from "../routes/social-app.ts";
import type { AppliquerEffetsSociaux } from "../services/effets-sociaux-regles.ts";
import { CIBLES_CACHEES_SI_SIGNALEES, type CibleCacheeSiSignalee } from "../services/signalements-sociaux-regles.ts";
import { ChampInvalide } from "./gestion/lire-champs.ts";
import { refuserSocial } from "./social-champs.ts";

/** Statut HTTP des refus métier de ce contrôleur */
const ERREURS: Readonly<Record<string, number>> = { "signalement-invalide": 400, "contenu-inconnu": 404 };

export function creerControleursSignalementsSociaux(d: Pick<DependancesSocialApp, "signalements">, horloge: () => number, appliquer: AppliquerEffetsSociaux) {
  const moi = (reponse: Response) => lireProfilSocialPose(reponse).compteId;
  return {
    /** POST /app/signalements { cible, cibleId, raison, precision, explication } */
    async signaler(requete: Request, reponse: Response) {
      const signalement = validerSignalementContenu(requete.body);
      if (!signalement) throw refuserSocial("signalement-invalide", ERREURS);
      const r = await d.signalements.signaler(moi(reponse), signalement, new Date(horloge()));
      if (!r.ok) throw refuserSocial(r.erreur, ERREURS);
      if (r.deja) return void reponse.json({ ok: true, deja: true });
      await appliquer(r.effets);
      reponse.status(201).json({ ok: true, masquePourTous: r.masquePourTous });
    },

    /** GET /app/signalements/miens?cible=<commentaire|message|liste> */
    async listerMiens(requete: Request, reponse: Response) {
      const cible = requete.query.cible;
      if (typeof cible !== "string" || !(CIBLES_CACHEES_SI_SIGNALEES as readonly string[]).includes(cible)) throw new ChampInvalide("cible");
      reponse.json({ ok: true, cibleIds: await d.signalements.listerMiens(moi(reponse), cible as CibleCacheeSiSignalee) });
    },
  };
}
