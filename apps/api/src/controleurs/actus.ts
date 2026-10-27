import type { Request, Response } from "express";

import { RUBRIQUES_ACTUS } from "../../../../packages/commun/src/regles/actus.ts";
import { lireCorpsArticleActus } from "../fonctions/actus/lire-corps-article-actus.ts";
import { lireCurseurActus } from "../fonctions/actus/lire-curseur-actus.ts";
import { lireIdentifiant } from "../middlewares/proteger-pro.ts";
import type { CompteSession } from "../middlewares/proteger-comptes.ts";
import type { ActusAuteur } from "../services/actus-auteur.ts";
import type { ActusCommentaires } from "../services/actus-commentaires.ts";
import type { ActusLecture } from "../services/actus-lecture.ts";
import type { EchecActus } from "../services/actus-regles.ts";
import { ATTENTE_STOCKAGE_PLEIN_PHOTOS_AVIS_SECONDES, type RefusPhotoAvis } from "../services/photos-avis-regles.ts";
import type { PhotosActus } from "../services/photos-actus.ts";
import { lireCompteId, lireCorps } from "./comptes-champs.ts";

export type DependancesActus = { lecture: ActusLecture; auteur: ActusAuteur; photos: PhotosActus; commentaires: ActusCommentaires };

const STATUTS: Partial<Record<EchecActus["erreur"], number>> = {
  introuvable: 404, "lieu-inconnu": 404, "role-requis": 403, "membre-du-lieu": 403,
  "limite-actus-semaine": 409, "reponse-deja-donnee": 409, "transition-interdite": 409,
};

const CACHE_PUBLIC = "public, max-age=60";
const CACHE_IMAGE = "public, max-age=31536000, immutable";
const VILLE_MAX = 80;

export function repondreEchecActus(reponse: Response, e: EchecActus) {
  const { ok: _ok, ...corps } = e;
  return reponse.status(STATUTS[e.erreur] ?? 400).json({ ok: false, ...corps });
}

export function repondreRefusPhotoActus(reponse: Response, refus: RefusPhotoAvis) {
  if (refus.erreur === "stockage-plein") {
    reponse.set("Retry-After", String(ATTENTE_STOCKAGE_PLEIN_PHOTOS_AVIS_SECONDES));
    return reponse.status(503).json({ ok: false, erreur: "service-indisponible" });
  }
  if (refus.erreur === "media-trop-lourd") return reponse.status(413).json({ ok: false, erreur: "photo-actus-trop-lourde" });
  return reponse.status(refus.erreur === "format-refuse" ? 415 : 400).json({ ok: false, erreur: "photo-actus-invalide" });
}

const compteDe = (reponse: Response) => (reponse.locals.compte as CompteSession | undefined)?.id ?? null;

const envoyerImage = (reponse: Response, octets: Buffer, cache: string) =>
  reponse.status(200).set({ "Content-Type": "image/jpeg", "Content-Disposition": "inline", "X-Content-Type-Options": "nosniff", "Cache-Control": cache }).send(octets);

export function creerControleursActus({ lecture, auteur, photos }: DependancesActus) {
  return {
    async lister(requete: Request, reponse: Response) {
      const { rubrique: r, ville: v, curseur: c } = requete.query;
      const rubrique = r === undefined ? null : RUBRIQUES_ACTUS.find((x) => x === r);
      const ville = typeof v === "string" && v.trim().length > 0 && v.length <= VILLE_MAX ? v.trim() : v === undefined ? null : undefined;
      const curseur = c === undefined ? null : lireCurseurActus(c);
      if (rubrique === undefined) return reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: "rubrique" });
      if (ville === undefined) return reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: "ville" });
      if (curseur === null && c !== undefined) return reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: "curseur" });
      const compteId = compteDe(reponse);
      const page = await lecture.lister({ rubrique, ville, curseur, avecAlcool: compteId !== null, compteId });
      reponse.set("Cache-Control", compteId === null ? CACHE_PUBLIC : "private, no-store").json({ ok: true, ...page });
    },

    async villes(_requete: Request, reponse: Response) {
      const compteId = compteDe(reponse);
      const villes = await lecture.villes(compteId !== null);
      reponse.set("Cache-Control", compteId === null ? CACHE_PUBLIC : "private, no-store").json({ ok: true, villes });
    },

    async lire(requete: Request, reponse: Response) {
      const id = lireIdentifiant(requete.params.id);
      const compteId = compteDe(reponse);
      const article = id ? await lecture.lire(id, compteId !== null, compteId) : null;
      if (!article) return reponse.status(404).set("Cache-Control", "no-store").json({ ok: false, erreur: "article-introuvable" });
      reponse.set("Cache-Control", compteId === null ? CACHE_PUBLIC : "private, no-store").json({ ok: true, article });
    },

    async image(requete: Request, reponse: Response) {
      const octets = await photos.lirePublique(String(requete.params.nom));
      if (!octets) return reponse.status(404).set("Cache-Control", "no-store").json({ ok: false, erreur: "introuvable" });
      envoyerImage(reponse, octets, CACHE_IMAGE);
    },

    async abonnements(_requete: Request, reponse: Response) {
      reponse.json({ ok: true, articles: await lecture.abonnements(lireCompteId(reponse)) });
    },

    async aimer(requete: Request, reponse: Response) {
      const id = lireIdentifiant(requete.params.id);
      const resultat = id ? await lecture.aimer(lireCompteId(reponse), id, requete.method === "POST") : null;
      if (!resultat) return reponse.status(404).json({ ok: false, erreur: "article-introuvable" });
      reponse.json({ ok: true, ...resultat });
    },

    async deposerPhoto(requete: Request, reponse: Response) {
      const corps: unknown = requete.body;
      if (!Buffer.isBuffer(corps) || corps.length === 0) return repondreRefusPhotoActus(reponse, { ok: false, erreur: "format-refuse" });
      const r = await photos.deposer(lireCompteId(reponse), corps);
      if (!r.ok) return repondreRefusPhotoActus(reponse, r);
      reponse.status(201).json({ ok: true, photo: r.photo });
    },

    async envoyer(requete: Request, reponse: Response) {
      const corps = lireCorpsArticleActus(lireCorps(requete));
      if (!corps) return reponse.status(400).json({ ok: false, erreur: "article-invalide" });
      const r = await auteur.envoyer(lireCompteId(reponse), corps);
      if (!r.ok) return repondreEchecActus(reponse, r);
      reponse.status(201).json({ ok: true, id: r.id });
    },

    async mesArticles(_requete: Request, reponse: Response) {
      reponse.json({ ok: true, ...(await auteur.mesArticles(lireCompteId(reponse))) });
    },

    async lireBrouillon(requete: Request, reponse: Response) {
      const id = lireIdentifiant(requete.params.id);
      const brouillon = id ? await auteur.lireBrouillon(lireCompteId(reponse), id) : null;
      if (!brouillon) return reponse.status(404).json({ ok: false, erreur: "introuvable" });
      reponse.json({ ok: true, brouillon });
    },

    async retoucher(requete: Request, reponse: Response) {
      const id = lireIdentifiant(requete.params.id);
      const corps = lireCorpsArticleActus(lireCorps(requete));
      if (!id) return reponse.status(404).json({ ok: false, erreur: "introuvable" });
      if (!corps) return reponse.status(400).json({ ok: false, erreur: "article-invalide" });
      const r = await auteur.retoucher(lireCompteId(reponse), id, corps);
      if (!r.ok) return repondreEchecActus(reponse, r);
      reponse.json({ ok: true });
    },

    async supprimer(requete: Request, reponse: Response) {
      const id = lireIdentifiant(requete.params.id);
      const r = id ? await auteur.supprimer(lireCompteId(reponse), id) : null;
      if (!r || !r.ok) return reponse.status(404).json({ ok: false, erreur: "introuvable" });
      reponse.json({ ok: true });
    },

    async monImage(requete: Request, reponse: Response) {
      const octets = await photos.lireDuCompte(String(requete.params.nom), lireCompteId(reponse));
      if (!octets) return reponse.status(404).json({ ok: false, erreur: "introuvable" });
      envoyerImage(reponse, octets, "private, no-store");
    },
  };
}
