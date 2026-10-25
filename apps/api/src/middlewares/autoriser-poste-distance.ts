import { createHash } from "node:crypto";
import type { Request, Response } from "express";

import { calculerIdPoste } from "../fonctions/securite/calculer-id-poste.ts";
import { construireMessageGestion } from "../fonctions/securite/construire-message-gestion.ts";
import { verifierMotDePasse } from "../fonctions/securite/verifier-mot-de-passe.ts";
import { verifierSignatureEd25519 } from "../fonctions/securite/verifier-signature-ed25519.ts";
import type { AccesGestion, PosteAutorise } from "../services/gestion/acces.ts";
import type { RegistrePostesDistance } from "../services/gestion/postes-distance.ts";

export const DUREES_POSTE_DISTANCE = { passage: 12 * 3600_000, semaine: 7 * 24 * 3600_000, toujours: null } as const;
export type DureePosteDistance = keyof typeof DUREES_POSTE_DISTANCE;
export type AlerteAccesDistance =
  | { type: "nouveau-poste"; nom: string; idPoste: string; le: number; expireLe: number | null; pays: string | null }
  | { type: "bloque"; jusquA: number };
export type ResultatCode = "ok" | "code-invalide" | "trop-d-essais";
export type SessionOuverteGestion = { session: string; poste: string; expireLe: string | null; inactiviteMax: number };

const FENETRE_ECHECS = 3600_000;
const ECHECS_MAX = 10;
const POSTES_DISTANCE_MAX = 5;
const ECART_HORLOGE = 60_000;

type Dependances = {
  lireAcces: () => AccesGestion | null;
  registre: RegistrePostesDistance;
  verifierCode: (code: string) => ResultatCode;
  ouvrirSessionPour: (poste: PosteAutorise) => Promise<SessionOuverteGestion>;
  prevenir: (courriel: string, alerte: AlerteAccesDistance) => Promise<unknown>;
  horloge: () => number;
  prefixe: string;
};

type Demande = { clePublique: Uint8Array; nom: string; duree: DureePosteDistance; motDePasse: string; code: string };

function lireDemande(corps: unknown): Demande | null {
  let brut: unknown;
  try {
    brut = JSON.parse(Buffer.isBuffer(corps) ? corps.toString("utf8") : "");
  } catch {
    return null;
  }
  if (typeof brut !== "object" || brut === null) return null;
  const { clePublique, nom, duree, motDePasse, code } = brut as Record<string, unknown>;
  if (typeof clePublique !== "string" || typeof nom !== "string" || typeof motDePasse !== "string" || typeof code !== "string") return null;
  const cle = Buffer.from(clePublique, "base64url");
  if (cle.length !== 32 || cle.toString("base64url") !== clePublique) return null;
  if (typeof duree !== "string" || !Object.hasOwn(DUREES_POSTE_DISTANCE, duree)) return null;
  const propre = nom.replace(/[\u0000-\u001f\u007f-\u009f]/g, "").replace(/\s+/g, " ").trim().slice(0, 40);
  if (!propre || motDePasse.length === 0 || motDePasse.length > 256 || code.length > 12) return null;
  return { clePublique: new Uint8Array(cle), nom: propre, duree: duree as DureePosteDistance, motDePasse, code };
}

function estSigneeParLaCle(requete: Request, cle: Uint8Array, maintenant: number, prefixe: string): boolean {
  const horodatage = requete.get("x-gestion-horodatage") ?? "";
  if (!(Math.abs(maintenant - Number(horodatage)) <= ECART_HORLOGE)) return false;
  const corps = Buffer.isBuffer(requete.body) ? requete.body : Buffer.alloc(0);
  const message = construireMessageGestion({
    methode: requete.method,
    chemin: requete.originalUrl.slice(prefixe.length),
    horodatage,
    nonce: requete.get("x-gestion-nonce") ?? "",
    session: requete.get("x-gestion-session") || null,
    empreinteCorps: createHash("sha256").update(corps).digest("hex"),
  });
  return verifierSignatureEd25519(cle, Buffer.from(message), Buffer.from(requete.get("x-gestion-signature") ?? "", "base64url"));
}

const lirePays = (requete: Request) => {
  const pays = requete.get("cf-ipcountry") ?? "";
  return /^[A-Z][A-Z0-9]$/.test(pays) ? pays : null;
};

export function creerAutorisationDistance(d: Dependances) {
  let echecs: number[] = [];
  let prevenuLe = 0;
  const refuser = (reponse: Response, statut: number, erreur: string) => void reponse.status(statut).json({ ok: false, erreur });

  function noterEchec(acces: AccesGestion, maintenant: number) {
    echecs.push(maintenant);
    const courriel = acces.distance?.courriel;
    if (echecs.length < ECHECS_MAX || !courriel || maintenant - prevenuLe < FENETRE_ECHECS) return;
    prevenuLe = maintenant;
    void d.prevenir(courriel, { type: "bloque", jusquA: maintenant + FENETRE_ECHECS }).catch(() => {});
  }

  return async function autoriserPosteDistance(requete: Request, reponse: Response) {
    const maintenant = d.horloge();
    echecs = echecs.filter((moment) => maintenant - moment < FENETRE_ECHECS);
    if (echecs.length >= ECHECS_MAX) return refuser(reponse, 429, "trop-d-essais");
    const acces = d.lireAcces();
    if (!acces) return refuser(reponse, 503, "gestion-fermee");
    if (!acces.distance) return refuser(reponse, 403, "distance-fermee");
    const demande = lireDemande(requete.body);
    if (!demande) return refuser(reponse, 400, "requete-invalide");
    if (!estSigneeParLaCle(requete, demande.clePublique, maintenant, d.prefixe)) return refuser(reponse, 401, "non-autorise");

    let bon: boolean;
    try {
      bon = await verifierMotDePasse(demande.motDePasse, acces.distance.empreinteMotDePasse);
    } catch {
      return refuser(reponse, 503, "occupe");
    }
    const code = bon ? d.verifierCode(demande.code) : "code-invalide";
    if (code === "trop-d-essais") return refuser(reponse, 429, "trop-d-essais");
    if (code !== "ok") {
      noterEchec(acces, maintenant);
      return refuser(reponse, 401, "acces-distance-refuse");
    }

    const fichier = d.registre.lire();
    if (!fichier) return refuser(reponse, 503, "gestion-fermee");
    const id = calculerIdPoste(demande.clePublique);
    if (fichier.coupes.includes(id)) return refuser(reponse, 409, "poste-coupe");
    const duServeur = acces.postes.find((poste) => poste.id === id && poste.origine !== "distance");
    const actifs = fichier.postes.filter((poste) => poste.id !== id && (poste.expireLe === null || Date.parse(poste.expireLe) > maintenant));
    if (!duServeur && actifs.length >= POSTES_DISTANCE_MAX) return refuser(reponse, 409, "trop-de-postes");

    const duree = DUREES_POSTE_DISTANCE[demande.duree];
    const expireLe = duree === null ? null : maintenant + duree;
    let poste: PosteAutorise;
    if (duServeur) {
      poste = duServeur;
    } else {
      const ajouteLe = new Date(maintenant).toISOString();
      const clePublique = Buffer.from(demande.clePublique).toString("base64url");
      d.registre.ecrire({
        postes: [...actifs, { id, nom: demande.nom, clePublique, ajouteLe, expireLe: expireLe === null ? null : new Date(expireLe).toISOString() }],
        coupes: fichier.coupes,
      });
      poste = { id, nom: demande.nom, clePublique: demande.clePublique, origine: "distance", ajouteLe, expireLe };
    }
    const ouverte = await d.ouvrirSessionPour(poste);
    if (!duServeur && acces.distance.courriel) {
      const alerte = { type: "nouveau-poste" as const, nom: poste.nom, idPoste: id, le: maintenant, expireLe, pays: lirePays(requete) };
      void d.prevenir(acces.distance.courriel, alerte).catch(() => {});
    }
    reponse.status(201).json({ ok: true, ...ouverte });
  };
}
