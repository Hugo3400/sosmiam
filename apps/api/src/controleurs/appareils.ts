import type { Request, Response } from "express";

import type { InscriptionAppareil } from "../services/appareils-push.ts";
import type { CompteSession } from "../middlewares/proteger-comptes.ts";

/** Ce que les routes /app/appareils utilisent : le service des téléphones (services/appareils-push.ts) */
export type DependancesAppareils = {
  inscrire: (inscription: InscriptionAppareil) => Promise<void>;
  desinscrire: (jeton: string) => Promise<boolean>;
};

/** Jeton APNs (64 caractères hexadécimaux) ou FCM (plus long, avec « : », « _ », « - ») */
const FORME_JETON_APPAREIL = /^[A-Za-z0-9:_-]{20,400}$/;
const VILLE_MAX = 80;

const refuser = (reponse: Response, champ: string) => reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ });

/**
 * Inscription d'un téléphone aux notifications : le jeton natif (Apple ou Google), la plateforme et la ville choisie dans
 * l'app (jamais une position). Le compte vient de la session si elle est valable, jamais du corps. Rien n'est journalisé.
 */
export function creerControleursAppareils(d: DependancesAppareils) {
  return {
    async inscrire(requete: Request, reponse: Response) {
      const corps = (requete.body ?? {}) as Record<string, unknown>;
      const jeton = typeof corps.jeton === "string" ? corps.jeton.trim() : "";
      if (!FORME_JETON_APPAREIL.test(jeton)) return refuser(reponse, "jeton");
      if (corps.plateforme !== "ios" && corps.plateforme !== "android") return refuser(reponse, "plateforme");
      if (corps.ville !== undefined && corps.ville !== null && typeof corps.ville !== "string") return refuser(reponse, "ville");
      const ville = typeof corps.ville === "string" ? corps.ville.replace(/\s+/g, " ").trim() : "";
      if (ville.length > VILLE_MAX) return refuser(reponse, "ville");
      const compte = reponse.locals.compte as CompteSession | undefined;
      await d.inscrire({ jeton, plateforme: corps.plateforme, ville: ville || null, compteId: compte?.id ?? null });
      reponse.json({ ok: true });
    },
    async desinscrire(requete: Request, reponse: Response) {
      const corps = (requete.body ?? {}) as Record<string, unknown>;
      const jeton = typeof corps.jeton === "string" ? corps.jeton.trim() : "";
      if (!FORME_JETON_APPAREIL.test(jeton)) return refuser(reponse, "jeton");
      // Déjà oublié : rien ne change, c'est réussi quand même
      await d.desinscrire(jeton);
      reponse.json({ ok: true });
    },
  };
}
