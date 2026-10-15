// Compte limité, au cas par cas (décision de Hugo du 15 octobre 2026, docs/decisions.md, « Modération des avis et limitation
// d'un compte ») : le MÊME refus que refuserSiLimite (middlewares/refuser-si-limite.ts : même estLimite, même horloge, même
// 403 « compte-limite »), posé seulement quand le geste montre quelque chose aux autres ou retire ce qui est aux autres.
// - Sur une route, quand la demande suffit à le dire : creerRefuserSiLimiteSi (le petit mot d'une demande de réservation).
// - Au milieu d'un contrôleur, quand seules les données le disent : refuserSiLimiteIci (l'auteur d'un SOS ou d'un
//   événement, le programme de fidélité déjà enregistré).
// Le middleware reçu est celui que l'application a construit (creerRefuserSiLimite) : rien n'est relu ni répondu deux fois.
import type { NextFunction, Request, RequestHandler, Response } from "express";

/** refuserSiLimite seulement si `condition` est vraie pour cette demande (lue après le lecteur JSON) ; sinon, ça passe */
export function creerRefuserSiLimiteSi(refuserSiLimite: RequestHandler, condition: (requete: Request) => boolean): RequestHandler {
  return function refuserSiLimiteSi(requete: Request, reponse: Response, suite: NextFunction) {
    return condition(requete) ? refuserSiLimite(requete, reponse, suite) : suite();
  };
}

/**
 * refuserSiLimite appelé par un contrôleur, au bon moment (après le rôle et la ressource relue) : true s'il a répondu
 * 403 compte-limite (le contrôleur s'arrête là), false s'il a laissé passer. Absent : rien n'est refusé. Comme
 * creerRefuserSiLimite, le middleware répond ou appelle suite avant d'avoir fini ; s'il ne fait ni l'un ni l'autre, c'est
 * une erreur (500), jamais une demande laissée sans réponse.
 */
export function refuserSiLimiteIci(refuserSiLimite: RequestHandler | undefined, requete: Request, reponse: Response): Promise<boolean> {
  if (!refuserSiLimite) return Promise.resolve(false);
  return new Promise((resoudre, rejeter) => {
    const suite = (erreur?: unknown) => (erreur ? rejeter(erreur) : resoudre(false));
    Promise.resolve(refuserSiLimite(requete, reponse, suite)).then(
      () => (reponse.headersSent ? resoudre(true) : rejeter(new Error("refuserSiLimite n'a ni répondu ni laissé passer"))),
      rejeter,
    );
  });
}
