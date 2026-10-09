import { Router } from "express";

import { creerControleursContenuApp, type DependancesContenuApp } from "../controleurs/contenu-app.ts";
import { limiterRequetes } from "../middlewares/limiter-requetes.ts";

/** Lieux et fil : l'app les lit à l'ouverture et en faisant défiler ; les médias, plusieurs par publication */
export const LIMITE_LECTURES_APP = { fenetre: 60_000, maximum: 240 };
export const LIMITE_MEDIAS_APP = { fenetre: 60_000, maximum: 1200 };

/**
 * /app/… : ce que l'app lit SANS session (session de l'app, docs/decisions.md « Avant de brancher l'app »). JSON
 * { ok: true, … } ; erreurs { ok: false, erreur, champ? } ; 429 « trop-de-demandes » (Retry-After). Pas de limite pour tout
 * le routeur : une adresse /app/… qu'il ne connaît pas passe au routeur suivant (heure du serveur, version minimale).
 *
 * GET /app/lieux[?nord&sud&ouest&est]
 *   → 200 { ok, lieux: LieuApi[] } (packages/commun/src/types/lieu.ts) : les lieux publiés, sans la distance (l'app la
 *     calcule, la position du téléphone n'est jamais envoyée), 1 000 au plus ; avec une zone (les quatre bords, en degrés),
 *     seulement ceux qui y ont leur position. Cache public 60 s · 400 champ-invalide { champ: "zone" }
 * GET /app/lieux/:id → 200 { ok, lieu: LieuApi } · 404 lieu-inconnu (absent, brouillon ou masqué)
 * GET /app/lieux/code/:code → 200 { ok, lieuId } : le lieu publié du QR de vitrine (sosmiam.fr/l/<code>, 8 caractères a-z
 *     et 2-9) ; il ouvre la fiche, il ne valide jamais une visite. Cache public 5 min · 404 lieu-inconnu
 * GET /app/lieux/:id/carte
 *   → 200 { ok, carte: CarteLieu | null, majLe: ISO 8601 | null } : la carte complète, alcool compris (l'app le retire pour
 *     les moins de 18 ans et l'âge inconnu) · 404 lieu-inconnu
 * GET /app/publications[?apres=<curseur>&limite=1..30]
 *   → 200 { ok, publications: PublicationApi[] (packages/commun/src/types/publication.ts), suite: curseur | null } : le
 *     fil, de la plus récente à la plus ancienne, 20 par page ; seulement les publications visibles (publiées, pas
 *     suspendues, date passée, lieu publié ; par le lieu lui-même seulement s'il est vérifié). Cache public 30 s
 *     · 400 champ-invalide { champ: "apres" | "limite" }
 * GET /app/medias/:fichier
 *   → 200 le fichier (vidéo, affiche ou photo ; requêtes Range acceptées), seulement tant que sa publication est visible.
 *     Cache public 5 min · 404 media-inconnu
 */
export function creerRoutesContenuApp(dependances: DependancesContenuApp) {
  const c = creerControleursContenuApp(dependances);
  const lectures = limiterRequetes(LIMITE_LECTURES_APP);
  const routes = Router();
  if (dependances.lieux) {
    routes.get("/lieux", lectures, c.listerLieux);
    routes.get("/lieux/code/:code", lectures, c.trouverParCode);
    routes.get("/lieux/:id", lectures, c.lireLieu);
    routes.get("/lieux/:id/carte", lectures, c.lireCarte);
  }
  if (dependances.publications) {
    routes.get("/publications", lectures, c.listerPublications);
    routes.get("/medias/:fichier", limiterRequetes(LIMITE_MEDIAS_APP), c.lireMedia);
  }
  return routes;
}
