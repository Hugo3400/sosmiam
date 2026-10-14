import { Router, type Request, type Response } from "express";

import type { ErreurService } from "../../../../packages/commun/src/types/erreurs-service.ts";
import { estLecturePositionValide } from "../../../../packages/commun/src/validation/est-lecture-position-valide.ts";
import { lireId } from "../controleurs/gestion/lire-champs.ts";
import { limiterRequetes } from "../middlewares/limiter-requetes.ts";
import type { marquerMessageLu, messagesDuCompte, missionsDuCompte, noterPresence, terminerMission } from "../services/gestion/missions-messages.ts";

export type DependancesEspaceAmbassadeur = {
  missionsDuCompte: typeof missionsDuCompte;
  terminerMission: typeof terminerMission;
  messagesDuCompte: typeof messagesDuCompte;
  marquerMessageLu: typeof marquerMessageLu;
  noterPresence: typeof noterPresence;
};

/** « Je suis sur place », par compte : de quoi relire sa position quelques fois, pas de quoi chercher le lieu à tâtons */
export const LIMITE_PRESENCE = { fenetre: 60_000, maximum: 10 };

/** Le statut HTTP de chaque refus de « Je suis sur place » (400 pour ce qui n'est pas listé) */
const STATUTS_PRESENCE: Partial<Record<ErreurService, number>> = {
  introuvable: 404,
  "deja-sur-place": 409, "lieu-sans-position": 409, "transition-interdite": 409,
  "hors-zone": 422, "position-imprecise": 422, "position-perimee": 422, "position-simulee": 422,
};

/**
 * /espace-ambassadeur/… : « Mes missions » et « Mes messages » de l'espace ambassadeur (site et app). Sans protection ici :
 * le routeur est monté derrière exigerAmbassadeurActif (middlewares/proteger-comptes.ts), qui met le compte dans
 * reponse.locals.compte (403 ambassadeur-non-actif sinon). Une mission ou un message d'un autre compte est « introuvable ».
 *
 * GET  /espace-ambassadeur/missions → 200 { ok, missions } : à faire d'abord, puis les 20 dernières faites ou annulées.
 *        Mission : { id, titre, detail, echeance, statut (« a-faire » | « faite » | « annulee »), compteRendu, creeLe, faiteLe,
 *        type (« verifier-lieu » | « verifier-big-sos » | « controler-lieu » | « autre » | null), presenceVerifieeLe,
 *        lieu: { id, nom, ville, emoji, position: { latitude, longitude } | null } | null } ; dates ISO 8601
 * POST /espace-ambassadeur/missions/:id/compte-rendu { compteRendu (5 à 2000 caractères) } → 200 { ok }
 *        · 400 compte-rendu-trop-court · 404 introuvable (pas la sienne, ou plus à faire)
 * POST /espace-ambassadeur/missions/:id/presence { position: LecturePosition } → 200 { ok, mission } (« Je suis sur
 *        place » : la mission relue, avec presenceVerifieeLe). Même rayon et mêmes règles que les visites (evaluerPosition
 *        de packages/commun). Seule l'heure est gardée : la position n'est ni écrite, ni journalisée, ni renvoyée.
 *        · 400 champ-invalide { champ: "position" } · 404 introuvable (pas la sienne, absente)
 *        · 409 deja-sur-place | lieu-sans-position | transition-interdite (plus à faire)
 *        · 422 hors-zone { details: { distanceM (arrondie à 100 m), lieu } } | position-imprecise { details?: { precisionM } }
 *          | position-perimee | position-simulee · 429 trop-de-demandes (10 par minute et par compte)
 * GET  /espace-ambassadeur/messages → 200 { ok, messages: { id, titre, texte, creeLe, luLe }[] } (les siens et ceux à tous)
 * POST /espace-ambassadeur/messages/:id/lu → 200 { ok } · 404 introuvable
 */
export function creerRoutesEspaceAmbassadeur(d: DependancesEspaceAmbassadeur) {
  const routes = Router();
  const compteId = (reponse: Response) => (reponse.locals.compte as { id: number }).id;
  const limitePresence = limiterRequetes({ ...LIMITE_PRESENCE, cle: (_requete, reponse) => `compte:${compteId(reponse)}` });

  routes.get("/missions", async (_requete: Request, reponse: Response) => {
    reponse.json({ ok: true, missions: await d.missionsDuCompte(compteId(reponse)) });
  });
  routes.post("/missions/:id/compte-rendu", async (requete: Request, reponse: Response) => {
    const id = lireId(requete.params.id);
    const compteRendu = typeof requete.body?.compteRendu === "string" ? requete.body.compteRendu.trim().slice(0, 2000) : "";
    if (!id || compteRendu.length < 5) return reponse.status(400).json({ ok: false, erreur: "compte-rendu-trop-court" });
    if (!(await d.terminerMission(compteId(reponse), id, compteRendu))) return reponse.status(404).json({ ok: false, erreur: "introuvable" });
    reponse.json({ ok: true });
  });
  routes.post("/missions/:id/presence", limitePresence, async (requete: Request, reponse: Response) => {
    const id = lireId(requete.params.id);
    if (!id) return reponse.status(404).json({ ok: false, erreur: "introuvable" });
    const position: unknown = requete.body?.position;
    if (!estLecturePositionValide(position)) return reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: "position" });
    const resultat = await d.noterPresence(compteId(reponse), id, position);
    if (!resultat.ok) return reponse.status(STATUTS_PRESENCE[resultat.erreur] ?? 400).json(resultat);
    reponse.json(resultat);
  });
  routes.get("/messages", async (_requete: Request, reponse: Response) => {
    reponse.json({ ok: true, messages: await d.messagesDuCompte(compteId(reponse)) });
  });
  routes.post("/messages/:id/lu", async (requete: Request, reponse: Response) => {
    const id = lireId(requete.params.id);
    if (!id || !(await d.marquerMessageLu(compteId(reponse), id))) return reponse.status(404).json({ ok: false, erreur: "introuvable" });
    reponse.json({ ok: true });
  });
  return routes;
}
