// Avis de l'app (voir routes/avis.ts) : lecture de la demande et réponse. Les points d'une photo sont posés AVEC l'avis,
// dans sa transaction (services/avis-client.ts) ; seuls les défis sont relancés après, sans les attendre.
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
import type { PhotosAvis } from "../services/photos-avis.ts";
import { lireCompteId, lireCorps } from "./comptes-champs.ts";
import { champInvalide } from "./visites.ts";

export type DependancesAvis = Omit<ContexteAvis, "horloge"> & {
  /**
   * Inutilisé : les points de la photo sont posés dans la transaction de l'avis (TablesAvis.poserPointsPhoto), plus jamais
   * après. Accepté (et ignoré) pour ne pas casser un branchement qui le passe encore.
   */
  ajouterPoints?: (compteId: number, points: number, raison: "avis-photo", detail?: string) => Promise<unknown>;
  /**
   * reevaluer de services/defis.ts : relancé sans l'attendre après un avis qui rapporte des points, comme le faisait
   * l'emballage d'ajouterPoints (un raté est seulement noté au journal). Absent : GET /app/defis rattrape (il réévalue d'abord)
   */
  reevaluerDefis?: (compteId: number, maintenant: Date) => Promise<unknown>;
  /**
   * La photo envoyée avant l'avis existe-t-elle, et vient-elle de ce compte ? Absent (pas encore d'envoi de photo) : un
   * avis avec photo est refusé, 400 avis-invalide { champ: "photo" }
   */
  verifierPhoto?: (fichier: string, compteId: number) => Promise<boolean>;
  photos?: Pick<PhotosAvis, "deposer" | "lirePublique">;
};

/** Le statut HTTP de chaque refus (400 pour ce qui n'est pas listé) */
const STATUTS: Partial<Record<ErreurAvis, number>> = {
  introuvable: 404, "lieu-inconnu": 404,
  "role-requis": 403, "membre-du-lieu": 403, "email-non-verifie": 403,
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

  const photosEnCours = new Set<string>();

  async function ecrireAvecPhoto(brut: unknown, compteId: number, reponse: Response, ecrire: (photo: string | null) => Promise<unknown>) {
    const photo = lirePhotoAvis(brut);
    if (photo === null) return ecrire(null);
    if (photo === undefined || !d.verifierPhoto || photosEnCours.has(photo)) return void avisInvalide(reponse, "photo");
    photosEnCours.add(photo);
    try {
      if (!(await d.verifierPhoto(photo, compteId))) return void avisInvalide(reponse, "photo");
      await ecrire(photo);
    } finally {
      photosEnCours.delete(photo);
    }
  }

  /**
   * Répond à l'écriture d'un avis : ses points sont déjà posés avec lui (s'ils avaient raté, rien ne serait écrit et la
   * demande serait partie en erreur) ; puis relance les défis, sans les attendre ni jamais lever
   */
  function rendreAvis(reponse: Response, compteId: number, r: ({ ok: true } & AvisEcrit) | EchecAvis) {
    if (!r.ok) return repondreEchecAvis(reponse, r);
    reponse.status(201).json({ ok: true, pointsGagnes: r.pointsGagnes, avis: r.avis });
    const reevaluer = d.reevaluerDefis;
    if (r.pointsGagnes > 0 && reevaluer) {
      Promise.resolve()
        .then(() => reevaluer(compteId, new Date(horloge())))
        .catch((erreur: unknown) => console.error("Avis : défis non réévalués :", resumerErreur(erreur)));
    }
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
      await ecrireAvecPhoto(corps.photo, compteId, reponse, async (photo) => rendreAvis(reponse, compteId, await client.donnerAvis(compteId, { ...nouvel, photo })));
    },

    /** POST /app/avis/non-verifie { lieuId, note, texte, photo? } */
    async donnerNonVerifie(requete: Request, reponse: Response) {
      const corps = lireCorps(requete);
      const compteId = lireCompteId(reponse);
      const nouvel = { lieuId: corps.lieuId, note: corps.note, texte: corps.texte, photo: corps.photo ?? null } as NouvelAvisNonVerifie;
      if (validerAvisNonVerifie(nouvel)) return avisInvalide(reponse);
      await ecrireAvecPhoto(corps.photo, compteId, reponse, async (photo) => rendreAvis(reponse, compteId, await client.donnerAvisNonVerifie(compteId, { ...nouvel, photo })));
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
