import type { NextFunction, Request, Response } from "express";

/** Adresses de la fenêtre du logiciel de gestion (Tauri, sous Windows puis ailleurs) */
const ORIGINES_TAURI = ["http://tauri.localhost", "https://tauri.localhost", "tauri://localhost"];

/**
 * Permet à la fenêtre du logiciel de gestion d'appeler l'API (CORS). Ce n'est pas une protection : c'est la signature
 * de chaque demande qui en sert. ORIGINES_GESTION (séparées par des virgules) ajoute l'adresse d'un essai en local.
 */
export function autoriserOriginesGestion(supplementaires = (process.env.ORIGINES_GESTION ?? "").split(",").map((o) => o.trim()).filter(Boolean)) {
  const origines = new Set([...ORIGINES_TAURI, ...supplementaires]);
  return (requete: Request, reponse: Response, suite: NextFunction) => {
    const origine = requete.get("origin");
    if (origine && origines.has(origine)) {
      reponse.set({
        "Access-Control-Allow-Origin": origine,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
        "Access-Control-Allow-Headers":
          "Content-Type, X-Gestion-Poste, X-Gestion-Horodatage, X-Gestion-Nonce, X-Gestion-Session, X-Gestion-Signature",
        "Access-Control-Max-Age": "600",
        Vary: "Origin",
      });
    }
    if (requete.method === "OPTIONS") return reponse.status(204).end();
    suite();
  };
}
