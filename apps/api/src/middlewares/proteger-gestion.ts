// Protection des routes du logiciel de gestion : elles ne servent qu'aux postes autorisés de Hugo.
// Chaque demande est signée par la clé Ed25519 du poste (gardée chiffrée par son mot de passe sur l'ordinateur) :
// sans elle, rien ne passe, même en connaissant l'adresse. Une session s'ouvre en plus avec le code à 6 chiffres
// de l'application d'authentification, et se ferme après 2 heures sans activité (12 heures au plus).
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

import { calculerCodeTotp } from "../fonctions/securite/calculer-code-totp.ts";
import { construireMessageGestion } from "../fonctions/securite/construire-message-gestion.ts";
import { verifierSignatureEd25519 } from "../fonctions/securite/verifier-signature-ed25519.ts";
import type { AccesGestion, PosteAutorise } from "../services/gestion/acces.ts";

export const PREFIXE_GESTION = "/api-gestion";
const ECART_HORLOGE = 60_000;
const INACTIVITE_MAX = 2 * 3600_000;
const DUREE_MAX = 12 * 3600_000;
const FENETRE_ECHECS = 10 * 60_000;
const ECHECS_MAX = 30;
const ECHECS_CODE_MAX = 5;

type Session = { posteId: string; creeLe: number; activite: number };
/** Ce que la protection a établi pour la demande en cours (dans reponse.locals.gestion) */
export type ContexteGestion = { poste: PosteAutorise; session: string | null };

export function creerProtectionGestion(lireAcces: () => AccesGestion | null, horloge: () => number = Date.now) {
  const nonces = new Map<string, number>();
  const sessions = new Map<string, Session>();
  let echecs: number[] = [];
  let echecsCode: number[] = [];
  let dernierPasUtilise = 0;

  function refuser(reponse: Response, erreur = "non-autorise", statut = 401) {
    reponse.status(statut).json({ ok: false, erreur });
  }
  function noterEchec(liste: number[]) {
    liste.push(horloge());
  }
  const recents = (liste: number[], fenetre: number) => liste.filter((moment) => horloge() - moment < fenetre);

  /** 1re étape, avant même de lire le corps : en-têtes présents, poste connu, horloge à l'heure, pas trop d'échecs. */
  function controlerEnTetes(requete: Request, reponse: Response, suite: NextFunction) {
    echecs = recents(echecs, FENETRE_ECHECS);
    if (echecs.length >= ECHECS_MAX) return refuser(reponse, "trop-d-essais", 429);
    const acces = lireAcces();
    if (!acces) return refuser(reponse, "gestion-fermee", 503);
    const poste = acces.postes.find((p) => p.id === requete.get("x-gestion-poste"));
    const horodatage = Number(requete.get("x-gestion-horodatage"));
    // Poste inconnu : refusé sans compter d'échec, sinon n'importe qui pourrait bloquer Hugo en tapant l'adresse
    if (!poste) return refuser(reponse);
    if (!Number.isFinite(horodatage) || Math.abs(horloge() - horodatage) > ECART_HORLOGE) {
      noterEchec(echecs);
      return refuser(reponse, "horloge-decalee");
    }
    reponse.locals.gestion = { poste, session: null } satisfies ContexteGestion;
    suite();
  }

  /** 2e étape, corps lu : la signature couvre la méthode, le chemin, l'heure, un nonce unique, la session et le corps. */
  function verifierSignature(requete: Request, reponse: Response, suite: NextFunction) {
    const { poste } = reponse.locals.gestion as ContexteGestion;
    const nonce = requete.get("x-gestion-nonce") ?? "";
    const corps = Buffer.isBuffer(requete.body) ? requete.body : Buffer.alloc(0);
    const message = construireMessageGestion({
      methode: requete.method,
      chemin: requete.originalUrl.slice(PREFIXE_GESTION.length),
      horodatage: requete.get("x-gestion-horodatage") ?? "",
      nonce,
      session: requete.get("x-gestion-session") || null,
      empreinteCorps: createHash("sha256").update(corps).digest("hex"),
    });
    const signature = Buffer.from(requete.get("x-gestion-signature") ?? "", "base64url");
    for (const [ancien, expiration] of nonces) if (expiration < horloge()) nonces.delete(ancien);
    if (nonce.length < 16 || nonce.length > 64 || nonces.has(nonce) || !verifierSignatureEd25519(poste.clePublique, Buffer.from(message), signature)) {
      noterEchec(echecs);
      return refuser(reponse);
    }
    // Un nonce déjà vu est refusé : une demande interceptée ne peut pas être rejouée
    nonces.set(nonce, horloge() + 2 * ECART_HORLOGE);
    if (corps.length > 0 && requete.is("application/json")) {
      try {
        requete.body = JSON.parse(corps.toString("utf8"));
      } catch {
        return refuser(reponse, "requete-invalide", 400);
      }
    }
    suite();
  }

  /** 3e étape, pour toutes les routes sauf l'ouverture de session : une session valable, ouverte par ce même poste. */
  function verifierSession(requete: Request, reponse: Response, suite: NextFunction) {
    const contexte = reponse.locals.gestion as ContexteGestion;
    const id = requete.get("x-gestion-session") ?? "";
    const session = sessions.get(id);
    const maintenant = horloge();
    if (!session || session.posteId !== contexte.poste.id || maintenant - session.activite > INACTIVITE_MAX || maintenant - session.creeLe > DUREE_MAX) {
      if (session) sessions.delete(id);
      return refuser(reponse, "session-expiree");
    }
    session.activite = maintenant;
    contexte.session = id;
    suite();
  }

  /** POST /session : ouvre une session avec le code à 6 chiffres (accepté 30 secondes avant ou après, une seule fois). */
  function ouvrirSession(requete: Request, reponse: Response) {
    echecsCode = recents(echecsCode, 15 * 60_000);
    if (echecsCode.length >= ECHECS_CODE_MAX) return refuser(reponse, "trop-d-essais", 429);
    const acces = lireAcces();
    const code = typeof requete.body?.code === "string" ? requete.body.code.replace(/\s/g, "") : "";
    const pasActuel = Math.floor(horloge() / 30_000);
    const pasValide = acces && /^\d{6}$/.test(code)
      ? [pasActuel - 1, pasActuel, pasActuel + 1].find(
          (pas) => pas > dernierPasUtilise && timingSafeEqual(Buffer.from(calculerCodeTotp(acces.secretTotp, pas)), Buffer.from(code)),
        )
      : undefined;
    if (pasValide === undefined) {
      noterEchec(echecsCode);
      return refuser(reponse, "code-invalide");
    }
    dernierPasUtilise = pasValide;
    const { poste } = reponse.locals.gestion as ContexteGestion;
    for (const [id, session] of sessions) if (session.posteId === poste.id) sessions.delete(id);
    const id = randomBytes(32).toString("base64url");
    sessions.set(id, { posteId: poste.id, creeLe: horloge(), activite: horloge() });
    reponse.status(201).json({ ok: true, session: id, poste: poste.nom, inactiviteMax: INACTIVITE_MAX });
  }

  /** DELETE /session : ferme la session en cours. */
  function fermerSession(_requete: Request, reponse: Response) {
    const { session } = reponse.locals.gestion as ContexteGestion;
    if (session) sessions.delete(session);
    reponse.json({ ok: true });
  }

  return { controlerEnTetes, verifierSignature, verifierSession, ouvrirSession, fermerSession };
}
