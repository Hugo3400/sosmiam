// Avis de l'app (voir routes/avis.ts) : lecture de la demande, réponse, et les points d'une photo posés une fois l'avis
// écrit (ajouterPoints de services/comptes.ts, raison « avis-photo »).
import type { Request, Response } from "express";

import { lireVerdictRelecture } from "../../../../packages/commun/src/fonctions/avis/lire-verdict-relecture.ts";
import type { NouvelAvis, NouvelAvisNonVerifie } from "../../../../packages/commun/src/types/avis.ts";
import { validerAvis } from "../../../../packages/commun/src/validation/valider-avis.ts";
import { validerAvisNonVerifie } from "../../../../packages/commun/src/validation/valider-avis-non-verifie.ts";
import { lireCurseurAvis } from "../fonctions/avis/lire-curseur-avis.ts";
import { lirePhotoAvis } from "../fonctions/avis/lire-photo-avis.ts";
import { resumerErreur } from "../fonctions/comptes/resumer-erreur.ts";
import { lireIdentifiant } from "../middlewares/proteger-pro.ts";
import { creerAvisClient, type AvisEcrit } from "../services/avis-client.ts";
import { creerAvisRelecture } from "../services/avis-relecture.ts";
import type { ContexteAvis, EchecAvis, ErreurAvis } from "../services/avis-regles.ts";
import { lireCompteId, lireCorps } from "./comptes-champs.ts";
import { champInvalide } from "./visites.ts";

export type DependancesAvis = Omit<ContexteAvis, "horloge"> & {
  /** ajouterPoints de services/comptes.ts */
  ajouterPoints: (compteId: number, points: number, raison: "avis-photo", detail?: string) => Promise<unknown>;
  /**
   * La photo envoyée avant l'avis existe-t-elle, et vient-elle de ce compte ? Absent (pas encore d'envoi de photo) : un
   * avis avec photo est refusé, 400 avis-invalide { champ: "photo" }
   */
  verifierPhoto?: (fichier: string, compteId: number) => Promise<boolean>;
};

/** Le statut HTTP de chaque refus (400 pour ce qui n'est pas listé) */
const STATUTS: Partial<Record<ErreurAvis, number>> = {
  introuvable: 404, "lieu-inconnu": 404,
  "role-requis": 403, "membre-du-lieu": 403, "mineur-bar": 403, "email-non-verifie": 403,
  "avis-pas-ouvert": 409, "avis-ferme": 409, "avis-deja-donne": 409, "avis-visite-requise": 409, "avis-recent": 409, "deja-relu": 409,
  "reponse-deja-donnee": 409,
};

/** Un refus des services des avis, tel quel (avec ses détails : date du prochain avis possible…) */
export function repondreEchecAvis(reponse: Response, e: EchecAvis) {
  const { ok: _ok, ...corps } = e;
  return reponse.status(STATUTS[e.erreur] ?? 400).json({ ok: false, ...corps });
}

const avisInvalide = (reponse: Response, champ?: string) => reponse.status(400).json({ ok: false, erreur: "avis-invalide", ...(champ ? { champ } : {}) });

export function creerControleursAvis(d: DependancesAvis, horloge: () => number) {
  const contexte = { ...d, horloge };
  const client = creerAvisClient(contexte);
  const relecture = creerAvisRelecture(contexte);

  /** La photo de la demande, vérifiée (null : pas de photo) ; undefined après avoir répondu 400 */
  async function lirePhoto(brut: unknown, compteId: number, reponse: Response): Promise<string | null | undefined> {
    const photo = lirePhotoAvis(brut);
    if (photo === null) return null;
    if (photo === undefined || !d.verifierPhoto || !(await d.verifierPhoto(photo, compteId))) return void avisInvalide(reponse, "photo");
    return photo;
  }

  /** Répond à l'écriture d'un avis, après avoir posé les points de sa photo (un raté est noté au journal, l'avis reste) */
  async function rendreAvis(reponse: Response, compteId: number, r: ({ ok: true } & AvisEcrit) | EchecAvis) {
    if (!r.ok) return repondreEchecAvis(reponse, r);
    if (r.pointsAPoser > 0) {
      await d.ajouterPoints(compteId, r.pointsAPoser, "avis-photo", `avis ${r.avisId}, lieu ${r.lieuId}`).catch((erreur: unknown) => {
        console.error("Avis : points non posés :", resumerErreur(erreur));
      });
    }
    reponse.status(201).json({ ok: true, pointsGagnes: r.pointsAPoser, avis: r.avis });
  }

  return {
    /** GET /app/avis/lieux/:lieuId (sans session) */
    async lireLieu(requete: Request, reponse: Response) {
      const lieuId = lireIdentifiant(requete.params.lieuId);
      if (lieuId === null) return champInvalide(reponse, "lieuId");
      const apres = lireCurseurAvis(requete.query.apres);
      if (apres === undefined) return champInvalide(reponse, "apres");
      const r = await client.lireAvisLieu(lieuId, apres);
      if (!r.ok) return repondreEchecAvis(reponse, r);
      reponse.set("Cache-Control", "public, max-age=60").json(r);
    },

    /** GET /app/avis/a-ecrire */
    async listerAEcrire(_q: Request, reponse: Response) {
      reponse.json(await client.listerAEcrire(lireCompteId(reponse)));
    },

    /** POST /app/avis { visiteId, note, texte, photo? } */
    async donner(requete: Request, reponse: Response) {
      const corps = lireCorps(requete);
      const compteId = lireCompteId(reponse);
      const nouvel = { visiteId: corps.visiteId, note: corps.note, texte: corps.texte, photo: corps.photo ?? null } as NouvelAvis;
      if (validerAvis(nouvel)) return avisInvalide(reponse);
      const photo = await lirePhoto(corps.photo, compteId, reponse);
      if (photo === undefined) return;
      await rendreAvis(reponse, compteId, await client.donnerAvis(compteId, { ...nouvel, photo }));
    },

    /** POST /app/avis/non-verifie { lieuId, note, texte, photo? } */
    async donnerNonVerifie(requete: Request, reponse: Response) {
      const corps = lireCorps(requete);
      const compteId = lireCompteId(reponse);
      const nouvel = { lieuId: corps.lieuId, note: corps.note, texte: corps.texte, photo: corps.photo ?? null } as NouvelAvisNonVerifie;
      if (validerAvisNonVerifie(nouvel)) return avisInvalide(reponse);
      const photo = await lirePhoto(corps.photo, compteId, reponse);
      if (photo === undefined) return;
      await rendreAvis(reponse, compteId, await client.donnerAvisNonVerifie(compteId, { ...nouvel, photo }));
    },

    /** GET /app/avis/a-relire (ambassadeur actif) */
    async listerARelire(_q: Request, reponse: Response) {
      reponse.json(await relecture.listerARelire(lireCompteId(reponse)));
    },

    /** POST /app/avis/:id/relecture { verdict } (ambassadeur actif) */
    async relire(requete: Request, reponse: Response) {
      const avisId = lireIdentifiant(requete.params.id);
      if (avisId === null) return champInvalide(reponse, "id");
      const verdict = lireVerdictRelecture(lireCorps(requete).verdict);
      if (!verdict) return champInvalide(reponse, "verdict");
      const r = await relecture.relire(lireCompteId(reponse), avisId, verdict);
      if (!r.ok) return repondreEchecAvis(reponse, r);
      reponse.status(201).json({ ok: true });
    },
  };
}
