import { Router, type RequestHandler } from "express";

import { lireCompteId } from "../controleurs/comptes-champs.ts";
import { creerLecteurCompteVu } from "../controleurs/comptes-vu.ts";
import { creerControleursConnexionQr, type DependancesConnexionQr } from "../controleurs/connexion-qr.ts";
import { limiterRequetes } from "../middlewares/limiter-requetes.ts";
import { gererErreursComptes, type ProtectionComptes } from "../middlewares/proteger-comptes.ts";
import type { DependancesComptes } from "./comptes.ts";

/** Nouveau QR : 20 par visiteur (IP) toutes les 10 minutes (le site n'en demande qu'au clic, l'app à l'écran de connexion) */
export const LIMITE_QR_CREATION = { fenetre: 10 * 60_000, maximum: 20 };
/** L'appareil qui attend interroge toutes les 2 secondes : 120 interrogations par visiteur et par minute */
export const LIMITE_QR_ATTENTE = { fenetre: 60_000, maximum: 120 };
/** Scanner et répondre ensemble : 30 par COMPTE toutes les 10 minutes */
export const LIMITE_QR_APP = { fenetre: 10 * 60_000, maximum: 30 };

/**
 * Connexion par QR code, comme Discord (décidé le 14 octobre 2026, docs/decisions.md). Dans les deux sens : le site
 * (sosmiam.fr/mon-compte, /connexion d'ambassadeur. et de pro.) ou un nouveau téléphone affiche un QR ; c'est TOUJOURS
 * l'app déjà connectée qui scanne et valide (Face ID, empreinte ou code du téléphone : sur le téléphone, jamais ici).
 * Un QR vit 2 minutes et sert une seule fois. Le QR contient https://sosmiam.fr/q/<code> ; le secret reste sur l'appareil
 * qui l'affiche, jamais dans le QR. La base ne garde que les empreintes SHA-256 du code et du secret ; ni le code, ni le
 * secret, ni le jeton, ni l'e-mail ne vont dans un journal. Réponses { ok: true, … } ou { ok: false, erreur, champ? },
 * jamais en cache ; 400 champ-invalide {champ} ; 429 trop-de-demandes (Retry-After).
 *
 * Sans session (l'IP du visiteur dans X-IP-Visiteur, comme pour /comptes) :
 * POST /comptes/qr          { cible: "site" | "app", origine? } → 201 { ok, code, secret, expireLe }
 *                           code : 32 caractères [a-z2-9] ; secret : 32 octets en base64url (43 caractères) ; expireLe :
 *                           ISO 8601 (dans 2 minutes). origine : « sosmiam.fr », « ambassadeur.sosmiam.fr » ou
 *                           « pro.sosmiam.fr » (obligatoire avec cible « site », fixée par le serveur du site) ; « app »
 *                           (ou absente) avec cible « app » ; sinon 400 {champ: origine}. L'appareil (« Chrome sur Mac »,
 *                           « Safari sur iPhone », « l'app SOS Miam sur Android ») est tiré de l'en-tête
 *                           X-Appareil-Visiteur (le User-Agent du visiteur, transmis par le serveur du site), sinon du
 *                           User-Agent de la demande. 429 au-delà de 20 par visiteur toutes les 10 minutes.
 * POST /comptes/qr/attente  { secret } → 200 { ok, etat: "attente" | "scanne", attenteDansS } (attenteDansS : secondes entières
 *                           qui restent, comptées par le serveur : jusqu'à expireLe avant le scan, puis min(60 s après le
 *                           premier scan, expireLe) ; jamais négatif), 200 { ok, etat: "refuse" | "expire" }, ou, une fois
 *                           acceptée, 200 { ok, etat: "accepte", session, compte } (comme une connexion : `compte` de
 *                           routes/comptes.ts). La session n'est ouverte qu'à cet appel (la demande passe à « utilisee ») ;
 *                           cible « site » → session du site (30 jours sans visite, 90 au plus) ; cible « app » → session
 *                           de l'app (1 an, prolongée à chaque usage). Réponse perdue : le même secret qui revient dans les
 *                           30 s après la PREMIÈRE remise reçoit encore « accepte » avec une NOUVELLE session, et la session
 *                           remise avant est révoquée (3 remises au plus) ; ensuite « expire ». Tout est atomique : même
 *                           avec des appels simultanés, une seule session valable à la fin (garder la dernière reçue).
 *                           Compte effacé entre-temps : « expire ». Secret inconnu : « expire ». Une demande acceptée se
 *                           récupère jusqu'à 30 s après la fin du QR ; un scan resté 60 s sans réponse : « expire ». 429
 *                           au-delà de 120 par visiteur et par minute (interroger toutes les 2 s).
 *
 * Avec la session de l'APP (Authorization: Bearer ; une session du site : 403 session-app-requise ; sans session valable :
 * 401 session-expiree ; 429 au-delà de 30 demandes par compte toutes les 10 minutes, les deux adresses ensemble) :
 * POST /app/qr/scanner      { code } (les 32 caractères après https://sosmiam.fr/q/) → 200 { ok, demande: { cible, appareil,
 *                           origine, creeLe, expireLe, repondreDansS } } (dates ISO 8601 ; repondreDansS : secondes entières
 *                           qui restent pour accepter, min(60 s après le PREMIER scan, expireLe) - maintenant, jamais
 *                           négatif : à préférer aux dates, l'horloge du téléphone peut être fausse) : la demande passe à
 *                           « scanne » par ce compte ; l'app montre la confirmation. Le même compte peut rescanner (même
 *                           réponse, la fenêtre de 60 s ne repart pas). 404 connexion-qr-inconnue · 410 connexion-qr-expiree (fini, déjà utilisé, ou scanné
 *                           depuis plus de 60 s sans réponse) · 409 connexion-qr-deja-scannee (scanné par un AUTRE compte)
 *                           · 409 deja-repondu (ce compte a déjà accepté ou refusé).
 * POST /app/qr/repondre     { code, accepte: boolean } → 200 { ok }. Seulement le compte qui a scanné (sinon 404
 *                           connexion-qr-inconnue) ; accepter : dans les 60 s après le scan et avant expireLe (sinon 410
 *                           connexion-qr-expiree) ; refuser : tant qu'il n'y a pas eu de réponse. 409 deja-repondu (déjà
 *                           accepté ou refusé) · 410 connexion-qr-expiree (déjà utilisé).
 *
 * Ménage de nuit : les demandes expirées depuis plus d'un jour sont effacées (taches/taches-de-nuit.ts).
 */
export function creerRoutesConnexionQr(
  dependances: DependancesConnexionQr, comptes: DependancesComptes, protection: ProtectionComptes, limiteConnectee: RequestHandler,
) {
  const horloge = comptes.horloge ?? Date.now;
  const { lireCompteVu } = creerLecteurCompteVu(comptes.services.lireCompte, comptes.chiffrement ?? null, horloge);
  const c = creerControleursConnexionQr({ qr: dependances.services, protection, lireCompte: comptes.services.lireCompte, lireCompteVu, horloge });
  const sansCache: RequestHandler = (_requete, reponse, suite) => {
    reponse.set("Cache-Control", "private, no-store");
    suite();
  };

  /** Monté sur /comptes/qr, AVANT le routeur /comptes */
  const publiques = Router();
  publiques.post("/", sansCache, limiterRequetes(LIMITE_QR_CREATION), c.demander);
  publiques.post("/attente", sansCache, limiterRequetes(LIMITE_QR_ATTENTE), c.attendre);
  publiques.use(gererErreursComptes);

  /** Monté sur /app/qr, AVANT les routeurs /app */
  const app = Router();
  const parCompte = limiterRequetes({ ...LIMITE_QR_APP, cle: (_requete, reponse) => `qr-compte:${lireCompteId(reponse)}` });
  app.use(sansCache, limiteConnectee, protection.exigerCompte, parCompte);
  app.post("/scanner", c.scanner);
  app.post("/repondre", c.repondre);
  app.use(gererErreursComptes);

  return { publiques, app };
}
