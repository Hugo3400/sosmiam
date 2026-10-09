import { Router, type Request, type Response } from "express";

import { chercherCommunes } from "../fonctions/geo/chercher-communes.ts";
import { lireCodeCommune } from "../fonctions/geo/lire-code-commune.ts";
import { limiterRequetes } from "../middlewares/limiter-requetes.ts";
import type { ServicesZones } from "../services/zones-fondateurs.ts";

const DIX_MINUTES = 10 * 60_000;
/**
 * Par visiteur (IP dans X-IP-Visiteur) : la recherche de commune sert à un champ qui propose au fil de la frappe, d'où
 * une limite large ; les zones, une page publique (le programme) et la candidature.
 */
export const LIMITE_COMMUNES = { fenetre: DIX_MINUTES, maximum: 600 };
export const LIMITE_ZONES = { fenetre: DIX_MINUTES, maximum: 300 };
/** Les communes ne changent qu'une fois par an : une heure en cache. Les places, elles, bougent à chaque acceptation. */
const CACHE_COMMUNES = "public, max-age=3600";
const CACHE_ZONES = "public, max-age=60";

/**
 * Adresses publiques (sans session) : recherche de commune et places de fondateurs, pour la page du programme et le
 * formulaire de candidature. JSON ; réponses en cache public court ; 429 « trop-de-demandes » (avec Retry-After) au-delà
 * des limites par visiteur.
 *
 * GET /communes?recherche=&limite=      → 200 { ok, communes: [{ code, nom, nomDepartement, codeDepartement, population,
 *                                          codePostal }] } (nom ou code postal ; limite 8 par défaut, de 1 à 20 ; recherche
 *                                          vide ou de plus de 80 caractères : liste vide)
 * GET /fondateurs/zone?commune=CODE     → 200 { ok, commune: { code, nom, nomDepartement, codeDepartement, population },
 *                                          zone: { code, type, nom, nomAvecDe, places, prises, libres } }
 *                                          · 404 { ok: false, erreur: "commune-inconnue" }
 * GET /fondateurs/zones                 → 200 { ok, zones: [zone…], total: { places, prises } }
 */
export function creerRoutesFondateurs(zones: ServicesZones) {
  const routes = Router();

  routes.get("/communes", limiterRequetes(LIMITE_COMMUNES), (requete: Request, reponse: Response) => {
    const recherche = typeof requete.query.recherche === "string" ? requete.query.recherche : "";
    const limite = typeof requete.query.limite === "string" && requete.query.limite !== "" ? Number(requete.query.limite) : undefined;
    reponse.set("Cache-Control", CACHE_COMMUNES).json({ ok: true, communes: chercherCommunes(recherche, limite) });
  });

  const limiteZones = limiterRequetes(LIMITE_ZONES);
  routes.get("/fondateurs/zone", limiteZones, async (requete: Request, reponse: Response) => {
    const code = lireCodeCommune(requete.query.commune);
    const trouvee = code ? await zones.trouverZoneDeCommune(code) : null;
    if (!trouvee) return reponse.status(404).json({ ok: false, erreur: "commune-inconnue" });
    reponse.set("Cache-Control", CACHE_ZONES).json({ ok: true, ...trouvee });
  });

  routes.get("/fondateurs/zones", limiteZones, async (_requete: Request, reponse: Response) => {
    const liste = await zones.listerZones();
    const total = { places: 0, prises: 0 };
    for (const zone of liste) {
      total.places += zone.places;
      total.prises += zone.prises;
    }
    reponse.set("Cache-Control", CACHE_ZONES).json({ ok: true, zones: liste, total });
  });

  return routes;
}
