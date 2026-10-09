// Vues de la fiche d'un lieu dans l'app (voir routes/vues-lieux.ts), sans pister personne. Une vue par visiteur, par lieu et
// par jour de Paris. Le visiteur n'est reconnu que par une empreinte HMAC, avec un secret tiré chaque jour et jamais écrit, de
// son adresse IP (son préfixe /56 en IPv6, calculerCleVisiteur), du jour et du lieu. Les empreintes restent en mémoire jusqu'à
// minuit (heure de Paris), puis tout est oublié, secret compris. Seul le compteur du jour du lieu est écrit dans la base.
import { createHmac, randomBytes } from "node:crypto";

import type { Request, Response } from "express";

import { calculerClesPeriodes } from "../fonctions/dates/calculer-cles-periodes.ts";
import { calculerCleVisiteur } from "../fonctions/securite/calculer-cle-visiteur.ts";
import { lireIdentifiant } from "../middlewares/proteger-pro.ts";
import { VUES_RETENUES_MAX, type ServicesVuesLieux } from "../services/vues-lieux-regles.ts";

export type DependancesVuesLieux = {
  services: ServicesVuesLieux;
  /** L'heure qu'il est (Date.now par défaut ; réglable dans les tests) */
  horloge?: () => number;
  /** Visiteurs × lieux reconnus pour la journée, au plus (VUES_RETENUES_MAX par défaut ; plus petit dans les tests) */
  retenuesMax?: number;
};

const lieuInconnu = (reponse: Response) => reponse.status(404).json({ ok: false, erreur: "lieu-inconnu" });

export function creerControleursVuesLieux({ services, horloge = Date.now, retenuesMax = VUES_RETENUES_MAX }: DependancesVuesLieux) {
  let jour = "";
  let secret = randomBytes(32);
  /** Les empreintes des vues déjà comptées aujourd'hui */
  const comptees = new Set<string>();

  return {
    /** POST /app/lieux/:id/vue */
    async compter(requete: Request, reponse: Response) {
      const lieuId = lireIdentifiant(requete.params.id);
      if (lieuId === null) return lieuInconnu(reponse);
      const aujourdhui = calculerClesPeriodes(new Date(horloge())).jour;
      if (aujourdhui !== jour) {
        // Minuit est passé à Paris : tout ce qui permettait de reconnaître les visiteurs d'hier est oublié
        jour = aujourdhui;
        secret = randomBytes(32);
        comptees.clear();
      }
      const visiteur = calculerCleVisiteur(requete.get("x-ip-visiteur") || requete.socket.remoteAddress || "inconnu");
      const empreinte = createHmac("sha256", secret).update(`${visiteur}\n${jour}\n${lieuId}`).digest("base64url").slice(0, 22);
      // Déjà comptée aujourd'hui, ou plus de place pour s'en souvenir : rien de plus à écrire
      if (comptees.has(empreinte) || comptees.size >= retenuesMax) return reponse.status(204).end();
      // Retenue avant d'écrire : deux appels simultanés du même visiteur ne comptent qu'une vue
      comptees.add(empreinte);
      let comptee = false;
      try {
        comptee = await services.ajouterVue(lieuId, jour);
      } finally {
        // Lieu non publié ou écriture ratée : on l'oublie (un nouvel essai pourra compter)
        if (!comptee) comptees.delete(empreinte);
      }
      if (!comptee) return lieuInconnu(reponse);
      reponse.status(204).end();
    },
  };
}
