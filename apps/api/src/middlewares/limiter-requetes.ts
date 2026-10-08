import type { NextFunction, Request, Response } from "express";

type Reglages = {
  /** Durée de la fenêtre de comptage, en millisecondes */
  fenetre: number;
  /** Nombre de requêtes acceptées par visiteur pendant cette fenêtre */
  maximum: number;
};

/**
 * Limite le nombre de requêtes par visiteur, en mémoire (rien n'est écrit sur disque).
 * L'API n'écoute qu'en local : le site lui transmet l'adresse IP du visiteur dans l'en-tête « X-IP-Visiteur ».
 */
export function limiterRequetes({ fenetre, maximum }: Reglages) {
  const compteurs = new Map<string, { nombre: number; finFenetre: number }>();
  let dernierMenage = 0;

  return (requete: Request, reponse: Response, suite: NextFunction) => {
    const maintenant = Date.now();
    // Ménage chaque minute : une adresse IP ne reste pas en mémoire après sa fenêtre (la politique de confidentialité le promet)
    if (maintenant - dernierMenage > 60_000) {
      for (const [cle, compteur] of compteurs) if (compteur.finFenetre <= maintenant) compteurs.delete(cle);
      dernierMenage = maintenant;
    }
    const cle = requete.get("x-ip-visiteur") || requete.socket.remoteAddress || "inconnu";
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
