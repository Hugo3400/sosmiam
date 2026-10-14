// Connexion par QR code, comme Discord (décidé le 14 octobre 2026) : l'appareil qui veut une session (le site, ou un nouveau
// téléphone) demande un QR et garde le secret ; l'app déjà connectée scanne le code et répond ; l'appareil reçoit sa
// session en interrogeant avec son secret, une seule fois. Contrat : routes/connexion-qr.ts.
// Jamais de code, de secret, de jeton ni d'e-mail dans un journal.
import type { Request, Response } from "express";

import { decrireAppareilQr } from "../fonctions/comptes/decrire-appareil-qr.ts";
import { lireEtatDemandeQr } from "../fonctions/comptes/lire-etat-demande-qr.ts";
import { calculerEmpreinteJeton } from "../fonctions/securite/calculer-empreinte-jeton.ts";
import { creerCodeConnexionQr, FORME_CODE_QR } from "../fonctions/securite/creer-code-connexion-qr.ts";
import { creerJeton } from "../fonctions/securite/creer-jeton.ts";
import type { CompteSession, ProtectionComptes } from "../middlewares/proteger-comptes.ts";
import type { CompteConnecte, CompteLu } from "../services/comptes.ts";
import { DUREE_QR, FENETRE_REPONSE_QR, type CibleQr, type DemandeQr, type OrigineQr, type ServicesConnexionQr } from "../services/connexion-qr-regles.ts";
import { lireCompteId, lireCorps } from "./comptes-champs.ts";
import { ChampInvalide } from "./gestion/lire-champs.ts";

export type DependancesConnexionQr = { services: ServicesConnexionQr };

/** Ce que les contrôleurs demandent aux comptes : la protection (sessions), le compte brut et le compte présenté */
export type ContexteConnexionQr = {
  qr: ServicesConnexionQr;
  protection: ProtectionComptes;
  lireCompte: (id: number) => Promise<CompteLu | null>;
  lireCompteVu: (id: number) => Promise<CompteConnecte | null>;
  horloge: () => number;
};

const ORIGINES_SITE: readonly OrigineQr[] = ["sosmiam.fr", "ambassadeur.sosmiam.fr", "pro.sosmiam.fr"];
/** Secret de 32 octets en base64url (43 caractères) */
const FORME_SECRET = /^[A-Za-z0-9_-]{43}$/;

function lireCible(corps: Record<string, unknown>): CibleQr {
  if (corps.cible === "site" || corps.cible === "app") return corps.cible;
  throw new ChampInvalide("cible");
}

/** cible « site » : l'hôte du site (obligatoire) ; cible « app » : « app » (absent : « app ») */
function lireOrigine(corps: Record<string, unknown>, cible: CibleQr): OrigineQr {
  if (cible === "app" && (corps.origine === undefined || corps.origine === null || corps.origine === "app")) return "app";
  if (cible === "site" && ORIGINES_SITE.includes(corps.origine as OrigineQr)) return corps.origine as OrigineQr;
  throw new ChampInvalide("origine");
}

/** Le code tel que le QR le porte, sinon 400 {champ: code} */
function lireCode(corps: Record<string, unknown>): string {
  if (typeof corps.code !== "string" || !FORME_CODE_QR.test(corps.code)) throw new ChampInvalide("code");
  return corps.code;
}

const iso = (moment: number) => new Date(moment).toISOString();
const inconnue = (reponse: Response) => reponse.status(404).json({ ok: false, erreur: "connexion-qr-inconnue" });
const expiree = (reponse: Response) => reponse.status(410).json({ ok: false, erreur: "connexion-qr-expiree" });
const dejaRepondu = (reponse: Response) => reponse.status(409).json({ ok: false, erreur: "deja-repondu" });

/** La demande telle que l'app la montre sur l'écran de confirmation */
const presenter = (demande: DemandeQr) => ({
  cible: demande.cible, appareil: demande.appareil, origine: demande.origine, creeLe: iso(demande.creeLe), expireLe: iso(demande.expireLe),
});

export function creerControleursConnexionQr({ qr, protection, lireCompte, lireCompteVu, horloge }: ContexteConnexionQr) {
  /** Les routes de l'app (scanner, répondre) : seulement avec une session de l'app (le site ne valide jamais un QR) */
  function exigerSessionApp(reponse: Response): boolean {
    if ((reponse.locals.compte as CompteSession).support === "app") return true;
    reponse.status(403).json({ ok: false, erreur: "session-app-requise" });
    return false;
  }

  return {
    /** POST /comptes/qr { cible, origine? } : un QR tout neuf (2 minutes) */
    async demander(requete: Request, reponse: Response) {
      const corps = lireCorps(requete);
      const cible = lireCible(corps);
      const origine = lireOrigine(corps, cible);
      // Sur le site, c'est le serveur du site qui appelle : il transmet la signature du navigateur du visiteur
      const signature = requete.get("x-appareil-visiteur") || requete.get("user-agent") || "";
      const code = creerCodeConnexionQr();
      const secret = creerJeton();
      const maintenant = horloge();
      const expireLe = maintenant + DUREE_QR;
      await qr.creer({
        codeEmpreinte: calculerEmpreinteJeton(code), secretEmpreinte: calculerEmpreinteJeton(secret),
        cible, origine, appareil: decrireAppareilQr(signature, origine), creeLe: maintenant, expireLe,
      });
      reponse.status(201).json({ ok: true, code, secret, expireLe: iso(expireLe) });
    },

    /** POST /comptes/qr/attente { secret } : où en est le QR ; accepté → LA session, une seule fois */
    async attendre(requete: Request, reponse: Response) {
      const corps = lireCorps(requete);
      if (typeof corps.secret !== "string" || !FORME_SECRET.test(corps.secret)) throw new ChampInvalide("secret");
      const demande = await qr.lireParSecret(calculerEmpreinteJeton(corps.secret));
      const etat = lireEtatDemandeQr(demande, horloge());
      if (etat !== "accepte" || !demande || demande.compteId === null) return reponse.json({ ok: true, etat: etat === "accepte" ? "expire" : etat });
      // Atomique : de deux interrogations simultanées, une seule passe la demande à « utilisee » et ouvre la session
      const compteId = demande.compteId;
      if (!(await qr.utiliser(demande.id)) || !(await lireCompte(compteId))) return reponse.json({ ok: true, etat: "expire" });
      const session = await protection.ouvrirSession(compteId, demande.cible === "app" ? "app" : "site");
      reponse.json({ ok: true, etat: "accepte", session, compte: await lireCompteVu(compteId) });
    },

    /** POST /app/qr/scanner { code } : la demande passe à « scanne » par ce compte, l'app montre la confirmation */
    async scanner(requete: Request, reponse: Response) {
      if (!exigerSessionApp(reponse)) return;
      const code = lireCode(lireCorps(requete));
      const compteId = lireCompteId(reponse);
      const maintenant = horloge();
      let demande = await qr.lireParCode(calculerEmpreinteJeton(code));
      if (!demande) return inconnue(reponse);
      if (demande.statut === "attente" && maintenant < demande.expireLe) {
        // Deux téléphones qui scannent au même moment : un seul gagne, l'autre relit
        if (await qr.noterScan(demande.id, compteId, maintenant)) return reponse.json({ ok: true, demande: presenter(demande) });
        demande = await qr.lireParCode(calculerEmpreinteJeton(code));
        if (!demande) return inconnue(reponse);
      }
      if (demande.statut === "utilisee" || maintenant >= demande.expireLe) return expiree(reponse);
      if (demande.compteId !== compteId) return reponse.status(409).json({ ok: false, erreur: "connexion-qr-deja-scannee" });
      if (demande.statut !== "scanne") return dejaRepondu(reponse);
      // Le même téléphone rescanne : même demande, la fenêtre de 60 s ne repart pas
      if (demande.scanneLe !== null && maintenant - demande.scanneLe > FENETRE_REPONSE_QR) return expiree(reponse);
      reponse.json({ ok: true, demande: presenter(demande) });
    },

    /** POST /app/qr/repondre { code, accepte } : seulement le compte qui a scanné, dans les 60 s */
    async repondre(requete: Request, reponse: Response) {
      if (!exigerSessionApp(reponse)) return;
      const corps = lireCorps(requete);
      const code = lireCode(corps);
      if (typeof corps.accepte !== "boolean") throw new ChampInvalide("accepte");
      const compteId = lireCompteId(reponse);
      const maintenant = horloge();
      const demande = await qr.lireParCode(calculerEmpreinteJeton(code));
      // Pas scannée par ce compte : rien à dire de plus (le code ne prouve rien à lui seul)
      if (!demande || demande.compteId !== compteId) return inconnue(reponse);
      if (demande.statut !== "scanne") return demande.statut === "utilisee" ? expiree(reponse) : dejaRepondu(reponse);
      // Refuser reste possible tant que la demande n'a pas eu de réponse ; accepter, seulement dans les temps
      const horsDelai = maintenant >= demande.expireLe || (demande.scanneLe !== null && maintenant - demande.scanneLe > FENETRE_REPONSE_QR);
      if (corps.accepte && horsDelai) return expiree(reponse);
      if (!(await qr.repondre(demande.id, compteId, corps.accepte, maintenant))) return dejaRepondu(reponse);
      reponse.json({ ok: true });
    },
  };
}
