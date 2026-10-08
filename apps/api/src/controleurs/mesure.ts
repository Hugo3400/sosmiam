import type { Request, Response } from "express";

import type { Vue } from "../services/mesure.ts";

const texte = (valeur: unknown, maximum: number) => (typeof valeur === "string" ? valeur.slice(0, maximum) : "");
/** Boutons de la page /liens (mêmes noms que apps/site-web/src/contenus/liens-publics.ts) */
const CIBLES_CLIC = ["site", "discord", "tiktok", "instagram"];

/**
 * POST /mesure/vue : le serveur du site signale une page vue, un passage de robot ou une page introuvable
 * (jamais le navigateur lui-même : l'API n'écoute qu'en local). Réponse immédiate : le comptage se fait ensuite.
 */
export function creerControleurVue(enregistrerVue: (vue: Vue) => Promise<void>) {
  return (requete: Request, reponse: Response) => {
    const corps = typeof requete.body === "object" && requete.body !== null ? requete.body : {};
    const adressePage = texte(corps.adressePage, 500);
    const ip = requete.get("x-ip-visiteur") ?? "";
    if (!adressePage.startsWith("/") || !ip) {
      return reponse.status(400).json({ ok: false, erreur: "requete-invalide" });
    }
    enregistrerVue({
      source: "site",
      adressePage,
      referent: texte(corps.referent, 500) || null,
      signature: texte(corps.signature, 400),
      ip: ip.slice(0, 64),
      pays: texte(corps.pays, 2).toUpperCase() || null,
      langues: texte(corps.langues, 200) || null,
      region: texte(corps.region, 80) || null,
      ville: texte(corps.ville, 80) || null,
      duree: typeof corps.duree === "number" && Number.isFinite(corps.duree) ? corps.duree : null,
      statut: corps.statut === 404 ? 404 : 200,
    }).catch((erreur: unknown) => console.error("Comptage d'une vue impossible :", erreur));
    reponse.status(204).end();
  };
}

/** POST /mesure/clic : un bouton de la page /liens a été cliqué (« tiktok », « discord »…). */
export function creerControleurClic(enregistrerClic: (cible: string) => Promise<void>) {
  return (requete: Request, reponse: Response) => {
    const cible = texte(requete.body?.cible, 30);
    if (!CIBLES_CLIC.includes(cible)) return reponse.status(400).json({ ok: false, erreur: "requete-invalide" });
    enregistrerClic(cible).catch((erreur: unknown) => console.error("Comptage d'un clic impossible :", erreur));
    reponse.status(204).end();
  };
}
