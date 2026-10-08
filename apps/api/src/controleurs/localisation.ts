import type { Request, Response } from "express";

import type { Commune } from "../services/localisation.ts";

/** Nombre reçu en JSON ou en texte ; NaN pour tout le reste (y compris une chaîne vide). */
function lireNombre(valeur: unknown): number {
  if (typeof valeur === "number") return valeur;
  return typeof valeur === "string" && valeur.trim() !== "" ? Number(valeur) : Number.NaN;
}

/**
 * Lit une position, l'arrondit à 3 décimales (environ 100 m) et renvoie la commune qui la contient.
 * La position n'est ni enregistrée ni écrite dans un journal.
 */
export function creerControleurLocalisation(trouver: (latitude: number, longitude: number) => Promise<Commune | null>) {
  return async (requete: Request, reponse: Response) => {
    const corps = typeof requete.body === "object" && requete.body !== null ? requete.body : {};
    const latitude = lireNombre(corps.latitude);
    const longitude = lireNombre(corps.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      return reponse.status(400).json({ ok: false, erreur: "position-invalide" });
    }
    const arrondir = (nombre: number) => Math.round(nombre * 1000) / 1000;
    let commune: Commune | null;
    try {
      commune = await trouver(arrondir(latitude), arrondir(longitude));
    } catch {
      return reponse.status(502).json({ ok: false, erreur: "service-indisponible" });
    }
    if (!commune) return reponse.status(404).json({ ok: false, erreur: "hors-de-france" });
    reponse.json({ ok: true, ...commune });
  };
}
