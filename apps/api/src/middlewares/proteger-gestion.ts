// Protection des routes du logiciel de gestion : elles ne servent qu'aux postes autorisés de Hugo.
// Chaque demande est signée par la clé Ed25519 du poste (gardée chiffrée par son mot de passe sur l'ordinateur) :
// sans elle, rien ne passe, même en connaissant l'adresse. Une session s'ouvre en plus avec le code à 6 chiffres
// de l'application d'authentification, et se ferme après 24 heures sans activité (7 jours au plus). Les sessions sont
// gardées dans la base (leur empreinte seulement) : un redémarrage de l'API ne redemande pas le code.
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

import { calculerCodeTotp } from "../fonctions/securite/calculer-code-totp.ts";
import { construireMessageGestion } from "../fonctions/securite/construire-message-gestion.ts";
import { verifierSignatureEd25519 } from "../fonctions/securite/verifier-signature-ed25519.ts";
import type { AccesGestion, PosteAutorise } from "../services/gestion/acces.ts";

export const PREFIXE_GESTION = "/api-gestion";
const ECART_HORLOGE = 60_000;
const INACTIVITE_MAX = 24 * 3600_000;
const DUREE_MAX = 7 * 24 * 3600_000;
/** L'heure de dernière activité n'est réécrite dans la base qu'au plus toutes les 5 minutes */
const ECRITURE_ACTIVITE = 5 * 60_000;
const FENETRE_ECHECS = 10 * 60_000;
const ECHECS_MAX = 30;
const ECHECS_CODE_MAX = 5;

export type Session = { posteId: string; creeLe: number; activite: number };

/** Où sont gardées les sessions, par l'empreinte SHA-256 de leur identifiant (la base en vrai, la mémoire dans les tests). */
export type StockageSessions = {
  lire: (empreinte: string) => Promise<Session | null>;
  creer: (empreinte: string, session: Session) => Promise<void>;
  toucher: (empreinte: string, activite: number) => Promise<void>;
  supprimer: (empreinte: string) => Promise<void>;
  /** Supprime les sessions d'un poste (une seule session par poste) et celles qui ont expiré */
  faireLeMenage: (posteId: string, expireAvant: { creeLe: number; activite: number }) => Promise<void>;
};

export function creerStockageSessionsEnMemoire(): StockageSessions {
  const sessions = new Map<string, Session>();
  return {
    lire: async (empreinte) => sessions.get(empreinte) ?? null,
    creer: async (empreinte, session) => void sessions.set(empreinte, { ...session }),
    toucher: async (empreinte, activite) => {
      const session = sessions.get(empreinte);
      if (session) session.activite = activite;
    },
    supprimer: async (empreinte) => void sessions.delete(empreinte),
    faireLeMenage: async (posteId, { creeLe, activite }) => {
      for (const [cle, s] of sessions) if (s.posteId === posteId || s.creeLe < creeLe || s.activite < activite) sessions.delete(cle);
    },
  };
}

const empreinteDe = (session: string) => createHash("sha256").update(session).digest("hex");
/** Ce que la protection a établi pour la demande en cours (dans reponse.locals.gestion) */
export type ContexteGestion = { poste: PosteAutorise; session: string | null };

export function creerProtectionGestion(
  lireAcces: () => AccesGestion | null,
  horloge: () => number = Date.now,
  stockage: StockageSessions = creerStockageSessionsEnMemoire(),
) {
  const nonces = new Map<string, number>();
  /** Sessions déjà lues, et le moment où leur activité a été écrite dans le stockage */
  const enMemoire = new Map<string, Session & { ecrite: number }>();
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
  async function verifierSession(requete: Request, reponse: Response, suite: NextFunction) {
    const contexte = reponse.locals.gestion as ContexteGestion;
    const id = requete.get("x-gestion-session") ?? "";
    const empreinte = empreinteDe(id);
    let session = enMemoire.get(empreinte);
    if (!session && id.length >= 32) {
      const lue = await stockage.lire(empreinte);
      if (lue) enMemoire.set(empreinte, (session = { ...lue, ecrite: lue.activite }));
    }
    const maintenant = horloge();
    if (!session || session.posteId !== contexte.poste.id || maintenant - session.activite > INACTIVITE_MAX || maintenant - session.creeLe > DUREE_MAX) {
      if (session) {
        enMemoire.delete(empreinte);
        await stockage.supprimer(empreinte);
      }
      return refuser(reponse, "session-expiree");
    }
    session.activite = maintenant;
    if (maintenant - session.ecrite > ECRITURE_ACTIVITE) {
      session.ecrite = maintenant;
      await stockage.toucher(empreinte, maintenant);
    }
    contexte.session = id;
    suite();
  }

  /** POST /session : ouvre une session avec le code à 6 chiffres (accepté 30 secondes avant ou après, une seule fois). */
  async function ouvrirSession(requete: Request, reponse: Response) {
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
    for (const [empreinte, session] of enMemoire) if (session.posteId === poste.id) enMemoire.delete(empreinte);
    await stockage.faireLeMenage(poste.id, { creeLe: horloge() - DUREE_MAX, activite: horloge() - INACTIVITE_MAX });
    const id = randomBytes(32).toString("base64url");
    const session = { posteId: poste.id, creeLe: horloge(), activite: horloge() };
    await stockage.creer(empreinteDe(id), session);
    enMemoire.set(empreinteDe(id), { ...session, ecrite: session.activite });
    reponse.status(201).json({ ok: true, session: id, poste: poste.nom, inactiviteMax: INACTIVITE_MAX });
  }

  /** DELETE /session : ferme la session en cours. */
  async function fermerSession(_requete: Request, reponse: Response) {
    const { session } = reponse.locals.gestion as ContexteGestion;
    if (session) {
      enMemoire.delete(empreinteDe(session));
      await stockage.supprimer(empreinteDe(session));
    }
    reponse.json({ ok: true });
  }

  return { controlerEnTetes, verifierSignature, verifierSession, ouvrirSession, fermerSession };
}
