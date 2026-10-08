import type { NextFunction, Request, Response } from "express";

import { calculerCleVisiteur } from "../fonctions/securite/calculer-cle-visiteur.ts";

type Reglages = {
  /** Durée de la fenêtre de comptage, en millisecondes */
  fenetre: number;
  /** Nombre de requêtes acceptées par visiteur pendant cette fenêtre */
  maximum: number;
};

/**
 * Limite le nombre de requêtes par visiteur, en mémoire (rien n'est écrit sur disque).
 * L'API n'écoute qu'en local : le site lui transmet l'adresse IP du visiteur dans l'en-tête « X-IP-Visiteur ». Une IPv6
 * compte par son préfixe /56 (calculerCleVisiteur) : sinon, changer d'adresse dans son propre bloc suffirait à passer.
 */
export function limiterRequetes({ fenetre, maximum }: Reglages) {
  const compteurs = new Map<string, { nombre: number; finFenetre: number }>();
  // Ménage chaque minute, même sans nouvelle requête : une adresse IP ne reste pas en mémoire plus d'une minute
  // après la fin de sa fenêtre (la politique de confidentialité le promet). unref : ne retient pas l'arrêt du serveur.
  setInterval(() => {
    const maintenant = Date.now();
    for (const [cle, compteur] of compteurs) if (compteur.finFenetre <= maintenant) compteurs.delete(cle);
  }, 60_000).unref();

  return (requete: Request, reponse: Response, suite: NextFunction) => {
    const maintenant = Date.now();
    const cle = calculerCleVisiteur(requete.get("x-ip-visiteur") || requete.socket.remoteAddress || "inconnu");
    const compteur = compteurs.get(cle);
    if (!compteur || compteur.finFenetre <= maintenant) {
      compteurs.set(cle, { nombre: 1, finFenetre: maintenant + fenetre });
      return suite();
    }
    compteur.nombre += 1;
    if (compteur.nombre > maximum) {
      reponse.set("Retry-After", String(Math.ceil((compteur.finFenetre - maintenant) / 1000)));
      return reponse.status(429).json({ ok: false, erreur: "trop-de-demandes" });
    }
    suite();
  };
}
