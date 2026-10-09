import { Router, type RequestHandler } from "express";

import type { creerControleursComptoir } from "../controleurs/comptoir.ts";
import { gererErreursComptes } from "../middlewares/proteger-comptes.ts";

/** L'écran du comptoir se relit toutes les 5 s (et le programme, les lieux), par compte */
export const LIMITE_LECTURES_COMPTOIR = { fenetre: 10 * 60_000, maximum: 600 };
/** QR montrés, additions réglées, refus, annulations, récompenses offertes, programme, par compte */
export const LIMITE_GESTES_COMPTOIR = { fenetre: 10 * 60_000, maximum: 300 };

/**
 * /pro/comptoir : le comptoir de l'équipe d'un lieu (mode pro de l'app, puis pro.sosmiam.fr), même compte et même session
 * que le reste (Bearer ou X-Session-Compte), jamais en cache. Il faut un rattachement VALIDÉ au lieu ET 18 ans (sans date
 * gardée : compte du site, 18 ans) ; sinon 403 role-requis (aussi pour un lieu, une visite ou une demande inconnus de
 * l'équipe… sauf 404 introuvable quand la visite ou la demande n'existe pas du tout). Le lieu d'une visite ou d'une demande
 * est relu sur la ressource, jamais pris dans la demande. Formes dans packages/commun (types/comptoir.ts).
 * Réponse des gestes : 200 { ok, etat: EtatComptoir } (l'écran à jour) ; l'équipe ne voit que le prénom, l'initiale du nom,
 * l'emoji, le code et les tampons chez elle. Le QR (qr.texte) est signé par l'API et change toutes les 30 s.
 *
 * GET    /pro/comptoir/lieux                     → 200 { ok, lieux: LieuGere[] } (rattachements validés ; [] sous 18 ans)
 * GET    /pro/comptoir/lieux/:id                 → 200 { ok, etat }
 * POST   /pro/comptoir/lieux/:id/qr { personnes? (1 à 12, 1 par défaut), reglement? (ReglementVisite ; absent : payée) }
 *          → 200 { ok, etat } : QR valable 2 min ou jusqu'à ce que tout le monde ait scanné ; le précédent s'éteint
 *          · 400 champ-invalide { champ: personnes } | reglement-invalide · 409 lieu-sans-validation
 * DELETE /pro/comptoir/lieux/:id/qr              → 200 { ok, etat }
 * POST   /pro/comptoir/visites/:visiteId/reglee { code? (obligatoire dès 2 additions en attente), reglement? }
 *          → 200 { ok, etat } : +15 (ou +25 pendant un SOS), tampon, avis dans 1 h ; offerte : ni points ni tampon
 *          · 409 code-faux | transition-interdite | delai-depasse (plus de 30 min) · 400 reglement-invalide
 * POST   /pro/comptoir/visites/:visiteId/refuser { motif: "introuvable"|"pas-venu"|"doublon"|"autre" } → 200 { ok, etat }
 * POST   /pro/comptoir/visites/:visiteId/annuler { motif } → 200 { ok, etat } : une validation faite par erreur, 15 min au
 *          plus (points rendus, tampon retiré, avis fermé) · 409 delai-depasse | transition-interdite
 * POST   /pro/comptoir/recompenses/:demandeId/offrir → 200 { ok, etat } · 409 delai-depasse (code de plus de 15 min)
 * GET    /pro/comptoir/lieux/:id/programme       → 200 { ok, programme: ProgrammeFidelite | null }
 * PUT    /pro/comptoir/lieux/:id/programme (gérant) { actif, visitesRequises, recompense, alcool, recompenseSansAlcool }
 *          → 200 { ok, programme } · 400 programme-invalide { champ } (validerReglageFidelite) · 403 role-requis (équipe)
 */
export function creerRoutesComptoir(
  c: ReturnType<typeof creerControleursComptoir>,
  avant: RequestHandler[],
  parCompte: (r: { fenetre: number; maximum: number }) => RequestHandler,
) {
  const lectures = parCompte(LIMITE_LECTURES_COMPTOIR);
  const gestes = parCompte(LIMITE_GESTES_COMPTOIR);
  const routes = Router();
  routes.use(...avant);
  routes.get("/lieux", lectures, c.listerLieux);
  routes.get("/lieux/:id", lectures, c.lire);
  routes.post("/lieux/:id/qr", gestes, c.montrerQr);
  routes.delete("/lieux/:id/qr", gestes, c.cacherQr);
  routes.get("/lieux/:id/programme", lectures, c.lireProgramme);
  routes.put("/lieux/:id/programme", gestes, c.reglerProgramme);
  routes.post("/visites/:visiteId/reglee", gestes, c.marquerReglee);
  routes.post("/visites/:visiteId/refuser", gestes, c.refuser);
  routes.post("/visites/:visiteId/annuler", gestes, c.annulerValidation);
  routes.post("/recompenses/:demandeId/offrir", gestes, c.offrirRecompense);
  routes.use(gererErreursComptes);
  return routes;
}
