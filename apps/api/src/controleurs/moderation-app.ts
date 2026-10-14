// Les décisions de la modération du compte connecté et sa contestation (voir routes/moderation-app.ts). Un compte suffit,
// même sans pseudo (lireProfilSocial). Jamais le texte d'une contestation au journal.
import type { Request, Response } from "express";

import { lireProfilSocialPose } from "../middlewares/profil-social.ts";
import { lireIdentifiant } from "../middlewares/proteger-pro.ts";
import type { DependancesSocialApp } from "../routes/social-app.ts";
import { lireCorps } from "./comptes-champs.ts";
import { ChampInvalide } from "./gestion/lire-champs.ts";
import { refuserSocial } from "./social-champs.ts";

/** Statut HTTP des refus métier de ce contrôleur (la contestation hors délai a son propre code : contestation-hors-delai) */
const ERREURS: Readonly<Record<string, number>> = { "decision-inconnue": 404, "deja-contestee": 409, "contestation-hors-delai": 409 };

/** Une contestation : 10 à 1 000 caractères, sans filtre de mots (on peut citer ce qu'on conteste ; elle ne va qu'à l'équipe) */
export const LONGUEUR_MIN_CONTESTATION = 10;
export const LONGUEUR_MAX_CONTESTATION = 1000;

export function creerControleursModerationApp(d: Pick<DependancesSocialApp, "decisions">, horloge: () => number) {
  const moi = (reponse: Response) => lireProfilSocialPose(reponse).compteId;
  return {
    /** GET /app/moderation/mes-decisions */
    async listerDecisions(_requete: Request, reponse: Response) {
      reponse.json({ ok: true, decisions: await d.decisions.listerDecisions(moi(reponse), new Date(horloge())) });
    },

    /** POST /app/moderation/:id/contestation { texte } */
    async contester(requete: Request, reponse: Response) {
      const id = lireIdentifiant(requete.params.id);
      if (id === null) throw new ChampInvalide("id");
      const brut = lireCorps(requete).texte;
      const texte = typeof brut === "string" ? brut.trim() : "";
      if (texte.length < LONGUEUR_MIN_CONTESTATION || texte.length > LONGUEUR_MAX_CONTESTATION) throw new ChampInvalide("texte");
      const r = await d.decisions.contester(moi(reponse), id, texte, new Date(horloge()));
      if (!r.ok) throw refuserSocial(r.erreur, ERREURS);
      reponse.json({ ok: true });
    },
  };
}
