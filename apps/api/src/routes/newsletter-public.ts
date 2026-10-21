import express, { Router } from "express";

import { creerControleursNewsletterPublic, type DependancesNewsletterPublic } from "../controleurs/newsletter-public.ts";
import { limiterRequetes } from "../middlewares/limiter-requetes.ts";

/** 30 demandes par visiteur (IP) toutes les 10 minutes : largement assez pour se désinscrire, pas pour essayer des jetons */
export const LIMITE_DESINSCRIPTION = { fenetre: 10 * 60_000, maximum: 30 };

/**
 * /newsletter/… : se désinscrire de la newsletter avec le lien signé des mails (services/liens-desinscription.ts), ou
 * confirmer une inscription avec le lien du mail de confirmation (double confirmation), sans compte ni session. Servi aussi par api.sosmiam.fr (nginx), pour le « un clic » des messageries. Jamais en cache.
 *
 * GET  /newsletter/desinscription?jeton=…  → 200 { ok, email: « c***@gmail.com » } : ne désinscrit PAS
 * POST /newsletter/desinscription?jeton=…  (ou { jeton } en JSON ou en formulaire ; corps « List-Unsubscribe=One-Click »
 *                                          accepté) → 200 { ok } : désinscrit tout de suite, même si l'adresse n'était
 *                                          pas (ou plus) inscrite
 * POST /newsletter/confirmation  { jeton } (JSON) → 200 { ok } : l'inscription en attente (formulaire « Préviens-moi »,
 *                                          ou case d'un compte de l'app créé avec un e-mail et un mot de passe) devient
 *                                          une vraie inscription. Jeton du lien du mail de confirmation (page
 *                                          /confirmer-newsletter du site) : 7 jours, une seule fois ; la base n'en garde
 *                                          que l'empreinte. 400 jeton-invalide : inconnu, déjà servi, remplacé par un
 *                                          lien plus récent ou expiré ; 503 si la confirmation n'est pas branchée
 * Erreurs : 400 jeton-invalide · 429 trop-de-demandes · 503 indisponible (clé des données absente) · 500 erreur-serveur
 */
export function creerRoutesNewsletterPublic(dependances: DependancesNewsletterPublic) {
  const routes = Router();
  const controleurs = creerControleursNewsletterPublic(dependances);
  routes.use((_requete, reponse, suite) => {
    reponse.set("Cache-Control", "private, no-store");
    suite();
  });
  routes.use(limiterRequetes(LIMITE_DESINSCRIPTION));
  routes.get("/desinscription", controleurs.lireDesinscription);
  routes.post("/desinscription", express.urlencoded({ extended: false, limit: "2kb", parameterLimit: 5 }), controleurs.desinscrire);
  routes.post("/confirmation", controleurs.confirmer);
  return routes;
}
