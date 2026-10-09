import { Router, type RequestHandler } from "express";

import { lireCompteId } from "../controleurs/comptes-champs.ts";
import { creerControleursEvenementsApp, type DependancesEvenementsApp } from "../controleurs/evenements-app.ts";
import { limiterRequetes } from "../middlewares/limiter-requetes.ts";
import { gererErreursComptes, type ProtectionComptes } from "../middlewares/proteger-comptes.ts";

/** Explorer et les fiches : lus à l'ouverture et en déplaçant la carte, par IP (comme les lieux) */
export const LIMITE_LECTURES_EVENEMENTS = { fenetre: 60_000, maximum: 240 };
/** « Ça m'intéresse » relu, par compte */
export const LIMITE_LECTURES_INTERETS = { fenetre: 10 * 60_000, maximum: 300 };
/** « Ça m'intéresse » posé ou retiré, par compte */
export const LIMITE_GESTES_INTERETS = { fenetre: 10 * 60_000, maximum: 120 };

/**
 * /app/evenements : les événements des lieux vérifiés dans l'app (docs/decisions.md, « Décidé le 9 octobre 2026, au soir »).
 * Formes dans packages/commun (types/evenement.ts). JSON { ok: true, … } ; erreurs { ok: false, erreur, champ? } ;
 * 429 trop-de-demandes (Retry-After). Une ligne = un événement à UNE date : un événement de chaque semaine donne une ligne
 * par date (même jour, même heure de Paris). Visible : lieu publié et vérifié, ni suspendu par la modération, ni annulé, date
 * pas encore finie (sans heure de fin : 3 h après le début). alcool: true (case cochée, mot d'alcool, happy hour, ou lieu de
 * type bar) : l'app le cache aux 15-17 ans et à l'âge inconnu, et affiche le message sanitaire à côté.
 *
 * Sans session (cache public 60 s) :
 * GET /app/evenements[?nord&sud&ouest&est][&du&au]
 *   → 200 { ok, evenements: EvenementLieuPublic[] } : les dates qui touchent la période [du, au) (ISO 8601 avec fuseau ;
 *     du : maintenant par défaut ; au : du + 14 jours par défaut ; 14 jours au plus), dans la zone si elle est donnée (les
 *     quatre bords, en degrés, comme /app/lieux), de la plus proche à la plus lointaine, 200 au plus. « Ce soir », « ce
 *     week-end » : l'app choisit du et au · 400 champ-invalide { champ: "zone" | "periode" }
 * GET /app/evenements/lieux/:lieuId
 *   → 200 { ok, evenements: EvenementLieuPublic[] } : les 20 prochaines dates du lieu (« À venir » sur la fiche)
 *     · 404 lieu-inconnu (absent, brouillon ou masqué)
 *
 * Avec session (Authorization: Bearer ou X-Session-Compte ; jamais en cache ; 401 session-expiree) :
 * GET    /app/evenements/mes-interets → 200 { ok, interets: MonInteretEvenement[] } : les événements pas encore finis, la
 *          prochaine date de chacun, le plus proche d'abord ; annulé : annule: true jusqu'à sa date, puis plus rien. Pour un
 *          15-17 ans, jamais un événement avec alcool
 * PUT    /app/evenements/:id/interet { rappel?: boolean (false par défaut : rappel le jour J, pas encore envoyé) }
 *          → 200 { ok, interets } (déjà posé : rappel mis à jour) · 400 champ-invalide { champ: "id" | "rappel" }
 *          · 404 evenement-inconnu (absent, suspendu, annulé, lieu non publié ou non vérifié) · 409 evenement-passe
 *          · 403 mineur-alcool (15-17 ans ou date illisible : l'app ne montre pas le bouton ; réponse claire plutôt qu'un
 *            faux 404, l'événement étant de toute façon lisible sans session)
 * DELETE /app/evenements/:id/interet → 200 { ok, interets } (rien à retirer : rien ne change) · 400 champ-invalide { champ: "id" }
 * L'équipe du lieu : routes/comptoir.ts (/pro/comptoir/lieux/:id/evenements).
 */
export function creerRoutesEvenementsApp(dependances: DependancesEvenementsApp, protection: ProtectionComptes, limiteConnectee: RequestHandler, horloge: () => number) {
  const c = creerControleursEvenementsApp(dependances, horloge);
  const lectures = limiterRequetes(LIMITE_LECTURES_EVENEMENTS);
  const parCompte = (r: { fenetre: number; maximum: number }) => limiterRequetes({ ...r, cle: (_q, reponse) => `compte:${lireCompteId(reponse)}` });
  const connecte: RequestHandler[] = [limiteConnectee, protection.exigerCompte, (_q, reponse, suite) => {
    reponse.set("Cache-Control", "private, no-store");
    suite();
  }];
  const lecturesInterets = parCompte(LIMITE_LECTURES_INTERETS);
  const gestes = parCompte(LIMITE_GESTES_INTERETS);

  const routes = Router();
  routes.get("/", lectures, c.lister);
  routes.get("/lieux/:lieuId", lectures, c.listerDuLieu);
  routes.get("/mes-interets", ...connecte, lecturesInterets, c.listerMesInterets);
  routes.put("/:id/interet", ...connecte, gestes, c.poserInteret);
  routes.delete("/:id/interet", ...connecte, gestes, c.retirerInteret);
  routes.use(gererErreursComptes);
  return routes;
}
