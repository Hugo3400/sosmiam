const HEURE_MS = 60 * 60_000;

/** Instant UTC du dernier dimanche du mois (0 = janvier), à 1 h UTC : l'heure où l'Europe change d'heure. */
function calculerChangementHeure(annee: number, mois: number): number {
  const dernierJour = new Date(Date.UTC(annee, mois + 1, 0));
  const dimanche = dernierJour.getUTCDate() - dernierJour.getUTCDay();
  return Date.UTC(annee, mois, dimanche, 1);
}

/**
 * Décalage de l'heure de Paris sur l'heure UTC à cet instant, en millisecondes : 2 h en heure d'été (du dernier
 * dimanche de mars au dernier dimanche d'octobre, à 1 h UTC), 1 h sinon. Calculé à la main, sans Intl, pour donner
 * le même résultat sur le téléphone (quel que soit son fuseau), dans les tests et sur le serveur.
 */
export function calculerDecalageParis(instantMs: number): number {
  const annee = new Date(instantMs).getUTCFullYear();
  const ete = instantMs >= calculerChangementHeure(annee, 2) && instantMs < calculerChangementHeure(annee, 9);
  return ete ? 2 * HEURE_MS : HEURE_MS;
}
