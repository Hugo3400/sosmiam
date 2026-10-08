import type { Request, Response } from "express";

import type { Vue } from "../services/mesure.ts";

const texte = (valeur: unknown, maximum: number) => (typeof valeur === "string" ? valeur.slice(0, maximum) : "");

/**
 * POST /mesure/vue : le serveur du site signale une page vue (jamais le navigateur lui-même : l'API n'écoute qu'en local).
 * Réponse immédiate : le comptage se fait ensuite, sans jamais ralentir la page.
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
    }).catch((erreur: unknown) => console.error("Comptage d'une vue impossible :", erreur));
    reponse.status(204).end();
  };
}
